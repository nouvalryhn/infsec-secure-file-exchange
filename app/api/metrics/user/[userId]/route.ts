/**
 * User-Specific Performance Metrics API Endpoint
 * 
 * GET /api/metrics/user/[userId] - Retrieves performance metrics for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserMetrics } from '@/lib/services/metrics-aggregation-service';

/**
 * GET /api/metrics/user/[userId]
 * 
 * Retrieves performance metrics for a specific user's encryption operations.
 * Users can only access their own metrics unless they have admin privileges.
 * 
 * Path Parameters:
 * - userId: The ID of the user whose metrics to retrieve
 * 
 * Returns:
 * - algorithms: Array of algorithm performance metrics for the user
 * - dataTypes: Array of data type performance metrics for the user
 * - totalSamples: Total number of encryption operations by the user
 * - lastUpdated: Timestamp of when the data was aggregated
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // Verify user authentication
    const session = await getSession();
    if (!session?.isLoggedIn) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Verify user can access these metrics (users can only see their own metrics)
    if (session.userId !== userId) {
      return NextResponse.json(
        { 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Access denied: You can only view your own metrics' 
          } 
        },
        { status: 403 }
      );
    }

    // Retrieve user-specific performance metrics
    const userPerformanceData = await getUserMetrics(userId);

    // Format response data for client consumption
    const response = {
      success: true,
      data: {
        userId: userId,
        algorithms: userPerformanceData.algorithms.map(algo => ({
          algorithm: algo.algorithm,
          avgEncryptionTime: Math.round(algo.avgEncryptionTime * 100) / 100,
          avgDecryptionTime: Math.round(algo.avgDecryptionTime * 100) / 100,
          avgCiphertextSize: Math.round(algo.avgCiphertextSize),
          sampleCount: algo.sampleCount,
        })),
        dataTypes: userPerformanceData.dataTypes.map(dt => ({
          dataType: dt.dataType,
          algorithm: dt.algorithm,
          avgEncryptionTime: Math.round(dt.avgEncryptionTime * 100) / 100,
          avgDecryptionTime: Math.round(dt.avgDecryptionTime * 100) / 100,
          avgCiphertextSize: Math.round(dt.avgCiphertextSize),
          sampleCount: dt.sampleCount,
        })),
        summary: {
          totalSamples: userPerformanceData.totalSamples,
          lastUpdated: userPerformanceData.lastUpdated.toISOString(),
          algorithmsUsed: userPerformanceData.algorithms.length,
          dataTypesProcessed: Array.from(new Set(userPerformanceData.dataTypes.map(dt => dt.dataType))).length,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error retrieving user performance metrics:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve user performance metrics',
        },
      },
      { status: 500 }
    );
  }
}