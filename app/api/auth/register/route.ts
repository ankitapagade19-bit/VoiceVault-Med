import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie, validatePasswordStrength } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'PATIENT', dateOfBirth, phone, bloodType, emergencyContact, doctorCode, specialization } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.issues.join(' ') }, { status: 400 });
    }

    // Check duplicate
    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const targetRole = ['ADMIN', 'STAFF', 'DOCTOR', 'PATIENT'].includes(role) ? role : 'PATIENT';

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
        role: targetRole,
        status: 'ACTIVE',
      },
    });

    let doctorProfileId: string | undefined;
    let patientProfileId: string | undefined;

    if (targetRole === 'PATIENT') {
      const patientCode = `PAT-${Math.floor(100 + Math.random() * 900)}`;
      const profile = await prisma.patientProfile.create({
        data: {
          userId: user.id,
          patientCode,
          dateOfBirth: dateOfBirth || null,
          phone: phone || null,
          bloodType: bloodType || null,
          emergencyContact: emergencyContact || null,
        },
      });
      patientProfileId = profile.id;
    } else if (targetRole === 'DOCTOR') {
      const code = doctorCode || `DOC-${Math.floor(100 + Math.random() * 900)}`;
      const profile = await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          doctorCode: code,
          specialization: specialization || 'General Medicine',
        },
      });
      doctorProfileId = profile.id;
    }

    await writeAuditLog({
      userId: user.id,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: user.id,
      success: true,
      metadata: JSON.stringify({ role: targetRole, email: trimmedEmail }),
      request,
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      doctorProfileId,
      patientProfileId,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: sessionUser }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during registration.' }, { status: 500 });
  }
}
