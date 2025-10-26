import { prisma } from './prisma';

// Log levels
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

// Log categories
export enum LogCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  ENCRYPTION = 'ENCRYPTION',
  DECRYPTION = 'DECRYPTION',
  FILE_SHARING = 'FILE_SHARING',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  DATABASE = 'DATABASE',
  SYSTEM = 'SYSTEM',
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  fileId?: string;
  algorithm?: string;
  operationTime?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// In-memory log storage for development (in production, use proper logging service)
const logBuffer: LogEntry[] = [];
const MAX_LOG_BUFFER_SIZE = 1000;

// Core logging function
export function log(entry: Omit<LogEntry, 'timestamp'>): void {
  const logEntry: LogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // Add to buffer
  logBuffer.push(logEntry);
  
  // Maintain buffer size
  if (logBuffer.length > MAX_LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Console output for development
  if (process.env.NODE_ENV === 'development') {
    const logMessage = `[${logEntry.timestamp.toISOString()}] ${logEntry.level} [${logEntry.category}] ${logEntry.message}`;
    const metadata = logEntry.metadata ? ` | Metadata: ${JSON.stringify(logEntry.metadata)}` : '';
    
    switch (logEntry.level) {
      case LogLevel.ERROR:
        console.error(logMessage + metadata);
        break;
      case LogLevel.WARN:
        console.warn(logMessage + metadata);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage + metadata);
        break;
      default:
        console.log(logMessage + metadata);
    }
  }

  // In production, you would send logs to external service
  // Example: sendToLogService(logEntry);
}

// Convenience logging functions
export const logger = {
  info: (category: LogCategory, message: string, metadata?: Record<string, any>) =>
    log({ level: LogLevel.INFO, category, message, metadata }),
    
  warn: (category: LogCategory, message: string, metadata?: Record<string, any>) =>
    log({ level: LogLevel.WARN, category, message, metadata }),
    
  error: (category: LogCategory, message: string, metadata?: Record<string, any>) =>
    log({ level: LogLevel.ERROR, category, message, metadata }),
    
  debug: (category: LogCategory, message: string, metadata?: Record<string, any>) =>
    log({ level: LogLevel.DEBUG, category, message, metadata }),
};

// Authentication logging functions
export const authLogger = {
  loginAttempt: (username: string, success: boolean, ip?: string) => {
    log({
      level: success ? LogLevel.INFO : LogLevel.WARN,
      category: LogCategory.AUTHENTICATION,
      message: `Login ${success ? 'successful' : 'failed'} for user: ${username}`,
      metadata: { username, success, ip, action: 'login' },
    });
  },

  registrationAttempt: (username: string, success: boolean, error?: string) => {
    log({
      level: success ? LogLevel.INFO : LogLevel.WARN,
      category: LogCategory.AUTHENTICATION,
      message: `Registration ${success ? 'successful' : 'failed'} for user: ${username}`,
      metadata: { username, success, error, action: 'registration' },
    });
  },

  logout: (userId: string, username: string) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.AUTHENTICATION,
      message: `User logged out: ${username}`,
      userId,
      metadata: { username, action: 'logout' },
    });
  },

  sessionExpired: (userId: string, username: string) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.AUTHENTICATION,
      message: `Session expired for user: ${username}`,
      userId,
      metadata: { username, action: 'session_expired' },
    });
  },
};

// Encryption/Decryption logging functions
export const encryptionLogger = {
  encryptionOperation: (
    userId: string,
    fileId: string,
    algorithm: string,
    operationTime: number,
    ciphertextSize: number,
    dataType: string
  ) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.ENCRYPTION,
      message: `File encrypted with ${algorithm}`,
      userId,
      fileId,
      algorithm,
      operationTime,
      metadata: {
        algorithm,
        operationTime,
        ciphertextSize,
        dataType,
        action: 'encrypt',
      },
    });
  },

  decryptionOperation: (
    userId: string,
    fileId: string,
    algorithm: string,
    operationTime: number,
    success: boolean
  ) => {
    log({
      level: success ? LogLevel.INFO : LogLevel.ERROR,
      category: LogCategory.DECRYPTION,
      message: `File decryption ${success ? 'successful' : 'failed'} with ${algorithm}`,
      userId,
      fileId,
      algorithm,
      operationTime,
      metadata: {
        algorithm,
        operationTime,
        success,
        action: 'decrypt',
      },
    });
  },

  encryptionError: (
    userId: string,
    fileId: string,
    algorithm: string,
    error: string
  ) => {
    log({
      level: LogLevel.ERROR,
      category: LogCategory.ENCRYPTION,
      message: `Encryption failed with ${algorithm}: ${error}`,
      userId,
      fileId,
      algorithm,
      metadata: {
        algorithm,
        error,
        action: 'encrypt_error',
      },
    });
  },

  decryptionError: (
    userId: string,
    fileId: string,
    algorithm: string,
    error: string
  ) => {
    log({
      level: LogLevel.ERROR,
      category: LogCategory.DECRYPTION,
      message: `Decryption failed with ${algorithm}: ${error}`,
      userId,
      fileId,
      algorithm,
      metadata: {
        algorithm,
        error,
        action: 'decrypt_error',
      },
    });
  },
};

// File sharing logging functions
export const sharingLogger = {
  fileShared: (
    ownerId: string,
    ownerUsername: string,
    recipientId: string,
    recipientUsername: string,
    fileId: string,
    fileName: string
  ) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.FILE_SHARING,
      message: `File "${fileName}" shared by ${ownerUsername} with ${recipientUsername}`,
      userId: ownerId,
      fileId,
      metadata: {
        ownerId,
        ownerUsername,
        recipientId,
        recipientUsername,
        fileName,
        action: 'share_file',
      },
    });
  },

  shareRevoked: (
    ownerId: string,
    ownerUsername: string,
    recipientId: string,
    recipientUsername: string,
    fileId: string,
    fileName: string
  ) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.FILE_SHARING,
      message: `File sharing revoked: "${fileName}" by ${ownerUsername} from ${recipientUsername}`,
      userId: ownerId,
      fileId,
      metadata: {
        ownerId,
        ownerUsername,
        recipientId,
        recipientUsername,
        fileName,
        action: 'revoke_share',
      },
    });
  },

  shareAccessAttempt: (
    userId: string,
    username: string,
    fileId: string,
    fileName: string,
    success: boolean,
    accessType: 'OWNER' | 'SHARED' | 'NONE'
  ) => {
    log({
      level: success ? LogLevel.INFO : LogLevel.WARN,
      category: LogCategory.FILE_SHARING,
      message: `File access ${success ? 'granted' : 'denied'}: "${fileName}" by ${username}`,
      userId,
      fileId,
      metadata: {
        username,
        fileName,
        success,
        accessType,
        action: 'access_attempt',
      },
    });
  },
};

// File operation logging functions
export const fileLogger = {
  fileUploaded: (
    userId: string,
    username: string,
    fileId: string,
    fileName: string,
    fileSize: number,
    fileType: string
  ) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.FILE_UPLOAD,
      message: `File uploaded: "${fileName}" by ${username}`,
      userId,
      fileId,
      metadata: {
        username,
        fileName,
        fileSize,
        fileType,
        action: 'upload',
      },
    });
  },

  fileDownloaded: (
    userId: string,
    username: string,
    fileId: string,
    fileName: string,
    algorithm: string
  ) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.FILE_DOWNLOAD,
      message: `File downloaded: "${fileName}" by ${username} using ${algorithm}`,
      userId,
      fileId,
      algorithm,
      metadata: {
        username,
        fileName,
        algorithm,
        action: 'download',
      },
    });
  },

  fileDeleted: (
    userId: string,
    username: string,
    fileId: string,
    fileName: string
  ) => {
    log({
      level: LogLevel.INFO,
      category: LogCategory.FILE_UPLOAD,
      message: `File deleted: "${fileName}" by ${username}`,
      userId,
      fileId,
      metadata: {
        username,
        fileName,
        action: 'delete',
      },
    });
  },
};

// Database operation logging
export const dbLogger = {
  queryError: (operation: string, error: string, metadata?: Record<string, any>) => {
    log({
      level: LogLevel.ERROR,
      category: LogCategory.DATABASE,
      message: `Database ${operation} failed: ${error}`,
      metadata: { operation, error, ...metadata },
    });
  },

  slowQuery: (operation: string, duration: number, metadata?: Record<string, any>) => {
    log({
      level: LogLevel.WARN,
      category: LogCategory.DATABASE,
      message: `Slow database ${operation}: ${duration}ms`,
      metadata: { operation, duration, ...metadata },
    });
  },
};

// Get logs for analysis (useful for debugging and monitoring)
export function getLogs(
  filters?: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
    fileId?: string;
    since?: Date;
    limit?: number;
  }
): LogEntry[] {
  let filteredLogs = [...logBuffer];

  if (filters) {
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }
    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    if (filters.fileId) {
      filteredLogs = filteredLogs.filter(log => log.fileId === filters.fileId);
    }
    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since!);
    }
    if (filters.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }
  }

  return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Clear logs (useful for testing)
export function clearLogs(): void {
  logBuffer.length = 0;
}

// Get log statistics
export function getLogStats(): {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
} {
  const stats = {
    total: logBuffer.length,
    byLevel: {} as Record<LogLevel, number>,
    byCategory: {} as Record<LogCategory, number>,
  };

  // Initialize counters
  Object.values(LogLevel).forEach(level => {
    stats.byLevel[level] = 0;
  });
  Object.values(LogCategory).forEach(category => {
    stats.byCategory[category] = 0;
  });

  // Count logs
  logBuffer.forEach(log => {
    stats.byLevel[log.level]++;
    stats.byCategory[log.category]++;
  });

  return stats;
}