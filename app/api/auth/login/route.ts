import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { writeAuditLog } from '@/lib/audit';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request) || 'unknown';
    const rateLimit = checkRateLimit(rateLimitKey('login', clientIp), 10, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'Cache-Control': 'no-store, max-age=0'
          },
        }
      );
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validation.error.format() },
        { 
          status: 400,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        doctorProfile: true,
        patientProfile: true,
      },
    });

    if (!user) {
      await writeAuditLog({
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTHENTICATION',
        success: false,
        metadata: JSON.stringify({ email, reason: 'User not found' }),
        request,
      });
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    if (user.status !== 'ACTIVE') {
      await writeAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTHENTICATION',
        success: false,
        metadata: JSON.stringify({ email, reason: 'User account is inactive' }),
        request,
      });
      return NextResponse.json(
        { error: 'Account is inactive. Contact administrative staff.' },
        { 
          status: 403,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);

    if (!passwordMatch) {
      await writeAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTHENTICATION',
        success: false,
        metadata: JSON.stringify({ email, reason: 'Incorrect password' }),
        request,
      });
      return NextResponse.json(
        { error: 'Invalid credentials' }, 
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      doctorProfileId: user.doctorProfile?.id,
      patientProfileId: user.patientProfile?.id,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTHENTICATION',
      success: true,
      metadata: JSON.stringify({ role: user.role }),
      request,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      mustChangePassword: user.mustChangePassword,
    });

    // Disable browser caching on login responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    console.error('Login Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' }, 
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  }
}