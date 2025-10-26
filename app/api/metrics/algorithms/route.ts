/**
 * Algorithm Comparison API Endpoint
 * 
 * GET /api/metrics/algorithms - Retrieves algorithm-specific performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { 
  aggregateMetricsByAlgorithm, 
  getMetricsForAlgorithm,
  getMetricsForDataType 
} from '@/lib/services/metrics-aggregation-service';
import { Algorithm, DataType } from '@/types';

/**
 * GET /api/metrics/algorithms
 * 
 * Retrieves algorithm-specific performance metrics with optional filtering.
 * 
 * Query Parameters:
 * - algorithm: Filter by specific algorithm (AES, DES, RC4)
 * - dataType: Filter by specific data type (NUMERICAL, SPREADSHEET, IMAGE)
 * 
 * Returns:
 * - Filtered performance metrics based on query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const algorithmParam = searchParams.get('algorithm');
    const dataTypeParam = searchParams.get('dataType');

    let responseData;

    if (algorithmParam && Object.values(Algorithm).includes(algorithmParam as Algorithm)) {
      // Get metrics for specific algorithm across all data types
      const algorithm = algorithmParam as Algorithm;
      const metrics = await getMetricsForAlgorithm(algorithm);
      
      responseData = {
        type: 'algorithm_specific',
        algorithm: algorithm,
        metrics: metrics.map(metric => ({
          dataType: metric.dataType,
          algorithm: metric.algorithm,
          avgEncryptionTime: Math.round(metric.avgEncryptionTime * 100) / 100,
          avgDecryptionTime: Math.round(metric.avgDecryptionTime * 100) / 100,
          avgCiphertextSize: Math.round(metric.avgCiphertextSize),
          sampleCount: metric.sampleCount,
        })),
      };
    } else if (dataTypeParam && Object.values(DataType).includes(dataTypeParam as DataType)) {
      // Get metrics for specific data type across all algorithms
      const dataType = dataTypeParam as DataType;
      const metrics = await getMetricsForDataType(dataType);
      
      responseData = {
        type: 'datatype_specific',
        dataType: dataType,
        metrics: metrics.map(metric => ({
          algorithm: metric.algorithm,
          avgEncryptionTime: Math.round(metric.avgEncryptionTime * 100) / 100,
          avgDecryptionTime: Math.round(metric.avgDecryptionTime * 100) / 100,
          avgCiphertextSize: Math.round(metric.avgCiphertextSize),
          sampleCount: metric.sampleCount,
        })),
      };
    } else {
      // Get all algorithm metrics (default behavior)
      const metrics = await aggregateMetricsByAlgorithm();
      
      responseData = {
        type: 'all_algorithms',
        metrics: metrics.map(metric => ({
          algorithm: metric.algorithm,
          avgEncryptionTime: Math.round(metric.avgEncryptionTime * 100) / 100,
          avgDecryptionTime: Math.round(metric.avgDecryptionTime * 100) / 100,
          avgCiphertextSize: Math.round(metric.avgCiphertextSize),
          sampleCount: metric.sampleCount,
        })),
      };
    }

    const response = {
      success: true,
      data: responseData,
      availableFilters: {
        algorithms: Object.values(Algorithm),
        dataTypes: Object.values(DataType),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving algorithm metrics:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve algorithm metrics',
        },
      },
      { status: 500 }
    );
  }
}