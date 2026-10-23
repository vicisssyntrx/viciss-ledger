import { NextRequest, NextResponse } from 'next/server';
import { verifyLockCredentials } from '@/lib/auth/lock';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // Check credentials against owner lock
    const isValid = verifyLockCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      username: username.trim(),
    });

    // Set secure auth cookies
    // 1. HttpOnly session cookie
    response.cookies.set({
      name: 'viciss_session',
      value: `sess_${Date.now()}_${Buffer.from(username.trim()).toString('hex')}`,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
    });

    // 2. Client-readable auth flag cookie
    response.cookies.set({
      name: 'viciss_auth',
      value: '1',
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    });

    // Prevent any caching of auth response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
