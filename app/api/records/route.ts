import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canModifyClinicalRecord } from '@/lib/authorization';
import { createMedicalRecordSchema } from '@/lib/validation';
import { generateRecordHash } from '@/lib/hashing';
import { writeAuditLog } from '@/lib/audit';
import { signMedicalRecordVersion } from '@/lib/signatures';
import { createNotification, notifyPatientAndDoctors } from '@/lib/notifications';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    let records = [];

    if (session.role === 'DOCTOR' && session.doctorProfileId) {
      const assignments = await prisma.doctorPatientAssignment.findMany({
        where: { doctorId: session.doctorProfileId, active: true },
        select: { patientId: true },
      });
      const patientIds = assignments.map((a) => a.patientId);

      records = await prisma.medicalRecord.findMany({
        where: { patientId: { in: patientIds } },
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          originatingDoctor: { include: { user: { select: { name: true } } } },
          versions: {
            orderBy: { versionNumber: 'desc' },
            include: { createdBy: { select: { name: true, role: true } } },
          },
          voiceConsultations: { orderBy: { createdAt: 'desc' } },
        },
      });
    } else if (session.role === 'PATIENT' && session.patientProfileId) {
      records = await prisma.medicalRecord.findMany({
        where: { patientId: session.patientProfileId },
        orderBy: { createdAt: 'desc' },
        include: {
          originatingDoctor: { include: { user: { select: { name: true } } } },
          versions: {
            orderBy: { versionNumber: 'desc' },
            include: { createdBy: { select: { name: true, role: true } } },
          },
          voiceConsultations: { orderBy: { createdAt: 'desc' } },
        },
      });
    } else {
      records = await prisma.medicalRecord.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          versions: { orderBy: { versionNumber: 'desc' } },
        },
      });
    }

    return NextResponse.json({ records });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'DOCTOR' || !session.doctorProfileId) {
    return NextResponse.json({ error: 'Only authorized doctors can create medical records' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = createMedicalRecordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error', details: validation.error.format() }, { status: 400 });
    }

    const { patientId, symptoms, diagnosis, prescription, notes, versionReason } = validation.data;

    const authCheck = await canModifyClinicalRecord(session, patientId, request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: session.doctorProfileId },
      select: { publicSigningKey: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.medicalRecord.create({
        data: {
          patientId,
          originatingDoctorId: session.doctorProfileId!,
        },
      });

      const inputData = {
        recordId: record.id,
        versionNumber: 1,
        createdById: session.id,
        symptoms,
        diagnosis,
        prescription,
        notes,
        versionReason: versionReason || 'INITIAL_CLINICAL_RECORD',
        previousHash: null,
      };

      const currentHash = generateRecordHash(inputData);
      const { signature, signingPublicKey } = signMedicalRecordVersion(
        currentHash,
        session.doctorProfileId!,
        null,
        doctorProfile?.publicSigningKey
      );

      const version1 = await tx.medicalRecordVersion.create({
        data: {
          ...inputData,
          currentHash,
          doctorSignature: signature,
          signingPublicKey,
        },
      });

      return { record, version1 };
    });

    await writeAuditLog({
      userId: session.id,
      action: 'RECORD_CREATED',
      resourceType: 'MEDICAL_RECORD',
      resourceId: result.record.id,
      patientId,
      metadata: JSON.stringify({
        versionNumber: 1,
        currentHash: result.version1.currentHash,
        doctorSignature: result.version1.doctorSignature,
      }),
      request,
    });

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { userId: true },
    });

    if (patient) {
      await createNotification({
        userId: patient.userId,
        type: 'RECORD_CREATED',
        title: 'New Medical Record Created',
        message: `Dr. ${session.name} created a new medical record (Version 1) for you.`,
        resourceType: 'MEDICAL_RECORD',
        resourceId: result.record.id,
      });
    }

    return NextResponse.json({
      success: true,
      recordId: result.record.id,
      version: result.version1,
    });
  } catch (error: any) {
    console.error('Create Record Error:', error);
    return NextResponse.json({ error: 'Failed to create medical record' }, { status: 500 });
  }
}
