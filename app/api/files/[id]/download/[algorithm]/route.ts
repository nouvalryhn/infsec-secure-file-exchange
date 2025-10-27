import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FileEncryptionOrchestrator } from '@/lib/services/file-encryption-orchestrator';
import { KeyManager } from '@/lib/encryption';
import { Algorithm } from '@/types/encryption';
import { checkFileAccess } from '@/lib/services/access-control';
import { withErrorHandler, createAuthenticationError, createValidationError, createNotFoundError, createEncryptionError } from '@/lib/error-handler';
import { fileLogger, encryptionLogger, sharingLogger } from '@/lib/logger';

async function downloadHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; algorithm: string }> }
) {
  // Check authentication
  const session = await getSession();
  if (!session?.userId) {
    throw createAuthenticationError('UNAUTHORIZED', 'Authentication required');
  }

  const { id: fileId, algorithm } = await params;

  // Validate algorithm parameter
  const validAlgorithms = ['aes', 'des', 'rc4'];
  if (!validAlgorithms.includes(algorithm.toLowerCase())) {
    throw createValidationError('INVALID_ALGORITHM', 'Invalid algorithm specified');
  }

  const algorithmEnum = algorithm.toUpperCase() as Algorithm;

  // Verify user has access to the file
  const accessResult = await checkFileAccess(session.userId, fileId);
  if (!accessResult.hasAccess) {
    throw createNotFoundError('FILE_NOT_FOUND', 'File not found or access denied');
  }
  const accessType = accessResult.accessType;

  // Get file details including owner's session key for decryption
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      user: {
        select: {
          username: true,
          sessionKey: true
        }
      },
      metrics: {
        where: {
          algorithm: algorithmEnum
        }
      }
    }
  });

  if (!file) {
    throw createNotFoundError('FILE_NOT_FOUND', 'File not found');
  }

  // Log access attempt
  sharingLogger.shareAccessAttempt(
    session.userId,
    session.username,
    fileId,
    file.originalName,
    true,
    accessType
  );

  // Initialize orchestrator
  const orchestrator = new FileEncryptionOrchestrator();

  try {
    // Use the file owner's session key for decryption (not the current user's session key)
    if (!file.user.sessionKey) {
      throw new Error('File owner does not have a session key. File cannot be decrypted.');
    }
    
    const ownerSessionKeyBuffer = Buffer.from(file.user.sessionKey, 'base64');
    const fileKey = KeyManager.deriveFileKey(ownerSessionKeyBuffer, fileId, algorithmEnum);

    // Decrypt the file (IV extraction is handled inside the orchestrator)
    const decryptionResult = await orchestrator.decryptFile(algorithmEnum, fileId, fileKey);
    const decryptedBuffer = decryptionResult.plaintext;
    const decryptionTime = decryptionResult.decryptionTime;

    // Log successful decryption
    encryptionLogger.decryptionOperation(
      session.userId,
      fileId,
      algorithmEnum,
      decryptionTime,
      true
    );

    // Log file download
    fileLogger.fileDownloaded(
      session.userId,
      session.username,
      fileId,
      file.originalName,
      algorithmEnum
    );

    // Update decryption time in metrics
    if (file.metrics.length > 0) {
      await prisma.encryptionMetric.update({
        where: {
          id: file.metrics[0].id
        },
        data: {
          decryptionTime: decryptionTime
        }
      });
    }

    // Determine content type based on file type and original mime type
    let contentType = file.mimeType;
    if (!contentType) {
      // Fallback content types
      if (file.fileType === 'EXCEL') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (file.fileType === 'IMAGE') {
        contentType = 'image/jpeg'; // Default for images
      } else {
        contentType = 'application/octet-stream';
      }
    }

    // Create response with decrypted file
    const response = new NextResponse(new Uint8Array(decryptedBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': decryptedBuffer.length.toString(),
        'X-Decryption-Time': decryptionTime.toString(),
        'X-Algorithm-Used': algorithmEnum,
      }
    });

    return response;

  } catch (decryptionError) {
    // Log decryption error
    encryptionLogger.decryptionError(
      session.userId,
      fileId,
      algorithmEnum,
      decryptionError instanceof Error ? decryptionError.message : 'Unknown error'
    );
    
    throw createEncryptionError('DECRYPTION_FAILED', 'Failed to decrypt file', {
      algorithm: algorithmEnum,
      fileId,
      error: decryptionError instanceof Error ? decryptionError.message : 'Unknown error'
    });
  }
}

export const GET = withErrorHandler(downloadHandler);