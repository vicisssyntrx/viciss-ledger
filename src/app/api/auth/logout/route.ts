import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear all auth cookies immediately
  response.cookies.set({
    name: 'viciss_session',
    value: '',
    path: '/',
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set({
    name: 'viciss_auth',
    value: '',
    path: '/',
    httpOnly: false,
    maxAge: 0,
    expires: new Date(0),
  });

  // Explicitly prevent any caching of logout or subsequent responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
