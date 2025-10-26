import { prisma } from '@/lib/prisma';

export type AccessType = 'OWNER' | 'SHARED' | 'NONE';

export interface AccessCheck {
  hasAccess: boolean;
  accessType: AccessType;
}

/**
 * Check if a user has access to a file
 * @param userId - The user ID to check access for
 * @param fileId - The file ID to check access to
 * @returns Promise resolving to access check result
 */
export async function checkFileAccess(userId: string, fileId: string): Promise<AccessCheck> {
  try {
    // First check if user owns the file
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    if (file) {
      return {
        hasAccess: true,
        accessType: 'OWNER',
      };
    }

    // Check if file is shared with the user
    const sharedFile = await prisma.fileShare.findFirst({
      where: {
        fileId: fileId,
        sharedWithUserId: userId,
      },
      select: {
        id: true,
      },
    });

    if (sharedFile) {
      return {
        hasAccess: true,
        accessType: 'SHARED',
      };
    }

    // No access
    return {
      hasAccess: false,
      accessType: 'NONE',
    };
  } catch (error) {
    console.error('Access check error:', error);
    return {
      hasAccess: false,
      accessType: 'NONE',
    };
  }
}

/**
 * Verify user has access to a file and throw error if not
 * @param userId - The user ID to check access for
 * @param fileId - The file ID to check access to
 * @returns Promise resolving to access type if access is granted
 * @throws Error if access is denied
 */
export async function verifyFileAccess(userId: string, fileId: string): Promise<AccessType> {
  const accessCheck = await checkFileAccess(userId, fileId);
  
  if (!accessCheck.hasAccess) {
    throw new Error('Access denied: You do not have permission to access this file');
  }
  
  return accessCheck.accessType;
}