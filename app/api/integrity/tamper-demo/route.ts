import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { writeAuditLog } from '@/lib/audit';

/**
 * Integrity verification helper endpoint.
 * Simulates unauthorized modification of a historical record version
 * without recalculating its SHA-256 hash so verification can detect tampering.
 */
export async function POST(request: Request) {
  const session = await getSession();
  const auth = await requireRole(session, ['DOCTOR', 'STAFF']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  try {
    const { recordId, versionNumber, tamperedSymptoms, tamperedDiagnosis } = await request.json();

    if (!recordId || !versionNumber) {
      return NextResponse.json({ error: 'recordId and versionNumber are required' }, { status: 400 });
    }

    const version = await prisma.medicalRecordVersion.findUnique({
      where: {
        recordId_versionNumber: {
          recordId,
          versionNumber: Number(versionNumber),
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Record version not found' }, { status: 404 });
    }

    // Direct DB update of symptoms/diagnosis WITHOUT updating currentHash
    await prisma.medicalRecordVersion.update({
      where: { id: version.id },
      data: {
        symptoms: tamperedSymptoms || `${version.symptoms} [TAMPERED DATA]`,
        diagnosis: tamperedDiagnosis || `${version.diagnosis} [TAMPERED DATA]`,
      },
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'ADMIN_ACTION',
      resourceType: 'INTEGRITY_BREACH_SIMULATION',
      resourceId: recordId,
      metadata: JSON.stringify({
        versionNumber,
        simulatedModification: 'Altered diagnosis without hash recalculation',
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Integrity breach simulation complete on Version ${versionNumber}. Verification will now fail with TAMPER_DETECTED.`,
    });
  } catch (error) {
    console.error('Tamper Demo Error:', error);
    return NextResponse.json({ error: 'Failed to simulate tamper' }, { status: 500 });
  }
}
