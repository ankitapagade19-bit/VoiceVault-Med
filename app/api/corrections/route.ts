import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessMedicalRecord, requireRole } from '@/lib/authorization';
import { createCorrectionRequestSchema } from '@/lib/validation';
import { writeAuditLog } from '@/lib/audit';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    if (session.role === 'PATIENT') {
      if (!session.patientProfileId) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 403 });
      }
      const requests = await prisma.correctionRequest.findMany({
        where: { patientId: session.patientProfileId },
        include: {
          record: {
            include: {
              originatingDoctor: { include: { user: { select: { name: true } } } },
              versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ requests });
    }

    if (session.role === 'DOCTOR') {
      if (!session.doctorProfileId) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 403 });
      }

      const assignments = await prisma.doctorPatientAssignment.findMany({
        where: { doctorId: session.doctorProfileId, active: true },
        select: { patientId: true },
      });
      const patientIds = assignments.map((a) => a.patientId);

      const requests = await prisma.correctionRequest.findMany({
        where: { patientId: { in: patientIds } },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          record: {
            include: {
              versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ requests });
    }

    if (session.role === 'STAFF') {
      const requests = await prisma.correctionRequest.findMany({
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ requests });
    }

    return NextResponse.json({ requests: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch correction requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const auth = await requireRole(session, ['PATIENT'], request);
  if (!auth.authorized || !session!.patientProfileId) {
    return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: auth.status || 403 });
  }

  const rateLimit = checkRateLimit(rateLimitKey('correction', session!.id), 5, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many correction requests. Please wait.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const validation = createCorrectionRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error', details: validation.error.format() }, { status: 400 });
    }

    const { recordId, reason, requestedCorrection } = validation.data;

    const accessCheck = await canAccessMedicalRecord(session, recordId, request);
    if (!accessCheck.authorized) {
      return NextResponse.json({ error: accessCheck.reason }, { status: accessCheck.status });
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: { patientId: true, originatingDoctor: { select: { userId: true } } },
    });

    if (!record || record.patientId !== session!.patientProfileId) {
      return NextResponse.json({ error: 'You can only request corrections for your own medical records' }, { status: 403 });
    }

    const correctionRequest = await prisma.correctionRequest.create({
      data: {
        recordId,
        patientId: session!.patientProfileId,
        requestedById: session!.id,
        reason,
        requestedCorrection,
        status: 'PENDING',
      },
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'CORRECTION_REQUEST_CREATED',
      resourceType: 'CORRECTION_REQUEST',
      resourceId: correctionRequest.id,
      patientId: session!.patientProfileId,
      metadata: JSON.stringify({ recordId, reason }),
      request,
    });

    if (record.originatingDoctor) {
      await createNotification({
        userId: record.originatingDoctor.userId,
        type: 'CORRECTION_REQUESTED',
        title: 'New Correction Request',
        message: `Patient ${session!.name} submitted a correction request for record ${recordId.substring(0, 8)}...`,
        resourceType: 'CORRECTION_REQUEST',
        resourceId: correctionRequest.id,
      });
    }

    return NextResponse.json({ success: true, correctionRequest });
  } catch (error) {
    console.error('Correction Request Error:', error);
    return NextResponse.json({ error: 'Failed to submit correction request' }, { status: 500 });
  }
}
