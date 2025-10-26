import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get files the current user has shared with others
    const sentShares = await prisma.fileShare.findMany({
      where: {
        ownerId: session.userId,
      },
      include: {
        file: {
          select: {
            id: true,
            originalName: true,
            fileType: true,
            uploadedAt: true,
            originalSize: true,
            mimeType: true,
          },
        },
        sharedWith: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        sharedAt: 'desc',
      },
    });

    const formattedShares = sentShares.map(share => ({
      shareId: share.id,
      sharedAt: share.sharedAt,
      file: {
        id: share.file.id,
        originalName: share.file.originalName,
        fileType: share.file.fileType,
        uploadedAt: share.file.uploadedAt,
        originalSize: share.file.originalSize,
        mimeType: share.file.mimeType,
      },
      sharedWith: {
        id: share.sharedWith.id,
        username: share.sharedWith.username,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        shares: formattedShares,
        count: formattedShares.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get sent shares error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}