/**
 * Performance Metrics API Endpoint
 * 
 * GET /api/metrics/performance - Retrieves aggregated performance comparison data
 * for all encryption algorithms and data types
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getPerformanceComparison } from '@/lib/services/metrics-aggregation-service';

/**
 * GET /api/metrics/performance
 * 
 * Retrieves comprehensive performance metrics comparing encryption algorithms
 * across different data types. Requires user authentication.
 * 
 * Query Parameters:
 * - None (returns global metrics for all users)
 * 
 * Returns:
 * - algorithms: Array of algorithm performance metrics
 * - dataTypes: Array of data type performance metrics grouped by algorithm
 * - totalSamples: Total number of encryption operations recorded
 * - lastUpdated: Timestamp of when the data was aggregated
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

    // Retrieve and aggregate performance metrics
    const performanceData = await getPerformanceComparison();

    // Format response data for client consumption
    const response = {
      success: true,
      data: {
        algorithms: performanceData.algorithms.map(algo => ({
          algorithm: algo.algorithm,
          avgEncryptionTime: Math.round(algo.avgEncryptionTime * 100) / 100, // Round to 2 decimal places
          avgDecryptionTime: Math.round(algo.avgDecryptionTime * 100) / 100,
          avgCiphertextSize: Math.round(algo.avgCiphertextSize),
          sampleCount: algo.sampleCount,
        })),
        dataTypes: performanceData.dataTypes.map(dt => ({
          dataType: dt.dataType,
          algorithm: dt.algorithm,
          avgEncryptionTime: Math.round(dt.avgEncryptionTime * 100) / 100,
          avgDecryptionTime: Math.round(dt.avgDecryptionTime * 100) / 100,
          avgCiphertextSize: Math.round(dt.avgCiphertextSize),
          sampleCount: dt.sampleCount,
        })),
        summary: {
          totalSamples: performanceData.totalSamples,
          lastUpdated: performanceData.lastUpdated.toISOString(),
          algorithmsCompared: performanceData.algorithms.length,
          dataTypesAnalyzed: Array.from(new Set(performanceData.dataTypes.map(dt => dt.dataType))).length,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve performance metrics',
        },
      },
      { status: 500 }
    );
  }
}