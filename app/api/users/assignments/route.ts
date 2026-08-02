import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { assignDoctorPatientSchema } from '@/lib/validation';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  const session = await getSession();
  const auth = await requireRole(session, ['STAFF']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validation = assignDoctorPatientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid assignment parameters' }, { status: 400 });
    }

    const { doctorId, patientId } = validation.data;

    const assignment = await prisma.doctorPatientAssignment.upsert({
      where: {
        doctorId_patientId: { doctorId, patientId },
      },
      update: { active: true },
      create: { doctorId, patientId, active: true },
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'PATIENT_ASSIGNMENT_CREATED',
      resourceType: 'DOCTOR_PATIENT_ASSIGNMENT',
      resourceId: assignment.id,
      patientId: patientId,
      metadata: JSON.stringify({ doctorId, patientId }),
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Assignment Error:', error);
    return NextResponse.json({ error: 'Failed to assign doctor to patient' }, { status: 500 });
  }
}
