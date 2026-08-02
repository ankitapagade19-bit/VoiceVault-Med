import { NextResponse } from 'next/server';
import { getSession, hashPassword, validatePasswordStrength } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/authorization';
import { passwordResetSchema } from '@/lib/validation';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  const session = await getSession();
  const auth = await requireRole(session, ['STAFF'], request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validation = passwordResetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid reset request', details: validation.error.format() }, { status: 400 });
    }

    const { userId, temporaryPassword } = validation.data;
    const strength = validatePasswordStrength(temporaryPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.issues.join(' ') }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const passwordHash = await hashPassword(temporaryPassword);
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: null,
      },
    });

    await writeAuditLog({ userId: session!.id, action: 'ADMIN_ACTION', resourceType: 'PASSWORD', resourceId: userId, success: true, metadata: JSON.stringify({ action: 'PASSWORD_RESET' }), request });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
