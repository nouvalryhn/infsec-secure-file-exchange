import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { withErrorHandler, createAuthenticationError, createValidationError, createNotFoundError, createConflictError } from '@/lib/error-handler';
import { sharingLogger } from '@/lib/logger';

async function shareHandler(request: NextRequest) {
  // Get current session
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    throw createAuthenticationError('UNAUTHORIZED', 'Authentication required');
  }

  const body = await request.json();
  const { fileId, recipientUsername } = body;

  // Validate input
  if (!fileId || !recipientUsername) {
    throw createValidationError('MISSING_FIELDS', 'File ID and recipient username are required');
  }

  if (typeof fileId !== 'string' || typeof recipientUsername !== 'string') {
    throw createValidationError('INVALID_INPUT', 'File ID and recipient username must be strings');
  }

  // Verify user owns the file
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId: session.userId,
    },
    select: {
      id: true,
      originalName: true,
      userId: true,
    },
  });

  if (!file) {
    throw createNotFoundError('FILE_NOT_FOUND', 'File not found or you do not own this file');
  }

  // Validate recipient username exists
  const recipient = await prisma.user.findUnique({
    where: { username: recipientUsername },
    select: {
      id: true,
      username: true,
    },
  });

  if (!recipient) {
    throw createNotFoundError('USER_NOT_FOUND', 'Recipient username does not exist');
  }

  // Check if user is trying to share with themselves
  if (recipient.id === session.userId) {
    throw createValidationError('INVALID_RECIPIENT', 'Cannot share file with yourself');
  }

  // Check if file is already shared with this user
  const existingShare = await prisma.fileShare.findUnique({
    where: {
      fileId_sharedWithUserId: {
        fileId: fileId,
        sharedWithUserId: recipient.id,
      },
    },
  });

  if (existingShare) {
    throw createConflictError('ALREADY_SHARED', 'File is already shared with this user');
  }

  // Create FileShare record in database
  const fileShare = await prisma.fileShare.create({
    data: {
      fileId: fileId,
      ownerId: session.userId,
      sharedWithUserId: recipient.id,
    },
    include: {
      file: {
        select: {
          originalName: true,
        },
      },
      sharedWith: {
        select: {
          username: true,
        },
      },
    },
  });

  // Log successful file sharing
  sharingLogger.fileShared(
    session.userId,
    session.username,
    recipient.id,
    recipient.username,
    fileId,
    file.originalName
  );

  return NextResponse.json(
    {
      message: 'File shared successfully',
      share: {
        id: fileShare.id,
        fileId: fileShare.fileId,
        fileName: fileShare.file.originalName,
        sharedWith: fileShare.sharedWith.username,
        sharedAt: fileShare.sharedAt,
      },
    },
    { status: 201 }
  );
}

export const POST = withErrorHandler(shareHandler);