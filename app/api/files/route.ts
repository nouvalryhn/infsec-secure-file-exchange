import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's files with metadata and sharing information
    const files = await prisma.file.findMany({
      where: {
        userId: session.userId
      },
      include: {
        metrics: true,
        shares: {
          include: {
            sharedWith: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        report: {
          select: {
            id: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    // Get files shared with the user
    const sharedFiles = await prisma.file.findMany({
      where: {
        shares: {
          some: {
            sharedWithUserId: session.userId
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        },
        metrics: true,
        shares: {
          where: {
            sharedWithUserId: session.userId
          },
          include: {
            owner: {
              select: {
                id: true,
                username: true
              }
            }
          }
        },
        report: {
          select: {
            id: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    // Format the response
    const ownedFiles = files.map(file => ({
      id: file.id,
      originalName: file.originalName,
      fileType: file.fileType,
      uploadedAt: file.uploadedAt,
      originalSize: file.originalSize,
      mimeType: file.mimeType,
      isOwner: true,
      hasFinancialReport: !!file.report,
      sharedWith: file.shares.map(share => ({
        userId: share.sharedWith.id,
        username: share.sharedWith.username,
        sharedAt: share.sharedAt
      })),
      encryptionMetrics: file.metrics.reduce((acc, metric) => {
        acc[metric.algorithm.toLowerCase()] = {
          encryptionTime: metric.encryptionTime,
          decryptionTime: metric.decryptionTime,
          ciphertextSize: metric.ciphertextSize,
          dataType: metric.dataType
        };
        return acc;
      }, {} as Record<string, any>)
    }));

    const receivedFiles = sharedFiles.map(file => ({
      id: file.id,
      originalName: file.originalName,
      fileType: file.fileType,
      uploadedAt: file.uploadedAt,
      originalSize: file.originalSize,
      mimeType: file.mimeType,
      isOwner: false,
      owner: {
        id: file.user.id,
        username: file.user.username
      },
      hasFinancialReport: !!file.report,
      sharedAt: file.shares[0]?.sharedAt,
      encryptionMetrics: file.metrics.reduce((acc, metric) => {
        acc[metric.algorithm.toLowerCase()] = {
          encryptionTime: metric.encryptionTime,
          decryptionTime: metric.decryptionTime,
          ciphertextSize: metric.ciphertextSize,
          dataType: metric.dataType
        };
        return acc;
      }, {} as Record<string, any>)
    }));

    return NextResponse.json({
      success: true,
      files: {
        owned: ownedFiles,
        shared: receivedFiles
      }
    });

  } catch (error) {
    console.error('File listing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}