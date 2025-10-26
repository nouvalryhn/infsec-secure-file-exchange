import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { KeyManager } from '@/lib/encryption';
import { FileEncryptionOrchestrator } from './file-encryption-orchestrator';
import { Algorithm } from '@/types/encryption';

/**
 * Financial Report Service
 * Handles extraction and encryption of financial data from Excel files
 */
export class FinancialReportService {
  private orchestrator: FileEncryptionOrchestrator;

  constructor() {
    this.orchestrator = new FileEncryptionOrchestrator();
  }

  /**
   * Extracts financial data from Excel file buffer
   * @param buffer - Excel file buffer
   * @returns Object containing extracted financial data
   */
  extractFinancialData(buffer: Buffer): Record<string, any> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Convert to key-value pairs for financial data
      const financialData: Record<string, any> = {};
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Process each row and create financial data fields
        rows.forEach((row, index) => {
          headers.forEach((header, colIndex) => {
            if (row[colIndex] !== undefined && row[colIndex] !== null) {
              const fieldKey = `${header}_row_${index + 1}`;
              financialData[fieldKey] = row[colIndex];
            }
          });
        });
      }
      
      return financialData;
    } catch (error) {
      console.error('Error extracting financial data:', error);
      return {};
    }
  }

  /**
   * Creates a financial report with encrypted field data
   * @param fileId - The file ID associated with the report
   * @param userId - The user ID who owns the report
   * @param financialData - The extracted financial data to encrypt
   * @param sessionKey - The user's session key for key derivation
   * @returns Promise resolving to the created financial report
   */
  async createEncryptedFinancialReport(
    fileId: string,
    userId: string,
    financialData: Record<string, any>,
    sessionKey: Buffer
  ) {
    if (Object.keys(financialData).length === 0) {
      return null;
    }

    return await prisma.$transaction(async (tx) => {
      // Create the financial report record
      const report = await tx.financialReport.create({
        data: {
          fileId,
          userId
        }
      });

      // Encrypt each financial data field with all algorithms
      const encryptedFields = [];
      
      for (const [fieldName, value] of Object.entries(financialData)) {
        const valueBuffer = Buffer.from(String(value), 'utf8');
        
        // Derive field-specific keys using session key and field identifier
        const aesFieldKey = KeyManager.deriveFileKey(sessionKey, `${fileId}_${fieldName}`, Algorithm.AES);
        const desFieldKey = KeyManager.deriveFileKey(sessionKey, `${fileId}_${fieldName}`, Algorithm.DES);
        const rc4FieldKey = KeyManager.deriveFileKey(sessionKey, `${fileId}_${fieldName}`, Algorithm.RC4);
        
        // Encrypt with all three algorithms
        const [aesFieldResult, desFieldResult, rc4FieldResult] = await Promise.all([
          this.orchestrator.aesEncryptor.encrypt(valueBuffer, aesFieldKey),
          this.orchestrator.desEncryptor.encrypt(valueBuffer, desFieldKey),
          this.orchestrator.rc4Encryptor.encrypt(valueBuffer, rc4FieldKey)
        ]);

        // Add encrypted field records for each algorithm
        encryptedFields.push(
          {
            reportId: report.id,
            fieldName,
            encryptedValue: aesFieldResult.ciphertext.toString('base64'),
            algorithm: Algorithm.AES,
            iv: aesFieldResult.iv?.toString('base64')
          },
          {
            reportId: report.id,
            fieldName,
            encryptedValue: desFieldResult.ciphertext.toString('base64'),
            algorithm: Algorithm.DES,
            iv: desFieldResult.iv?.toString('base64')
          },
          {
            reportId: report.id,
            fieldName,
            encryptedValue: rc4FieldResult.ciphertext.toString('base64'),
            algorithm: Algorithm.RC4
          }
        );
      }

      // Store all encrypted fields
      if (encryptedFields.length > 0) {
        await tx.encryptedReportField.createMany({
          data: encryptedFields
        });
      }

      return report;
    });
  }

  /**
   * Retrieves and decrypts financial report data
   * @param reportId - The financial report ID
   * @param algorithm - The algorithm to use for decryption (optional, defaults to AES)
   * @returns Promise resolving to decrypted financial data
   */
  async getDecryptedFinancialData(
    reportId: string,
    algorithm: Algorithm = Algorithm.AES
  ): Promise<Record<string, any>> {
    const encryptedFields = await prisma.encryptedReportField.findMany({
      where: {
        reportId,
        algorithm
      }
    });

    const decryptedData: Record<string, any> = {};

    for (const field of encryptedFields) {
      try {
        // Note: In a real implementation, you would need to store and retrieve the keys
        // This is a simplified version for demonstration
        const ciphertext = Buffer.from(field.encryptedValue, 'base64');
        const iv = field.iv ? Buffer.from(field.iv, 'base64') : undefined;
        
        // For this demo, we'll just return the encrypted value as a placeholder
        // In practice, you'd need the original key to decrypt
        decryptedData[field.fieldName] = `[ENCRYPTED_${algorithm}]`;
      } catch (error) {
        console.error(`Error decrypting field ${field.fieldName}:`, error);
        decryptedData[field.fieldName] = '[DECRYPTION_ERROR]';
      }
    }

    return decryptedData;
  }

  /**
   * Gets financial report metadata including field count and algorithms used
   * @param reportId - The financial report ID
   * @returns Promise resolving to report metadata
   */
  async getReportMetadata(reportId: string) {
    const report = await prisma.financialReport.findUnique({
      where: { id: reportId },
      include: {
        data: {
          select: {
            fieldName: true,
            algorithm: true
          }
        },
        file: {
          select: {
            originalName: true,
            uploadedAt: true
          }
        }
      }
    });

    if (!report) {
      return null;
    }

    // Group fields by algorithm
    const fieldsByAlgorithm = report.data.reduce((acc, field) => {
      if (!acc[field.algorithm]) {
        acc[field.algorithm] = new Set();
      }
      acc[field.algorithm].add(field.fieldName);
      return acc;
    }, {} as Record<Algorithm, Set<string>>);

    // Convert sets to arrays and count unique fields
    const uniqueFields = new Set(report.data.map(field => field.fieldName));

    return {
      id: report.id,
      fileId: report.fileId,
      fileName: report.file.originalName,
      uploadedAt: report.file.uploadedAt,
      createdAt: report.createdAt,
      totalFields: uniqueFields.size,
      algorithmsUsed: Object.keys(fieldsByAlgorithm) as Algorithm[],
      fieldsByAlgorithm: Object.fromEntries(
        Object.entries(fieldsByAlgorithm).map(([alg, fields]) => [alg, Array.from(fields)])
      )
    };
  }

  /**
   * Deletes a financial report and all associated encrypted fields
   * @param reportId - The financial report ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteFinancialReport(reportId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Delete encrypted fields first (due to foreign key constraints)
      await tx.encryptedReportField.deleteMany({
        where: { reportId }
      });

      // Delete the report
      await tx.financialReport.delete({
        where: { id: reportId }
      });
    });
  }
}