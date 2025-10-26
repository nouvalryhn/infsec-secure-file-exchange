/**
 * Metrics Aggregation Service
 * 
 * Provides functionality to aggregate and analyze encryption performance metrics
 * across different algorithms and data types for performance comparison.
 */

import { prisma } from '@/lib/prisma';
import { Algorithm, DataType } from '@/types';

// Interfaces for aggregated metrics
export interface AlgorithmMetrics {
  algorithm: Algorithm;
  avgEncryptionTime: number;
  avgDecryptionTime: number;
  avgCiphertextSize: number;
  sampleCount: number;
}

export interface DataTypeMetrics {
  dataType: DataType;
  algorithm: Algorithm;
  avgEncryptionTime: number;
  avgDecryptionTime: number;
  avgCiphertextSize: number;
  sampleCount: number;
}

export interface PerformanceComparison {
  algorithms: AlgorithmMetrics[];
  dataTypes: DataTypeMetrics[];
  totalSamples: number;
  lastUpdated: Date;
}

/**
 * Aggregates encryption metrics by algorithm
 * Calculates average encryption time, decryption time, and ciphertext size for each algorithm
 */
export async function aggregateMetricsByAlgorithm(): Promise<AlgorithmMetrics[]> {
  const metrics = await prisma.encryptionMetric.groupBy({
    by: ['algorithm'],
    _avg: {
      encryptionTime: true,
      decryptionTime: true,
      ciphertextSize: true,
    },
    _count: {
      id: true,
    },
  });

  return metrics.map(metric => ({
    algorithm: metric.algorithm as Algorithm,
    avgEncryptionTime: metric._avg.encryptionTime || 0,
    avgDecryptionTime: metric._avg.decryptionTime || 0,
    avgCiphertextSize: metric._avg.ciphertextSize || 0,
    sampleCount: metric._count.id,
  }));
}

/**
 * Aggregates encryption metrics by data type and algorithm
 * Groups metrics by data type (numerical, spreadsheet, image) and algorithm
 */
export async function aggregateMetricsByDataType(): Promise<DataTypeMetrics[]> {
  const metrics = await prisma.encryptionMetric.groupBy({
    by: ['dataType', 'algorithm'],
    _avg: {
      encryptionTime: true,
      decryptionTime: true,
      ciphertextSize: true,
    },
    _count: {
      id: true,
    },
  });

  return metrics.map(metric => ({
    dataType: metric.dataType as DataType,
    algorithm: metric.algorithm as Algorithm,
    avgEncryptionTime: metric._avg.encryptionTime || 0,
    avgDecryptionTime: metric._avg.decryptionTime || 0,
    avgCiphertextSize: metric._avg.ciphertextSize || 0,
    sampleCount: metric._count.id,
  }));
}

/**
 * Gets comprehensive performance comparison data
 * Combines algorithm and data type aggregations for complete analysis
 */
export async function getPerformanceComparison(): Promise<PerformanceComparison> {
  const [algorithmMetrics, dataTypeMetrics, totalCount] = await Promise.all([
    aggregateMetricsByAlgorithm(),
    aggregateMetricsByDataType(),
    prisma.encryptionMetric.count(),
  ]);

  return {
    algorithms: algorithmMetrics,
    dataTypes: dataTypeMetrics,
    totalSamples: totalCount,
    lastUpdated: new Date(),
  };
}

/**
 * Gets metrics for a specific algorithm across all data types
 */
export async function getMetricsForAlgorithm(algorithm: Algorithm): Promise<DataTypeMetrics[]> {
  const metrics = await prisma.encryptionMetric.groupBy({
    by: ['dataType'],
    where: {
      algorithm: algorithm,
    },
    _avg: {
      encryptionTime: true,
      decryptionTime: true,
      ciphertextSize: true,
    },
    _count: {
      id: true,
    },
  });

  return metrics.map(metric => ({
    dataType: metric.dataType as DataType,
    algorithm: algorithm,
    avgEncryptionTime: metric._avg.encryptionTime || 0,
    avgDecryptionTime: metric._avg.decryptionTime || 0,
    avgCiphertextSize: metric._avg.ciphertextSize || 0,
    sampleCount: metric._count.id,
  }));
}

/**
 * Gets metrics for a specific data type across all algorithms
 */
export async function getMetricsForDataType(dataType: DataType): Promise<AlgorithmMetrics[]> {
  const metrics = await prisma.encryptionMetric.groupBy({
    by: ['algorithm'],
    where: {
      dataType: dataType,
    },
    _avg: {
      encryptionTime: true,
      decryptionTime: true,
      ciphertextSize: true,
    },
    _count: {
      id: true,
    },
  });

  return metrics.map(metric => ({
    algorithm: metric.algorithm as Algorithm,
    avgEncryptionTime: metric._avg.encryptionTime || 0,
    avgDecryptionTime: metric._avg.decryptionTime || 0,
    avgCiphertextSize: metric._avg.ciphertextSize || 0,
    sampleCount: metric._count.id,
  }));
}

/**
 * Gets detailed metrics for a specific user (for user-specific analysis)
 */
export async function getUserMetrics(userId: string): Promise<PerformanceComparison> {
  const [algorithmMetrics, dataTypeMetrics, totalCount] = await Promise.all([
    getUserAlgorithmMetrics(userId),
    getUserDataTypeMetrics(userId),
    prisma.encryptionMetric.count({
      where: {
        file: {
          userId: userId,
        },
      },
    }),
  ]);

  return {
    algorithms: algorithmMetrics,
    dataTypes: dataTypeMetrics,
    totalSamples: totalCount,
    lastUpdated: new Date(),
  };
}

/**
 * Helper function to get algorithm metrics for a specific user
 */
async function getUserAlgorithmMetrics(userId: string): Promise<AlgorithmMetrics[]> {
  const metrics = await prisma.encryptionMetric.groupBy({
    by: ['algorithm'],
    where: {
      file: {
        userId: userId,
      },
    },
    _avg: {
      encryptionTime: true,
      decryptionTime: true,
      ciphertextSize: true,
    },
    _count: {
      id: true,
    },
  });

  return metrics.map(metric => ({
    algorithm: metric.algorithm as Algorithm,
    avgEncryptionTime: metric._avg.encryptionTime || 0,
    avgDecryptionTime: metric._avg.decryptionTime || 0,
    avgCiphertextSize: metric._avg.ciphertextSize || 0,
    sampleCount: metric._count.id,
  }));
}

/**
 * Helper function to get data type metrics for a specific user
 */
async function getUserDataTypeMetrics(userId: string): Promise<DataTypeMetrics[]> {
  const metrics = await prisma.encryptionMetric.groupBy({
    by: ['dataType', 'algorithm'],
    where: {
      file: {
        userId: userId,
      },
    },
    _avg: {
      encryptionTime: true,
      decryptionTime: true,
      ciphertextSize: true,
    },
    _count: {
      id: true,
    },
  });

  return metrics.map(metric => ({
    dataType: metric.dataType as DataType,
    algorithm: metric.algorithm as Algorithm,
    avgEncryptionTime: metric._avg.encryptionTime || 0,
    avgDecryptionTime: metric._avg.decryptionTime || 0,
    avgCiphertextSize: metric._avg.ciphertextSize || 0,
    sampleCount: metric._count.id,
  }));
}