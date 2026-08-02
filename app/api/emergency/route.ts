import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requirePermission, grantEmergencyAccess } from '@/lib/authorization';
import { prisma } from '@/lib/db';
import { createNotification, notifyStaff } from '@/lib/notifications';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    if (session.role === 'STAFF') {
      const accesses = await prisma.emergencyAccess.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          doctor: { include: { user: { select: { name: true, email: true } } } },
          patient: { include: { user: { select: { name: true, email: true } } } },
        },
      });
      return NextResponse.json({ accesses });
    }

    if (session.role === 'PATIENT' && session.patientProfileId) {
      const accesses = await prisma.emergencyAccess.findMany({
        where: { patientId: session.patientProfileId },
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ accesses });
    }

    if (session.role === 'DOCTOR' && session.doctorProfileId) {
      const accesses = await prisma.emergencyAccess.findMany({
        where: { doctorId: session.doctorProfileId },
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
      });
      return NextResponse.json({ accesses });
    }

    return NextResponse.json({ accesses: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch emergency access logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const permCheck = await requirePermission(session, 'EMERGENCY_ACCESS_REQUEST', request);
  if (!permCheck.authorized || !session) {
    return NextResponse.json({ error: permCheck.reason || 'Forbidden' }, { status: permCheck.status || 403 });
  }

  try {
    const { patientId, reason, confirmed } = await request.json();

    if (!patientId || !reason) {
      return NextResponse.json({ error: 'patientId and reason are required' }, { status: 400 });
    }

    if (confirmed !== true) {
      return NextResponse.json(
        { error: 'Emergency access requires explicit confirmation (confirmed: true)' },
        { status: 400 }
      );
    }

    const result = await grantEmergencyAccess(session, patientId, reason, request);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { userId: true, user: { select: { name: true } } },
    });

    if (patient) {
      await createNotification({
        userId: patient.userId,
        type: 'EMERGENCY_ACCESS',
        title: 'Emergency Access Alert',
        message: `Dr. ${session.name} activated emergency break-glass access to your records. Reason: ${reason}`,
        resourceType: 'PATIENT_PROFILE',
        resourceId: patientId,
      });
    }

    await notifyStaff({
      type: 'EMERGENCY_ACCESS',
      title: 'Emergency Break-Glass Access',
      message: `Dr. ${session.name} activated emergency access for patient ${patient?.user.name || patientId}.`,
      resourceType: 'EMERGENCY_ACCESS',
      resourceId: result.accessId,
    });

    return NextResponse.json({
      success: true,
      accessId: result.accessId,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Emergency access error:', error);
    return NextResponse.json({ error: 'Failed to grant emergency access' }, { status: 500 });
  }
}
