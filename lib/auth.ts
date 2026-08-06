import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-development-only-change-me'
);

// --- Type Definitions ---

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  doctorProfileId?: string;
  patientProfileId?: string;
  [key: string]: any;
}

// --- Password Utilities ---

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number.');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// --- Session & JWT Utilities ---

export async function createSessionToken(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await Promise.resolve(cookies());
    const token = cookieStore.get('session_token')?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await Promise.resolve(cookies());
  cookieStore.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}