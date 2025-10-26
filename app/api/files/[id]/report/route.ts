import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { KeyManager } from '@/lib/encryption';
import { AESEncryptor, DESEncryptor, RC4Encryptor } from '@/lib/encryption';
import { Algorithm } from '@/types/encryption';
import { verifyFileAccess } from '@/lib/services/access-control';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: fileId } = await params;

    // Verify user has access to the file
    try {
      await verifyFileAccess(session.userId, fileId);
    } catch (error) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    // Get file details
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        report: {
          include: {
            data: true
          }
        },
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (!file.report) {
      return NextResponse.json({ error: 'No financial report found for this file' }, { status: 404 });
    }

    // Initialize encryptors
    const aesEncryptor = new AESEncryptor();
    const desEncryptor = new DESEncryptor();
    const rc4Encryptor = new RC4Encryptor();

    // Get session key for key derivation
    const sessionKeyBuffer = Buffer.from(session.sessionKey, 'base64');

    // Group encrypted fields by field name and algorithm
    const fieldsByName: Record<string, Record<Algorithm, any>> = {};
    
    for (const encryptedField of file.report.data) {
      if (!fieldsByName[encryptedField.fieldName]) {
        fieldsByName[encryptedField.fieldName] = {} as Record<Algorithm, any>;
      }
      
      fieldsByName[encryptedField.fieldName][encryptedField.algorithm] = {
        encryptedValue: encryptedField.encryptedValue,
        iv: encryptedField.iv
      };
    }

    // Decrypt all fields for all algorithms
    const decryptedData: Record<string, Record<Algorithm, any>> = {};
    const decryptionTimes: Record<Algorithm, number[]> = {
      [Algorithm.AES]: [],
      [Algorithm.DES]: [],
      [Algorithm.RC4]: []
    };

    for (const [fieldName, algorithms] of Object.entries(fieldsByName)) {
      decryptedData[fieldName] = {} as Record<Algorithm, any>;

      for (const [algorithm, data] of Object.entries(algorithms)) {
        const alg = algorithm as Algorithm;
        
        try {
          // Derive field-specific key for this algorithm
          const fieldKey = KeyManager.deriveFileKey(
            sessionKeyBuffer, 
            `${fileId}_${fieldName}`, 
            alg
          );

          const ciphertext = Buffer.from(data.encryptedValue, 'base64');
          const iv = data.iv ? Buffer.from(data.iv, 'base64') : undefined;

          let encryptor;
          switch (alg) {
            case Algorithm.AES:
              encryptor = aesEncryptor;
              break;
            case Algorithm.DES:
              encryptor = desEncryptor;
              break;
            case Algorithm.RC4:
              encryptor = rc4Encryptor;
              break;
            default:
              throw new Error(`Unsupported algorithm: ${alg}`);
          }

          // Decrypt the field value
          const startTime = performance.now();
          const decryptionResult = await encryptor.decrypt(ciphertext, fieldKey, iv);
          const decryptionTime = performance.now() - startTime;

          // Store decryption time for metrics
          decryptionTimes[alg].push(decryptionTime);

          // Convert decrypted buffer back to original value
          const decryptedValue = decryptionResult.plaintext.toString('utf8');
          
          // Try to parse as number if it looks like one
          let parsedValue: any = decryptedValue;
          if (!isNaN(Number(decryptedValue)) && decryptedValue.trim() !== '') {
            parsedValue = Number(decryptedValue);
          }

          decryptedData[fieldName][alg] = {
            value: parsedValue,
            decryptionTime: decryptionTime
          };

        } catch (error) {
          console.error(`Error decrypting field ${fieldName} with ${alg}:`, error);
          decryptedData[fieldName][alg] = {
            value: '[DECRYPTION_ERROR]',
            decryptionTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    // Calculate average decryption times
    const avgDecryptionTimes = {
      [Algorithm.AES]: decryptionTimes[Algorithm.AES].length > 0 
        ? decryptionTimes[Algorithm.AES].reduce((a, b) => a + b, 0) / decryptionTimes[Algorithm.AES].length 
        : 0,
      [Algorithm.DES]: decryptionTimes[Algorithm.DES].length > 0 
        ? decryptionTimes[Algorithm.DES].reduce((a, b) => a + b, 0) / decryptionTimes[Algorithm.DES].length 
        : 0,
      [Algorithm.RC4]: decryptionTimes[Algorithm.RC4].length > 0 
        ? decryptionTimes[Algorithm.RC4].reduce((a, b) => a + b, 0) / decryptionTimes[Algorithm.RC4].length 
        : 0
    };

    return NextResponse.json({
      success: true,
      report: {
        id: file.report.id,
        fileId: file.id,
        fileName: file.originalName,
        uploadedAt: file.uploadedAt,
        createdAt: file.report.createdAt,
        owner: {
          username: file.user.username
        },
        isOwner: file.userId === session.userId
      },
      data: decryptedData,
      metrics: {
        totalFields: Object.keys(decryptedData).length,
        algorithmsUsed: [Algorithm.AES, Algorithm.DES, Algorithm.RC4],
        averageDecryptionTimes: avgDecryptionTimes,
        totalDecryptionOperations: {
          [Algorithm.AES]: decryptionTimes[Algorithm.AES].length,
          [Algorithm.DES]: decryptionTimes[Algorithm.DES].length,
          [Algorithm.RC4]: decryptionTimes[Algorithm.RC4].length
        }
      }
    });

  } catch (error) {
    console.error('Financial report retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}