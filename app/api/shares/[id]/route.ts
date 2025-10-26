import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { withErrorHandler, createAuthenticationError, createValidationError, createNotFoundError, createAuthorizationError } from '@/lib/error-handler';
import { sharingLogger } from '@/lib/logger';

async function revokeShareHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get current session
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    throw createAuthenticationError('UNAUTHORIZED', 'Authentication required');
  }

  const { id: shareId } = await params;

  // Validate share ID
  if (!shareId || typeof shareId !== 'string') {
    throw createValidationError('INVALID_INPUT', 'Valid share ID is required');
  }

  // Find the share and verify ownership
  const share = await prisma.fileShare.findUnique({
    where: { id: shareId },
    include: {
      file: {
        select: {
          id: true,
          originalName: true,
        },
      },
      sharedWith: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!share) {
    throw createNotFoundError('SHARE_NOT_FOUND', 'Share not found');
  }

  // Verify that the current user is the owner of the file
  if (share.ownerId !== session.userId) {
    throw createAuthorizationError('FORBIDDEN', 'You can only revoke shares for files you own');
  }

  // Delete the share
  await prisma.fileShare.delete({
    where: { id: shareId },
  });

  // Log share revocation
  sharingLogger.shareRevoked(
    session.userId,
    session.username,
    share.sharedWith.id,
    share.sharedWith.username,
    share.file.id,
    share.file.originalName
  );

  return NextResponse.json(
    {
      message: 'Share revoked successfully',
      revokedShare: {
        shareId: share.id,
        fileName: share.file.originalName,
        revokedFrom: share.sharedWith.username,
        revokedAt: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}

export const DELETE = withErrorHandler(revokeShareHandler);