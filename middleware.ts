import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Replace 'session_token' with your actual cookie key name if different
  const token = request.cookies.get('session_token')?.value;

  const isProtectedRoute = 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/doctor') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/patient');

  // Prevent unauthenticated access
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  const response = NextResponse.next();

  // Prevent back-button viewing of stale sensitive medical records
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/doctor/:path*', '/staff/:path*', '/patient/:path*'],
};