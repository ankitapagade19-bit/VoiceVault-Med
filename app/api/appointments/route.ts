import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireAuthenticatedUser } from '@/lib/authorization';
import { writeAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const authCheck = await requireAuthenticatedUser(session, request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    let appointments;

    if (session!.role === 'ADMIN' || session!.role === 'STAFF') {
      appointments = await prisma.appointment.findMany({
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          doctor: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { date: 'asc' },
      });
    } else if (session!.role === 'DOCTOR') {
      if (!session!.doctorProfileId) {
        return NextResponse.json({ error: 'Doctor profile missing' }, { status: 400 });
      }
      appointments = await prisma.appointment.findMany({
        where: { doctorId: session!.doctorProfileId },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          doctor: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { date: 'asc' },
      });
    } else if (session!.role === 'PATIENT') {
      if (!session!.patientProfileId) {
        return NextResponse.json({ error: 'Patient profile missing' }, { status: 400 });
      }
      appointments = await prisma.appointment.findMany({
        where: { patientId: session!.patientProfileId },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          doctor: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { date: 'asc' },
      });
    }

    return NextResponse.json({ appointments });
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const authCheck = await requireAuthenticatedUser(session, request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await request.json();
    const { doctorId, patientId: targetPatientId, date, timeSlot, reason } = body;

    if (!doctorId || !date || !timeSlot || !reason) {
      return NextResponse.json({ error: 'Doctor, Date, Time Slot, and Reason are required.' }, { status: 400 });
    }

    let finalPatientId = targetPatientId;
    if (session!.role === 'PATIENT') {
      finalPatientId = session!.patientProfileId;
    }

    if (!finalPatientId) {
      return NextResponse.json({ error: 'Patient ID is required.' }, { status: 400 });
    }

    // Get queue number for the day
    const existingCount = await prisma.appointment.count({
      where: { doctorId },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: finalPatientId,
        doctorId,
        date: new Date(date),
        timeSlot,
        reason: reason.trim(),
        status: 'SCHEDULED',
        queueNumber: existingCount + 1,
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
      resourceId: appointment.id,
      patientId: finalPatientId,
      success: true,
      metadata: JSON.stringify({ timeSlot, doctorId, date }),
      request,
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment.' }, { status: 500 });
  }
}
