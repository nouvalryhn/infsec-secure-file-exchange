import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { FileMetadataService } from '@/lib/services/file-metadata-service';
import { FileEncryptionOrchestrator } from '@/lib/services/file-encryption-orchestrator';
import { withErrorHandler, createAuthenticationError, createNotFoundError } from '@/lib/error-handler';
import { fileLogger } from '@/lib/logger';

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const session = await getSession();
  if (!session?.userId) {
    throw createAuthenticationError('UNAUTHORIZED', 'Authentication required');
  }

  const { id: fileId } = await params;

  // Initialize services
  const metadataService = new FileMetadataService();
  const orchestrator = new FileEncryptionOrchestrator();

  // Get file info before deletion for logging
  const file = await metadataService.getFileMetadata(fileId, session.userId);
  if (!file) {
    throw createNotFoundError('FILE_NOT_FOUND', 'File not found or you do not have permission to delete this file');
  }

  try {
    // Delete file metadata and database records (this will verify ownership)
    await metadataService.deleteFile(fileId, session.userId);

    // Delete encrypted files from storage
    await orchestrator.deleteFiles(fileId);

    // Log file deletion
    fileLogger.fileDeleted(
      session.userId,
      session.username,
      fileId,
      file.originalName
    );

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('File not found or access denied')) {
      throw createNotFoundError('FILE_NOT_FOUND', 'File not found or you do not have permission to delete this file');
    }
    throw error;
  }
}

export const DELETE = withErrorHandler(deleteHandler);