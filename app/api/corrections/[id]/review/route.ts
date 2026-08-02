import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canModifyClinicalRecord } from '@/lib/authorization';
import { reviewCorrectionSchema } from '@/lib/validation';
import { generateRecordHash } from '@/lib/hashing';
import { writeAuditLog } from '@/lib/audit';
import { signMedicalRecordVersion } from '@/lib/signatures';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== 'DOCTOR' || !session.doctorProfileId) {
    return NextResponse.json({ error: 'Only doctors can review correction requests' }, { status: 403 });
  }

  const correctionRequestId = params.id;

  try {
    const body = await request.json();
    const validation = reviewCorrectionSchema.safeParse({ ...body, correctionRequestId });

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error', details: validation.error.format() }, { status: 400 });
    }

    const { action, reviewNotes, symptoms, diagnosis, prescription, notes } = validation.data;

    const correctionRequest = await prisma.correctionRequest.findUnique({
      where: { id: correctionRequestId },
      include: {
        record: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
        patient: { select: { userId: true } },
      },
    });

    if (!correctionRequest) {
      return NextResponse.json({ error: 'Correction request not found' }, { status: 404 });
    }

    if (correctionRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Request has already been processed with status '${correctionRequest.status}'` },
        { status: 400 }
      );
    }

    const authCheck = await canModifyClinicalRecord(session, correctionRequest.patientId, request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    if (action === 'REJECT') {
      const updatedRequest = await prisma.correctionRequest.update({
        where: { id: correctionRequestId },
        data: {
          status: 'REJECTED',
          reviewedById: session.id,
          reviewNotes: reviewNotes || 'Correction request rejected after clinical review.',
          reviewedAt: new Date(),
        },
      });

      await writeAuditLog({
        userId: session.id,
        action: 'CORRECTION_REQUEST_REJECTED',
        resourceType: 'CORRECTION_REQUEST',
        resourceId: correctionRequestId,
        patientId: correctionRequest.patientId,
        metadata: JSON.stringify({ reviewNotes }),
        request,
      });

      await createNotification({
        userId: correctionRequest.patient.userId,
        type: 'CORRECTION_REJECTED',
        title: 'Correction Request Rejected',
        message: `Your correction request was reviewed and rejected. Notes: ${reviewNotes || 'No additional notes.'}`,
        resourceType: 'CORRECTION_REQUEST',
        resourceId: correctionRequestId,
      });

      return NextResponse.json({ success: true, status: 'REJECTED', request: updatedRequest });
    }

    const latestVersion = correctionRequest.record.versions[0];
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    const previousHash = latestVersion ? latestVersion.currentHash : null;

    const newSymptoms = symptoms || correctionRequest.requestedCorrection || latestVersion?.symptoms || '';
    const newDiagnosis = diagnosis || latestVersion?.diagnosis || '';
    const newPrescription = prescription || latestVersion?.prescription || '';
    const newNotes = notes || latestVersion?.notes || '';
    const versionReason = `PATIENT_CORRECTION_APPROVED: ${correctionRequest.reason}`;

    const newVersionData = {
      recordId: correctionRequest.recordId,
      versionNumber: nextVersionNumber,
      createdById: session.id,
      symptoms: newSymptoms,
      diagnosis: newDiagnosis,
      prescription: newPrescription,
      notes: newNotes,
      versionReason,
      previousHash,
    };

    const currentHash = generateRecordHash(newVersionData);

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { id: session.doctorProfileId },
      select: { publicSigningKey: true },
    });

    const { signature, signingPublicKey } = signMedicalRecordVersion(
      currentHash,
      session.doctorProfileId,
      null,
      doctorProfile?.publicSigningKey
    );

    const result = await prisma.$transaction(async (tx) => {
      const newVersion = await tx.medicalRecordVersion.create({
        data: {
          ...newVersionData,
          currentHash,
          correctionRequestId: correctionRequest.id,
          previousVersionId: latestVersion?.id || null,
          doctorSignature: signature,
          signingPublicKey,
        },
      });

      const approvedRequest = await tx.correctionRequest.update({
        where: { id: correctionRequestId },
        data: {
          status: 'APPROVED',
          reviewedById: session.id,
          reviewNotes: reviewNotes || 'Correction approved and new record version created.',
          reviewedAt: new Date(),
        },
      });

      return { newVersion, approvedRequest };
    });

    await writeAuditLog({
      userId: session.id,
      action: 'CORRECTION_REQUEST_APPROVED',
      resourceType: 'CORRECTION_REQUEST',
      resourceId: correctionRequestId,
      patientId: correctionRequest.patientId,
      metadata: JSON.stringify({
        newVersionNumber: result.newVersion.versionNumber,
        currentHash: result.newVersion.currentHash,
        previousHash: result.newVersion.previousHash,
        doctorSignature: result.newVersion.doctorSignature,
      }),
      request,
    });

    await createNotification({
      userId: correctionRequest.patient.userId,
      type: 'CORRECTION_APPROVED',
      title: 'Correction Approved — New Version Created',
      message: `Your correction was approved. Version ${result.newVersion.versionNumber} has been created. Previous versions remain intact.`,
      resourceType: 'MEDICAL_RECORD',
      resourceId: correctionRequest.recordId,
    });

    return NextResponse.json({
      success: true,
      status: 'APPROVED',
      version: result.newVersion,
      request: result.approvedRequest,
    });
  } catch (error: any) {
    console.error('Review Correction Error:', error);
    return NextResponse.json({ error: 'Failed to process correction review' }, { status: 500 });
  }
}
