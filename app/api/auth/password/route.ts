import { NextResponse } from 'next/server';
import { comparePassword, getSession, hashPassword, validatePasswordStrength } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { passwordChangeSchema } from '@/lib/validation';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = passwordChangeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid password change request', details: validation.error.format() }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.issues.join(' ') }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const match = await comparePassword(currentPassword, user.passwordHash);
    if (!match) {
      await writeAuditLog({ userId: session.id, action: 'ACCESS_DENIED', resourceType: 'PASSWORD', success: false, metadata: JSON.stringify({ reason: 'Current password mismatch' }), request });
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    await writeAuditLog({ userId: session.id, action: 'ADMIN_ACTION', resourceType: 'PASSWORD', success: true, metadata: JSON.stringify({ action: 'PASSWORD_CHANGED' }), request });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
