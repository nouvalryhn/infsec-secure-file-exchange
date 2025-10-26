import { prisma } from './prisma';
import { Algorithm, DataType, FileType } from '@prisma/client';

/**
 * Database utility functions for the Secure File Exchange application
 */

export class DatabaseUtils {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Get database health status
   */
  static async getHealthStatus() {
    try {
      const userCount = await prisma.user.count();
      const fileCount = await prisma.file.count();
      const reportCount = await prisma.financialReport.count();
      
      return {
        connected: true,
        userCount,
        fileCount,
        reportCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Clean up old files and metrics (for maintenance)
   */
  static async cleanupOldData(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Delete old encryption metrics
      const deletedMetrics = await prisma.encryptionMetric.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Note: Files are not automatically deleted as they may be important
      // This should be handled by a separate archival process

      return {
        success: true,
        deletedMetrics: deletedMetrics.count,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get encryption performance statistics
   */
  static async getEncryptionStats() {
    try {
      const stats = await prisma.encryptionMetric.groupBy({
        by: ['algorithm', 'dataType'],
        _avg: {
          encryptionTime: true,
          decryptionTime: true,
        },
        _count: {
          id: true,
        },
      });

      return stats.map(stat => ({
        algorithm: stat.algorithm,
        dataType: stat.dataType,
        avgEncryptionTime: stat._avg.encryptionTime,
        avgDecryptionTime: stat._avg.decryptionTime,
        sampleCount: stat._count.id,
      }));
    } catch (error) {
      console.error('Failed to get encryption stats:', error);
      return [];
    }
  }
}

/**
 * Type-safe database operations
 */
export const db = {
  user: prisma.user,
  file: prisma.file,
  encryptionMetric: prisma.encryptionMetric,
  financialReport: prisma.financialReport,
  encryptedReportField: prisma.encryptedReportField,
  fileShare: prisma.fileShare,
};

/**
 * Enum exports for type safety
 */
export { Algorithm, DataType, FileType };