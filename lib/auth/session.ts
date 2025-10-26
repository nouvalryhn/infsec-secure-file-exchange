import { SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import crypto from 'crypto';

export interface SessionData {
  userId: string;
  username: string;
  sessionKey: string; // Base64 encoded encryption key
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: '',
  username: '',
  sessionKey: '',
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'secure-file-exchange-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
  },
};

/**
 * Get the current session
 * @returns Promise resolving to session data
 */
export async function getSession(): Promise<SessionData> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  if (!session.isLoggedIn) {
    return defaultSession;
  }
  
  return session;
}

/**
 * Save session data
 * @param sessionData - Session data to save
 */
export async function saveSession(sessionData: SessionData): Promise<void> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  session.userId = sessionData.userId;
  session.username = sessionData.username;
  session.sessionKey = sessionData.sessionKey;
  session.isLoggedIn = sessionData.isLoggedIn;
  
  await session.save();
}

/**
 * Destroy the current session
 */
export async function destroySession(): Promise<void> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.destroy();
}

/**
 * Generate a session key for encryption operations
 * @returns Base64 encoded session key
 */
export function generateSessionKey(): string {
  const key = crypto.randomBytes(32); // 256-bit key
  return key.toString('base64');
}