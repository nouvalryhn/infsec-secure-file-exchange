import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { saveSession, generateSessionKey } from '@/lib/auth/session';
import { withErrorHandler, createValidationError, createAuthenticationError } from '@/lib/error-handler';
import { authLogger } from '@/lib/logger';

async function loginHandler(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  // Get client IP for logging
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  // Validate input
  if (!username || !password) {
    authLogger.loginAttempt(username || 'unknown', false, clientIP);
    throw createValidationError('MISSING_FIELDS', 'Username and password are required');
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    authLogger.loginAttempt(username, false, clientIP);
    throw createValidationError('INVALID_INPUT', 'Username and password must be strings');
  }

  // Find user by username
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
    },
  });

  if (!user) {
    authLogger.loginAttempt(username, false, clientIP);
    throw createAuthenticationError('INVALID_CREDENTIALS', 'Invalid username or password');
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    authLogger.loginAttempt(username, false, clientIP);
    throw createAuthenticationError('INVALID_CREDENTIALS', 'Invalid username or password');
  }

  // Generate session key for encryption operations
  const sessionKey = generateSessionKey();

  // Create session
  await saveSession({
    userId: user.id,
    username: user.username,
    sessionKey,
    isLoggedIn: true,
  });

  // Log successful login
  authLogger.loginAttempt(username, true, clientIP);

  return NextResponse.json(
    {
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
      },
    },
    { status: 200 }
  );
}

export const POST = withErrorHandler(loginHandler);