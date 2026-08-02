import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { generateRecordHash } from '@/lib/hashing';
import { writeAuditLog } from '@/lib/audit';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const roleCheck = await requireRole(session, ['ADMIN', 'DOCTOR'], request);
    if (!roleCheck.authorized) {
      return NextResponse.json({ error: roleCheck.reason }, { status: roleCheck.status });
    }

    const { id } = params;
    const body = await request.json();
    const { action, reviewNotes, symptoms, diagnosis, prescription, notes } = body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Action must be APPROVE or REJECT' }, { status: 400 });
    }

    const correction = await prisma.correctionRequest.findUnique({
      where: { id },
      include: {
        record: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!correction) {
      return NextResponse.json({ error: 'Correction request not found' }, { status: 404 });
    }

    if (correction.status !== 'PENDING') {
      return NextResponse.json({ error: `Correction request is already ${correction.status}` }, { status: 400 });
    }

    if (action === 'REJECT') {
      const updated = await prisma.correctionRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedById: session!.id,
          reviewNotes: reviewNotes || 'Correction request rejected by administrative review.',
          reviewedAt: new Date(),
        },
      });

      await writeAuditLog({
        userId: session!.id,
        action: 'CORRECTION_REQUEST_REJECTED',
        resourceType: 'CORRECTION_REQUEST',
        resourceId: id,
        patientId: correction.patientId,
        success: true,
        metadata: JSON.stringify({ reviewNotes }),
        request,
      });

      return NextResponse.json({ success: true, correction: updated });
    }

    // ACTION === APPROVE: Create new immutable version
    const latestVersion = correction.record.versions[0];
    const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    const previousHash = latestVersion ? latestVersion.currentHash : null;

    const newSymptoms = symptoms || latestVersion?.symptoms || 'Updated symptoms following correction';
    const newDiagnosis = diagnosis || latestVersion?.diagnosis || 'Updated diagnosis following correction';
    const newPrescription = prescription || latestVersion?.prescription || 'Updated prescription';
    const newNotes = notes || latestVersion?.notes || 'Correction applied by administrative review';
    const versionReason = `CORRECTION_APPROVED: ${correction.reason}`;

    const versionDataInput = {
      recordId: correction.recordId,
      versionNumber: newVersionNumber,
      createdById: session!.id,
      symptoms: newSymptoms,
      diagnosis: newDiagnosis,
      prescription: newPrescription,
      notes: newNotes,
      versionReason,
      previousHash,
    };

    const currentHash = generateRecordHash(versionDataInput);

    const result = await prisma.$transaction(async (tx) => {
      const newVersion = await tx.medicalRecordVersion.create({
        data: {
          recordId: correction.recordId,
          versionNumber: newVersionNumber,
          symptoms: newSymptoms,
          diagnosis: newDiagnosis,
          prescription: newPrescription,
          notes: newNotes,
          previousHash,
          currentHash,
          createdById: session!.id,
          correctionRequestId: correction.id,
          versionReason,
        },
      });

      const updatedCorrection = await tx.correctionRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: session!.id,
          reviewNotes: reviewNotes || 'Approved and new immutable version created.',
          reviewedAt: new Date(),
        },
      });

      return { newVersion, updatedCorrection };
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'CORRECTION_REQUEST_APPROVED',
      resourceType: 'CORRECTION_REQUEST',
      resourceId: id,
      patientId: correction.patientId,
      success: true,
      metadata: JSON.stringify({
        newVersionNumber,
        currentHash,
        previousHash,
      }),
      request,
    });

    return NextResponse.json({
      success: true,
      correction: result.updatedCorrection,
      version: result.newVersion,
    });
  } catch (error: any) {
    console.error('Error reviewing correction request:', error);
    return NextResponse.json({ error: error.message || 'Failed to review correction request.' }, { status: 500 });
  }
}
