import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export async function POST() {
  const session = await getSession();
  if (session) {
    await writeAuditLog({
      userId: session.id,
      action: 'LOGOUT',
      resourceType: 'AUTHENTICATION',
      success: true,
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
