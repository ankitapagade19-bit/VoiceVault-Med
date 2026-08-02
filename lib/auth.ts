import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'voicevault_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'voicevault_med_secure_jwt_secret_key_32bytes_min_length_2026!'
);

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'DOCTOR' | 'PATIENT';
  status: 'ACTIVE' | 'INACTIVE';
  doctorProfileId?: string;
  patientProfileId?: string;
}

/**
 * Hashes plain text password securely using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies plain text password against stored hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (password.length < 12) issues.push('Use at least 12 characters.');
  if (!/[A-Z]/.test(password)) issues.push('Include at least one uppercase letter.');
  if (!/[a-z]/.test(password)) issues.push('Include at least one lowercase letter.');
  if (!/[0-9]/.test(password)) issues.push('Include at least one number.');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Include at least one symbol.');

  return { valid: issues.length === 0, issues };
}

export function generateTemporaryPassword(): string {
  const prefix = 'VVM';
  const randomSegment = Math.random().toString(36).slice(2, 6).toUpperCase();
  const randomLower = Math.random().toString(36).slice(2, 6).toLowerCase();
  return `${prefix}-${randomSegment}${randomLower}-!A1`;
}

/**
 * Signs session JWT containing authenticated user metadata.
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

/**
 * Verifies JWT session token and returns decoded payload.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionUser;
  } catch (error) {
    return null;
  }
}

/**
 * Server-side helper to retrieve current authenticated user session from HTTP-only cookie.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

/**
 * Sets secure HTTP-only session cookie.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Clears session cookie (Logout).
 */
export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
