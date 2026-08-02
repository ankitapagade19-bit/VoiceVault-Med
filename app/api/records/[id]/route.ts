import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessMedicalRecord } from '@/lib/authorization';
import { verifyRecordChain } from '@/lib/hashing';
import { calculateTrustScore } from '@/lib/trust-score';
import { verifyMedicalRecordSignature } from '@/lib/signatures';
import { writeAuditLog } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const recordId = params.id;

  const authCheck = await canAccessMedicalRecord(session, recordId, request);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
  }

  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        originatingDoctor: { include: { user: { select: { name: true } } } },
        versions: {
          orderBy: { versionNumber: 'asc' },
          include: {
            createdBy: {
              select: {
                name: true,
                role: true,
                doctorProfile: { select: { id: true } },
              },
            },
          },
        },
        voiceConsultations: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const verification = verifyRecordChain(record.versions);

    const signatureResults = record.versions.map((v) => ({
      versionNumber: v.versionNumber,
      signed: !!v.doctorSignature,
      verified: v.doctorSignature
        ? verifyMedicalRecordSignature(
            v.currentHash,
            record.originatingDoctorId,
            v.doctorSignature,
            v.signingPublicKey
          )
        : false,
    }));

    const trustScore = await calculateTrustScore(
      record.versions,
      record.voiceConsultations,
      record.originatingDoctorId
    );

    await writeAuditLog({
      userId: session!.id,
      action: 'RECORD_VIEWED',
      resourceType: 'MEDICAL_RECORD',
      resourceId: recordId,
      patientId: record.patientId,
      request,
    });

    return NextResponse.json({
      record,
      verification,
      signatureResults,
      trustScore,
    });
  } catch (error) {
    console.error('Fetch Record Error:', error);
    return NextResponse.json({ error: 'Failed to fetch medical record' }, { status: 500 });
  }
}
