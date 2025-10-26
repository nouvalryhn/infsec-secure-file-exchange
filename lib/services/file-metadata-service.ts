import { prisma } from '@/lib/prisma';
import { Algorithm, DataType } from '@/types/encryption';
import { FileType } from '@prisma/client';

/**
 * File Metadata Service
 * Handles file metadata storage, retrieval, and management
 */
export class FileMetadataService {

  /**
   * Creates file metadata record with encryption metrics
   * @param fileData - File information and encryption results
   * @returns Promise resolving to created file record
   */
  async createFileMetadata(fileData: {
    id: string;
    userId: string;
    originalName: string;
    fileType: FileType;
    originalSize: number;
    mimeType: string;
    encryptionResults: {
      aes: { filePath: string; encryptionTime: number; ciphertextSize: number };
      des: { filePath: string; encryptionTime: number; ciphertextSize: number };
      rc4: { filePath: string; encryptionTime: number; ciphertextSize: number };
    };
  }) {
    const { id, userId, originalName, fileType, originalSize, mimeType, encryptionResults } = fileData;
    
    // Determine data type for metrics
    const dataType = fileType === FileType.EXCEL ? DataType.SPREADSHEET : DataType.IMAGE;

    return await prisma.$transaction(async (tx) => {
      // Create file record
      const fileRecord = await tx.file.create({
        data: {
          id,
          userId,
          originalName,
          fileType,
          aesPath: encryptionResults.aes.filePath,
          desPath: encryptionResults.des.filePath,
          rc4Path: encryptionResults.rc4.filePath,
          originalSize,
          mimeType
        }
      });

      // Create encryption metrics
      await tx.encryptionMetric.createMany({
        data: [
          {
            fileId: id,
            algorithm: Algorithm.AES,
            encryptionTime: encryptionResults.aes.encryptionTime,
            ciphertextSize: encryptionResults.aes.ciphertextSize,
            dataType
          },
          {
            fileId: id,
            algorithm: Algorithm.DES,
            encryptionTime: encryptionResults.des.encryptionTime,
            ciphertextSize: encryptionResults.des.ciphertextSize,
            dataType
          },
          {
            fileId: id,
            algorithm: Algorithm.RC4,
            encryptionTime: encryptionResults.rc4.encryptionTime,
            ciphertextSize: encryptionResults.rc4.ciphertextSize,
            dataType
          }
        ]
      });

      return fileRecord;
    });
  }

  /**
   * Retrieves file metadata with encryption metrics
   * @param fileId - The file ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving to file metadata or null if not found
   */
  async getFileMetadata(fileId: string, userId?: string) {
    const whereClause: any = { id: fileId };
    if (userId) {
      whereClause.userId = userId;
    }

    return await prisma.file.findUnique({
      where: whereClause,
      include: {
        metrics: {
          orderBy: { algorithm: 'asc' }
        },
        report: {
          select: {
            id: true,
            createdAt: true,
            data: {
              select: {
                fieldName: true,
                algorithm: true
              }
            }
          }
        },
        shares: {
          include: {
            sharedWith: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Lists files for a user with pagination and filtering
   * @param userId - The user ID
   * @param options - Query options for filtering and pagination
   * @returns Promise resolving to paginated file list
   */
  async listUserFiles(userId: string, options: {
    page?: number;
    limit?: number;
    fileType?: FileType;
    sortBy?: 'uploadedAt' | 'originalName' | 'originalSize';
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 10,
      fileType,
      sortBy = 'uploadedAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const whereClause: any = { userId };
    
    if (fileType) {
      whereClause.fileType = fileType;
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: whereClause,
        include: {
          metrics: {
            select: {
              algorithm: true,
              encryptionTime: true,
              ciphertextSize: true
            }
          },
          report: {
            select: {
              id: true,
              data: {
                select: {
                  fieldName: true
                },
                distinct: ['fieldName']
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.file.count({ where: whereClause })
    ]);

    return {
      files: files.map(file => ({
        ...file,
        financialFieldCount: file.report?.data.length || 0,
        encryptionSummary: {
          aes: file.metrics.find(m => m.algorithm === Algorithm.AES),
          des: file.metrics.find(m => m.algorithm === Algorithm.DES),
          rc4: file.metrics.find(m => m.algorithm === Algorithm.RC4)
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Gets encryption performance metrics for a file
   * @param fileId - The file ID
   * @returns Promise resolving to encryption metrics
   */
  async getEncryptionMetrics(fileId: string) {
    const metrics = await prisma.encryptionMetric.findMany({
      where: { fileId },
      orderBy: { algorithm: 'asc' }
    });

    return {
      fileId,
      metrics: metrics.reduce((acc, metric) => {
        acc[metric.algorithm.toLowerCase()] = {
          algorithm: metric.algorithm,
          encryptionTime: metric.encryptionTime,
          decryptionTime: metric.decryptionTime,
          ciphertextSize: metric.ciphertextSize,
          dataType: metric.dataType,
          createdAt: metric.createdAt
        };
        return acc;
      }, {} as Record<string, any>)
    };
  }

  /**
   * Updates encryption metrics with decryption time
   * @param fileId - The file ID
   * @param algorithm - The algorithm used
   * @param decryptionTime - Time taken for decryption
   * @returns Promise resolving to updated metric
   */
  async updateDecryptionMetric(fileId: string, algorithm: Algorithm, decryptionTime: number) {
    return await prisma.encryptionMetric.updateMany({
      where: {
        fileId,
        algorithm
      },
      data: {
        decryptionTime
      }
    });
  }

  /**
   * Associates a file with a user (for sharing)
   * @param fileId - The file ID
   * @param ownerId - The owner's user ID
   * @param sharedWithUserId - The user ID to share with
   * @returns Promise resolving to file share record
   */
  async shareFile(fileId: string, ownerId: string, sharedWithUserId: string) {
    // Check if file exists and belongs to owner
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: ownerId
      }
    });

    if (!file) {
      throw new Error('File not found or access denied');
    }

    // Check if already shared
    const existingShare = await prisma.fileShare.findUnique({
      where: {
        fileId_sharedWithUserId: {
          fileId,
          sharedWithUserId
        }
      }
    });

    if (existingShare) {
      return existingShare;
    }

    // Create share record
    return await prisma.fileShare.create({
      data: {
        fileId,
        ownerId,
        sharedWithUserId
      }
    });
  }

  /**
   * Gets files shared with a user
   * @param userId - The user ID
   * @returns Promise resolving to shared files
   */
  async getSharedFiles(userId: string) {
    return await prisma.fileShare.findMany({
      where: { sharedWithUserId: userId },
      include: {
        file: {
          include: {
            metrics: {
              select: {
                algorithm: true,
                encryptionTime: true,
                ciphertextSize: true
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { sharedAt: 'desc' }
    });
  }

  /**
   * Deletes a file and all associated data
   * @param fileId - The file ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving when deletion is complete
   */
  async deleteFile(fileId: string, userId: string) {
    // Verify ownership
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId
      }
    });

    if (!file) {
      throw new Error('File not found or access denied');
    }

    return await prisma.$transaction(async (tx) => {
      // Delete in order due to foreign key constraints
      await tx.encryptedReportField.deleteMany({
        where: {
          report: {
            fileId
          }
        }
      });

      await tx.financialReport.deleteMany({
        where: { fileId }
      });

      await tx.fileShare.deleteMany({
        where: { fileId }
      });

      await tx.encryptionMetric.deleteMany({
        where: { fileId }
      });

      await tx.file.delete({
        where: { id: fileId }
      });
    });
  }

  /**
   * Gets file statistics for a user
   * @param userId - The user ID
   * @returns Promise resolving to user file statistics
   */
  async getUserFileStats(userId: string) {
    const [
      totalFiles,
      excelFiles,
      imageFiles,
      totalSize,
      avgEncryptionTimes,
      recentUploads
    ] = await Promise.all([
      prisma.file.count({ where: { userId } }),
      prisma.file.count({ where: { userId, fileType: FileType.EXCEL } }),
      prisma.file.count({ where: { userId, fileType: FileType.IMAGE } }),
      prisma.file.aggregate({
        where: { userId },
        _sum: { originalSize: true }
      }),
      prisma.encryptionMetric.groupBy({
        by: ['algorithm'],
        where: {
          file: { userId }
        },
        _avg: {
          encryptionTime: true,
          ciphertextSize: true
        }
      }),
      prisma.file.count({
        where: {
          userId,
          uploadedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    return {
      totalFiles,
      fileTypes: {
        excel: excelFiles,
        image: imageFiles
      },
      totalSize: totalSize._sum.originalSize || 0,
      averageEncryptionTimes: avgEncryptionTimes.reduce((acc, metric) => {
        acc[metric.algorithm.toLowerCase()] = {
          encryptionTime: metric._avg.encryptionTime || 0,
          ciphertextSize: metric._avg.ciphertextSize || 0
        };
        return acc;
      }, {} as Record<string, any>),
      recentUploads
    };
  }
}