import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';

export async function GET(request: Request) {
  const session = await getSession();

  // Patients can view their own activity logs, Staff can view all, Doctor can view assigned
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const actionFilter = searchParams.get('action');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  try {
    let whereClause: any = {};

    if (actionFilter) {
      whereClause.action = actionFilter;
    }

    if (session.role === 'PATIENT') {
      if (!session.patientProfileId) {
        return NextResponse.json({ error: 'Patient profile missing' }, { status: 403 });
      }
      whereClause.OR = [
        { userId: session.id },
        { patientId: session.patientProfileId },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
