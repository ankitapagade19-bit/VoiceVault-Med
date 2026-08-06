import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';

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

    const payload = await verifySessionToken(token);

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