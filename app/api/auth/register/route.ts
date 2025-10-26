import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateSessionKey } from '@/lib/auth/session';
import { withErrorHandler, createValidationError, createConflictError } from '@/lib/error-handler';
import { authLogger } from '@/lib/logger';

async function registerHandler(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  // Validate input
  if (!username || !password) {
    authLogger.registrationAttempt(username || 'unknown', false, 'Missing fields');
    throw createValidationError('MISSING_FIELDS', 'Username and password are required');
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    authLogger.registrationAttempt(username, false, 'Invalid input types');
    throw createValidationError('INVALID_INPUT', 'Username and password must be strings');
  }

  // Validate username length and format
  if (username.length < 3 || username.length > 50) {
    authLogger.registrationAttempt(username, false, 'Invalid username length');
    throw createValidationError('INVALID_USERNAME', 'Username must be between 3 and 50 characters');
  }

  // Validate password strength
  if (password.length < 6) {
    authLogger.registrationAttempt(username, false, 'Weak password');
    throw createValidationError('WEAK_PASSWORD', 'Password must be at least 6 characters long');
  }

  // Check if username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    authLogger.registrationAttempt(username, false, 'Username already exists');
    throw createConflictError('USERNAME_EXISTS', 'Username already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate session key for encryption operations
  const sessionKey = generateSessionKey();

  // Create user in database
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      sessionKey,
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  // Log successful registration
  authLogger.registrationAttempt(username, true);

  return NextResponse.json(
    {
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    },
    { status: 201 }
  );
}

export const POST = withErrorHandler(registerHandler);