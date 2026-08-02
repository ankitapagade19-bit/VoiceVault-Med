import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'voicevault_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'voicevault_med_secure_jwt_secret_key_32bytes_min_length_2026!'
);

interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'DOCTOR' | 'PATIENT';
  status: 'ACTIVE' | 'INACTIVE';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedDoctor = pathname.startsWith('/doctor');
  const isProtectedStaff = pathname.startsWith('/staff');
  const isProtectedPatient = pathname.startsWith('/patient');
  const isProtectedAdmin = pathname.startsWith('/admin');
  const isProtectedPassword = pathname.startsWith('/password-change');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let session: SessionPayload | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      session = payload as unknown as SessionPayload;
    } catch {
      session = null;
    }
  }

  // Handle protected routes
  if (isProtectedDoctor || isProtectedStaff || isProtectedPatient || isProtectedAdmin || isProtectedPassword) {
    if (!session || session.status !== 'ACTIVE') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isProtectedAdmin && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDashboard(session.role), request.url));
    }

    if (isProtectedDoctor && session.role !== 'DOCTOR' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDashboard(session.role), request.url));
    }

    if (isProtectedStaff && session.role !== 'STAFF' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDashboard(session.role), request.url));
    }

    if (isProtectedPatient && session.role !== 'PATIENT' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(getRoleDashboard(session.role), request.url));
    }
  }

  // Handle auth pages (redirect logged in active users)
  if (isAuthPage && session && session.status === 'ACTIVE') {
    return NextResponse.redirect(new URL(getRoleDashboard(session.role), request.url));
  }

  return NextResponse.next();
}

function getRoleDashboard(role: 'ADMIN' | 'STAFF' | 'DOCTOR' | 'PATIENT'): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'DOCTOR':
      return '/doctor';
    case 'STAFF':
      return '/staff';
    case 'PATIENT':
      return '/patient';
    default:
      return '/login';
  }
}

export const config = {
  matcher: ['/doctor/:path*', '/staff/:path*', '/patient/:path*', '/admin/:path*', '/password-change', '/login', '/register'],
};
