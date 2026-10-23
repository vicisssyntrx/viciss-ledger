import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Whitelist public paths that NEVER require authentication
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/share') ||
    pathname.startsWith('/api/share') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/offline') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Check for active owner session
  const sessionCookie = request.cookies.get('viciss_session');
  const authCookie = request.cookies.get('viciss_auth');
  const isAuthenticated = Boolean(sessionCookie?.value || authCookie?.value);

  // 3. If unauthenticated, redirect to /login immediately
  if (!isAuthenticated) {
    // For API requests, return 401 JSON
    if (pathname.startsWith('/api/')) {
      const apiResponse = NextResponse.json(
        { error: 'Unauthorized. Please enter owner lock credentials.' },
        { status: 401 }
      );
      apiResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      return apiResponse;
    }

    // For page requests, redirect to /login
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }

    const redirectResponse = NextResponse.redirect(loginUrl);
    // Explicitly prohibit caching of the redirect so browser back-button never gets confused
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');

    return redirectResponse;
  }

  // 4. Authenticated request: proceed with cache prevention for sensitive personal financial data
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
