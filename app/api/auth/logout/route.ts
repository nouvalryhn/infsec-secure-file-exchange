import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/auth/session';
import { withErrorHandler } from '@/lib/error-handler';
import { authLogger } from '@/lib/logger';

async function logoutHandler(request: NextRequest) {
  // Get current session for logging
  const session = await getSession();
  
  // Destroy the session
  await destroySession();

  // Log logout if we had a valid session
  if (session?.userId && session?.username) {
    authLogger.logout(session.userId, session.username);
  }

  return NextResponse.json(
    { message: 'Logout successful' },
    { status: 200 }
  );
}

export const POST = withErrorHandler(logoutHandler);