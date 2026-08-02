import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessMedicalRecord } from '@/lib/authorization';
import { verifyRecordChain } from '@/lib/hashing';
import { writeAuditLog } from '@/lib/audit';
import { calculateTrustScore } from '@/lib/trust-score';
import { createNotification, notifyStaff } from '@/lib/notifications';

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
        versions: { orderBy: { versionNumber: 'asc' } },
        voiceConsultations: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const verificationResult = verifyRecordChain(record.versions);
    const trustScore = await calculateTrustScore(
      record.versions,
      record.voiceConsultations,
      record.originatingDoctorId
    );

    await writeAuditLog({
      userId: session!.id,
      action: verificationResult.isVerified ? 'INTEGRITY_VERIFICATION_RUN' : 'INTEGRITY_FAILURE',
      resourceType: 'RECORD_CHAIN',
      resourceId: recordId,
      patientId: record.patientId,
      success: verificationResult.isVerified,
      metadata: JSON.stringify({
        status: verificationResult.status,
        versionCount: record.versions.length,
        message: verificationResult.message,
        trustScore: trustScore.score,
      }),
      request,
    });

    if (!verificationResult.isVerified) {
      const patient = await prisma.patientProfile.findUnique({
        where: { id: record.patientId },
        select: { userId: true },
      });

      if (patient) {
        await createNotification({
          userId: patient.userId,
          type: 'INTEGRITY_FAILURE',
          title: 'Record Integrity Alert',
          message: `Integrity verification failed for your medical record: ${verificationResult.message}`,
          resourceType: 'MEDICAL_RECORD',
          resourceId: recordId,
        });
      }

      await notifyStaff({
        type: 'INTEGRITY_FAILURE',
        title: 'Integrity Verification Failure',
        message: `Record ${recordId.substring(0, 12)}... failed verification: ${verificationResult.status}`,
        resourceType: 'MEDICAL_RECORD',
        resourceId: recordId,
      });
    }

    return NextResponse.json({
      recordId,
      versionCount: record.versions.length,
      verification: verificationResult,
      trustScore,
      versions: record.versions.map((v) => ({
        versionNumber: v.versionNumber,
        currentHash: v.currentHash,
        previousHash: v.previousHash,
        doctorSignature: v.doctorSignature,
        createdAt: v.createdAt,
        reason: v.versionReason,
      })),
    });
  } catch (error) {
    console.error('Integrity Verification Error:', error);
    return NextResponse.json({ error: 'Failed to verify record integrity' }, { status: 500 });
  }
}
