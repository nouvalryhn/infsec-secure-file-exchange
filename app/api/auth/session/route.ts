import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { 
          isLoggedIn: false,
          user: null 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        isLoggedIn: true,
        user: {
          id: session.userId,
          username: session.username,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}