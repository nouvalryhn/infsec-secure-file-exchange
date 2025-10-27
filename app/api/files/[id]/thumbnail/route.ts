import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FileEncryptionOrchestrator } from '@/lib/services/file-encryption-orchestrator';
import { KeyManager } from '@/lib/encryption';
import { Algorithm } from '@/types/encryption';
import { checkFileAccess } from '@/lib/services/access-control';
import { withErrorHandler, createAuthenticationError, createValidationError, createNotFoundError } from '@/lib/error-handler';
import sharp from 'sharp';

async function thumbnailHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const session = await getSession();
  if (!session?.userId) {
    throw createAuthenticationError('UNAUTHORIZED', 'Authentication required');
  }

  const { id: fileId } = await params;

  // Verify user has access to the file
  const accessResult = await checkFileAccess(session.userId, fileId);
  if (!accessResult.hasAccess) {
    throw createNotFoundError('FILE_NOT_FOUND', 'File not found or access denied');
  }

  // Get file details including owner's session key for decryption
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      originalName: true,
      fileType: true,
      mimeType: true,
      user: {
        select: {
          sessionKey: true
        }
      }
    }
  });

  if (!file) {
    throw createNotFoundError('FILE_NOT_FOUND', 'File not found');
  }

  // Only generate thumbnails for images
  if (file.fileType !== 'IMAGE') {
    throw createValidationError('INVALID_FILE_TYPE', 'Thumbnails are only available for images');
  }

  try {
    // Initialize orchestrator
    const orchestrator = new FileEncryptionOrchestrator();

    // Use the file owner's session key for decryption (using AES for thumbnails)
    if (!file.user.sessionKey) {
      throw new Error('File owner does not have a session key. File cannot be decrypted.');
    }
    
    const ownerSessionKeyBuffer = Buffer.from(file.user.sessionKey, 'base64');
    const fileKey = KeyManager.deriveFileKey(ownerSessionKeyBuffer, fileId, Algorithm.AES);

    // Decrypt the file using AES
    const decryptionResult = await orchestrator.decryptFile(Algorithm.AES, fileId, fileKey);
    const decryptedBuffer = decryptionResult.plaintext;

    // Generate thumbnail using sharp
    const thumbnailBuffer = await sharp(decryptedBuffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer();

    // Return thumbnail
    return new NextResponse(new Uint8Array(thumbnailBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': thumbnailBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-File-Id': fileId,
      }
    });

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw createValidationError('THUMBNAIL_GENERATION_FAILED', 'Failed to generate thumbnail');
  }
}

export const GET = withErrorHandler(thumbnailHandler);