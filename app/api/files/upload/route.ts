import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';
import { DataType } from '@/types/encryption';
import { FileType } from '@prisma/client';
import { FileEncryptionOrchestrator } from '@/lib/services/file-encryption-orchestrator';
import { FinancialReportService } from '@/lib/services/financial-report-service';
import { FileMetadataService } from '@/lib/services/file-metadata-service';
import { withErrorHandler, createAuthenticationError, createValidationError } from '@/lib/error-handler';
import { fileLogger, encryptionLogger } from '@/lib/logger';

// Allowed file types
const allowedMimeTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit





async function uploadHandler(request: NextRequest) {
  // Check authentication
  const session = await getSession();
  if (!session?.userId) {
    throw createAuthenticationError('UNAUTHORIZED', 'Authentication required');
  }

  // Initialize services
  const orchestrator = new FileEncryptionOrchestrator();
  const reportService = new FinancialReportService();
  const metadataService = new FileMetadataService();

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw createValidationError('NO_FILE', 'No file uploaded');
  }

  // Validate file type
  if (!allowedMimeTypes.includes(file.type)) {
    throw createValidationError('INVALID_FILE_TYPE', 'Invalid file type. Only Excel files and images are allowed.');
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw createValidationError('FILE_TOO_LARGE', `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const fileId = randomUUID();

  // Determine file type
  let fileType: FileType;
  if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
    fileType = FileType.EXCEL;
  } else if (file.type.startsWith('image/')) {
    fileType = FileType.IMAGE;
  } else {
    throw createValidationError('UNSUPPORTED_FILE_TYPE', 'Unsupported file type');
  }

  // Log file upload attempt
  fileLogger.fileUploaded(
    session.userId,
    session.username,
    fileId,
    file.name,
    file.size,
    fileType
  );

  // Extract financial data if it's an Excel file
  let financialData: Record<string, any> = {};
  if (fileType === FileType.EXCEL) {
    financialData = reportService.extractFinancialData(fileBuffer);
  }

  // Derive keys from session key for consistent encryption/decryption
  const sessionKeyBuffer = Buffer.from(session.sessionKey, 'base64');

  // Encrypt file with all three algorithms using orchestrator with derived keys
  const encryptionResults = await orchestrator.encryptFileWithDerivedKeys(fileBuffer, fileId, sessionKeyBuffer);

  // Log encryption operations
  const dataType = fileType === FileType.EXCEL ? DataType.SPREADSHEET : DataType.IMAGE;

  encryptionLogger.encryptionOperation(
    session.userId,
    fileId,
    'AES',
    encryptionResults.aes.encryptionTime,
    encryptionResults.aes.ciphertextSize,
    dataType
  );

  encryptionLogger.encryptionOperation(
    session.userId,
    fileId,
    'DES',
    encryptionResults.des.encryptionTime,
    encryptionResults.des.ciphertextSize,
    dataType
  );

  encryptionLogger.encryptionOperation(
    session.userId,
    fileId,
    'RC4',
    encryptionResults.rc4.encryptionTime,
    encryptionResults.rc4.ciphertextSize,
    dataType
  );

  // Create file metadata and encryption metrics
  const result = await metadataService.createFileMetadata({
    id: fileId,
    userId: session.userId,
    originalName: file.name,
    fileType,
    originalSize: file.size,
    mimeType: file.type,
    encryptionResults
  });

  // Create financial report if Excel file with data
  if (fileType === FileType.EXCEL && Object.keys(financialData).length > 0) {
    const sessionKeyBuffer = Buffer.from(session.sessionKey, 'base64');
    await reportService.createEncryptedFinancialReport(fileId, session.userId, financialData, sessionKeyBuffer);
  }

  return NextResponse.json({
    success: true,
    file: {
      id: result.id,
      originalName: result.originalName,
      fileType: result.fileType,
      uploadedAt: result.uploadedAt,
      originalSize: result.originalSize,
      mimeType: result.mimeType
    },
    encryptionMetrics: {
      aes: {
        encryptionTime: encryptionResults.aes.encryptionTime,
        ciphertextSize: encryptionResults.aes.ciphertextSize
      },
      des: {
        encryptionTime: encryptionResults.des.encryptionTime,
        ciphertextSize: encryptionResults.des.ciphertextSize
      },
      rc4: {
        encryptionTime: encryptionResults.rc4.encryptionTime,
        ciphertextSize: encryptionResults.rc4.ciphertextSize
      }
    },
    financialDataExtracted: Object.keys(financialData).length
  });
}

export const POST = withErrorHandler(uploadHandler);