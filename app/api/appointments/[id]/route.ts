import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireAuthenticatedUser } from '@/lib/authorization';
import { writeAuditLog } from '@/lib/audit';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const authCheck = await requireAuthenticatedUser(session, request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'ADMIN_ACTION',
      resourceType: 'APPOINTMENT',
      resourceId: updated.id,
      patientId: updated.patientId,
      success: true,
      metadata: JSON.stringify({ status, notes }),
      request,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const authCheck = await requireAuthenticatedUser(session, request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'ADMIN_ACTION',
      resourceType: 'APPOINTMENT',
      resourceId: id,
      patientId: appointment.patientId,
      success: true,
      metadata: JSON.stringify({ action: 'CANCELLED' }),
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment.' }, { status: 500 });
  }
}
