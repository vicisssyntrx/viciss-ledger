import { NextRequest, NextResponse } from 'next/server';
import { getOwnerUsername } from '@/lib/auth/lock';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('viciss_session');
  const authCookie = req.cookies.get('viciss_auth');

  const isAuthenticated = Boolean(sessionCookie?.value || authCookie?.value);

  const response = NextResponse.json({
    authenticated: isAuthenticated,
    username: isAuthenticated ? getOwnerUsername() : null,
  });

  // Never cache auth check
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');

  return response;
}
