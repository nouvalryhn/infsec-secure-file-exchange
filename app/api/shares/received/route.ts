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

    // Get files shared with the current user
    const sharedFiles = await prisma.fileShare.findMany({
      where: {
        sharedWithUserId: session.userId,
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
        owner: {
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

    const formattedShares = sharedFiles.map(share => ({
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
      owner: {
        id: share.owner.id,
        username: share.owner.username,
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
    console.error('Get received shares error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}