import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { createUserSchema } from '@/lib/validation';
import { writeAuditLog } from '@/lib/audit';
import { generateDoctorKeyPair } from '@/lib/signatures';

export async function GET(request: Request) {
  const session = await getSession();
  const auth = await requireRole(session, ['ADMIN', 'STAFF']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const roleFilter = searchParams.get('role')?.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(roleFilter && ['ADMIN', 'STAFF', 'DOCTOR', 'PATIENT'].includes(roleFilter) ? { role: roleFilter as any } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
      createdAt: true,
      doctorProfile: true,
      patientProfile: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  const auth = await requireRole(session, ['ADMIN', 'STAFF']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error', details: validation.error.format() }, { status: 400 });
    }

    const {
      name,
      email,
      password,
      role,
      doctorCode,
      specialization,
      patientCode,
      dateOfBirth,
      phone,
      bloodType,
      emergencyContact,
    } = validation.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          role,
          status: 'ACTIVE',
          mustChangePassword: true,
        },
      });

      if (role === 'DOCTOR') {
        const dCode = doctorCode || `DOC-${Math.floor(100 + Math.random() * 900)}`;
        const { publicKey } = generateDoctorKeyPair();
        await tx.doctorProfile.create({
          data: {
            userId: user.id,
            doctorCode: dCode,
            specialization: specialization || 'General Medicine',
            publicSigningKey: publicKey,
          },
        });
      } else if (role === 'PATIENT') {
        const pCode = patientCode || `PAT-${Math.floor(100 + Math.random() * 900)}`;
        await tx.patientProfile.create({
          data: {
            userId: user.id,
            patientCode: pCode,
            dateOfBirth: dateOfBirth || null,
            phone: phone || null,
            bloodType: bloodType || 'O+',
            emergencyContact: emergencyContact || null,
          },
        });
      }

      return user;
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: newUser.id,
      metadata: JSON.stringify({ name: newUser.name, role: newUser.role }),
      request,
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, name: newUser.name, role: newUser.role } });
  } catch (error: any) {
    console.error('Create User Error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  const auth = await requireRole(session, ['STAFF']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  try {
    const { userId, status } = await request.json();
    if (!userId || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await writeAuditLog({
      userId: session!.id,
      action: 'USER_STATUS_CHANGED',
      resourceType: 'USER',
      resourceId: userId,
      metadata: JSON.stringify({ newStatus: status }),
    });

    return NextResponse.json({ success: true, status: updatedUser.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
