import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

// Error response format interface
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Error types enum
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    type: ErrorType,
    code: string,
    message: string,
    statusCode: number,
    details?: any
  ) {
    super(message);
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

// Predefined error creators
export const createValidationError = (code: string, message: string, details?: any) =>
  new AppError(ErrorType.VALIDATION_ERROR, code, message, 400, details);

export const createAuthenticationError = (code: string, message: string) =>
  new AppError(ErrorType.AUTHENTICATION_ERROR, code, message, 401);

export const createAuthorizationError = (code: string, message: string) =>
  new AppError(ErrorType.AUTHORIZATION_ERROR, code, message, 403);

export const createNotFoundError = (code: string, message: string) =>
  new AppError(ErrorType.NOT_FOUND_ERROR, code, message, 404);

export const createConflictError = (code: string, message: string) =>
  new AppError(ErrorType.CONFLICT_ERROR, code, message, 409);

export const createEncryptionError = (code: string, message: string, details?: any) =>
  new AppError(ErrorType.ENCRYPTION_ERROR, code, message, 500, details);

export const createStorageError = (code: string, message: string, details?: any) =>
  new AppError(ErrorType.STORAGE_ERROR, code, message, 500, details);

export const createDatabaseError = (code: string, message: string, details?: any) =>
  new AppError(ErrorType.DATABASE_ERROR, code, message, 500, details);

export const createInternalError = (code: string, message: string, details?: any) =>
  new AppError(ErrorType.INTERNAL_ERROR, code, message, 500, details);

// Error mapping function
export function mapErrorToAppError(error: unknown): AppError {
  // Handle known AppError instances
  if (error instanceof AppError) {
    return error;
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return createConflictError('UNIQUE_CONSTRAINT', 'Resource already exists');
      case 'P2025':
        return createNotFoundError('RECORD_NOT_FOUND', 'Record not found');
      case 'P2003':
        return createValidationError('FOREIGN_KEY_CONSTRAINT', 'Invalid reference');
      default:
        return createDatabaseError('DATABASE_ERROR', 'Database operation failed', {
          code: error.code,
          meta: error.meta,
        });
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return createDatabaseError('DATABASE_UNKNOWN_ERROR', 'Unknown database error', {
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return createDatabaseError('DATABASE_PANIC', 'Database engine panic');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return createDatabaseError('DATABASE_INIT_ERROR', 'Database initialization failed');
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return createValidationError('SCHEMA_VALIDATION', 'Invalid data schema');
  }

  // Handle multer errors
  if (error instanceof Error && error.message.includes('File too large')) {
    return createValidationError('FILE_TOO_LARGE', 'File size exceeds limit');
  }

  if (error instanceof Error && error.message.includes('Invalid file type')) {
    return createValidationError('INVALID_FILE_TYPE', error.message);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return createInternalError('INTERNAL_ERROR', 'Internal server error', {
      originalMessage: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  // Handle unknown errors
  return createInternalError('UNKNOWN_ERROR', 'An unknown error occurred', {
    error: String(error),
  });
}

// Sanitize error messages for client
export function sanitizeErrorMessage(error: AppError): string {
  // Don't expose internal details in production
  if (process.env.NODE_ENV === 'production') {
    switch (error.type) {
      case ErrorType.INTERNAL_ERROR:
      case ErrorType.DATABASE_ERROR:
      case ErrorType.STORAGE_ERROR:
        return 'Internal server error';
      case ErrorType.ENCRYPTION_ERROR:
        return 'Encryption operation failed';
      default:
        return error.message;
    }
  }
  
  return error.message;
}

// Create error response
export function createErrorResponse(error: AppError): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: sanitizeErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    },
    timestamp: new Date().toISOString(),
  };
}

// Main error handler function
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  const appError = mapErrorToAppError(error);
  const errorResponse = createErrorResponse(appError);
  
  // Log error server-side
  console.error('API Error:', {
    type: appError.type,
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    timestamp: errorResponse.timestamp,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(errorResponse, { status: appError.statusCode });
}

// Async error handler wrapper for API routes
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
) {
  return async (...args: T): Promise<NextResponse<R | ErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}