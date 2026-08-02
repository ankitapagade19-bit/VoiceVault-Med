import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessPatient } from '@/lib/authorization';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const patientId = params.id;

  const authCheck = await canAccessPatient(session, patientId);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
  }

  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNumber: 'asc' },
          include: {
            createdBy: { select: { name: true, role: true } },
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

    return NextResponse.json({ patient, records });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}
