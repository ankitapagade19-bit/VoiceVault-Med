import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import {
  computeSystemIntegrityMetrics,
  getDoctorAccessibleRecordIds,
} from '@/lib/integrity';
import { verifyAuditChain } from '@/lib/audit-chain';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    let metrics;

    if (session.role === 'STAFF') {
      metrics = await computeSystemIntegrityMetrics();
    } else if (session.role === 'DOCTOR' && session.doctorProfileId) {
      const auth = await requireRole(session, ['DOCTOR']);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.reason }, { status: auth.status });
      }
      const recordIds = await getDoctorAccessibleRecordIds(session.doctorProfileId);
      metrics = await computeSystemIntegrityMetrics(recordIds);
    } else if (session.role === 'PATIENT' && session.patientProfileId) {
      const { prisma } = await import('@/lib/db');
      const records = await prisma.medicalRecord.findMany({
        where: { patientId: session.patientProfileId },
        select: { id: true },
      });
      metrics = await computeSystemIntegrityMetrics(records.map((r) => r.id));
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const auditChain = await verifyAuditChain(500);

    return NextResponse.json({
      metrics,
      auditChain: {
        status: auditChain.status,
        isVerified: auditChain.isVerified,
        message: auditChain.message,
        verifiedCount: auditChain.verifiedCount,
      },
    });
  } catch (error) {
    console.error('Integrity metrics error:', error);
    return NextResponse.json({ error: 'Failed to compute integrity metrics' }, { status: 500 });
  }
}
