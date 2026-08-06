import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as auth from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { user: null }, 
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    // Adaptively call whichever verification function exists in your lib/auth.ts
    let payload: any = null;
    if (typeof (auth as any).verifySessionToken === 'function') {
      payload = await (auth as any).verifySessionToken(token);
    } else if (typeof (auth as any).verifyToken === 'function') {
      payload = await (auth as any).verifyToken(token);
    } else if (typeof (auth as any).getSession === 'function') {
      payload = await (auth as any).getSession(token);
    }

    if (!payload) {
      return NextResponse.json(
        { user: null }, 
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    const response = NextResponse.json({ user: payload });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    return NextResponse.json(
      { user: null }, 
      { 
        status: 401,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  }
}