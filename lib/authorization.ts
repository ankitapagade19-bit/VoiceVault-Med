import { prisma } from './db';
import { SessionUser } from './auth';
import { writeAuditLog } from './audit';
import { hasPermission, Role } from './permissions';

export interface AuthorizationResult {
  authorized: boolean;
  status: number;
  reason?: string;
}

const EMERGENCY_ACCESS_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Validates that user is authenticated and their account is ACTIVE.
 */
export async function requireAuthenticatedUser(
  session: SessionUser | null,
  request?: Request
): Promise<AuthorizationResult> {
  if (!session) {
    return { authorized: false, status: 401, reason: 'Unauthenticated. Please log in.' };
  }

  if (session.status !== 'ACTIVE') {
    await writeAuditLog({
      userId: session.id,
      action: 'ACCESS_DENIED',
      resourceType: 'ACCOUNT',
      resourceId: session.id,
      success: false,
      metadata: JSON.stringify({ reason: 'Account is inactive' }),
      request,
    });
    return { authorized: false, status: 403, reason: 'Account is inactive. Contact administrative staff.' };
  }

  return { authorized: true, status: 200 };
}

/**
 * Validates that authenticated user possesses one of the allowed roles.
 */
export async function requireRole(
  session: SessionUser | null,
  allowedRoles: Array<'ADMIN' | 'STAFF' | 'DOCTOR' | 'PATIENT'>,
  request?: Request
): Promise<AuthorizationResult> {
  const authCheck = await requireAuthenticatedUser(session, request);
  if (!authCheck.authorized) return authCheck;

  if (!allowedRoles.includes(session!.role)) {
    await writeAuditLog({
      userId: session!.id,
      action: 'ACCESS_DENIED',
      resourceType: 'ROLE_PERMISSION',
      success: false,
      metadata: JSON.stringify({
        userRole: session!.role,
        requiredRoles: allowedRoles,
      }),
      request,
    });
    return {
      authorized: false,
      status: 403,
      reason: `Forbidden. Role '${session!.role}' is not authorized for this resource.`,
    };
  }

  return { authorized: true, status: 200 };
}

/**
 * Zero Trust permission check using the centralized permissions map.
 */
export async function requirePermission(
  session: SessionUser | null,
  permission: string,
  request?: Request
): Promise<AuthorizationResult> {
  const authCheck = await requireAuthenticatedUser(session, request);
  if (!authCheck.authorized) return authCheck;

  if (!hasPermission(session!.role as Role, permission)) {
    await writeAuditLog({
      userId: session!.id,
      action: 'ACCESS_DENIED',
      resourceType: 'PERMISSION',
      success: false,
      metadata: JSON.stringify({ permission, role: session!.role }),
      request,
    });
    return {
      authorized: false,
      status: 403,
      reason: `Forbidden. Missing permission: ${permission}`,
    };
  }

  return { authorized: true, status: 200 };
}

/**
 * Checks if doctor has active emergency break-glass access to a patient.
 */
export async function hasEmergencyAccess(
  doctorProfileId: string,
  patientProfileId: string
): Promise<boolean> {
  const access = await prisma.emergencyAccess.findFirst({
    where: {
      doctorId: doctorProfileId,
      patientId: patientProfileId,
      expiresAt: { gt: new Date() },
    },
  });
  return !!access;
}

/**
 * ZERO TRUST CHECK: Doctor-Patient Relationship, Self-Ownership, or Emergency Access.
 */
export async function canAccessPatient(
  session: SessionUser | null,
  patientProfileId: string,
  request?: Request
): Promise<AuthorizationResult> {
  const authCheck = await requireAuthenticatedUser(session, request);
  if (!authCheck.authorized) return authCheck;

  if (session!.role === 'ADMIN' || session!.role === 'STAFF') {
    return { authorized: true, status: 200 };
  }

  if (session!.role === 'PATIENT') {
    if (session!.patientProfileId !== patientProfileId) {
      await writeAuditLog({
        userId: session!.id,
        action: 'ACCESS_DENIED',
        resourceType: 'PATIENT_PROFILE',
        resourceId: patientProfileId,
        patientId: patientProfileId,
        success: false,
        metadata: JSON.stringify({ reason: 'Patient attempted to access another patient data' }),
        request,
      });
      return {
        authorized: false,
        status: 403,
        reason: 'Forbidden. Patients can only access their own medical records.',
      };
    }
    return { authorized: true, status: 200 };
  }

  if (session!.role === 'DOCTOR') {
    if (!session!.doctorProfileId) {
      return { authorized: false, status: 403, reason: 'Doctor profile missing' };
    }

    const assignment = await prisma.doctorPatientAssignment.findFirst({
      where: {
        doctorId: session!.doctorProfileId,
        patientId: patientProfileId,
        active: true,
      },
    });

    if (assignment) {
      return { authorized: true, status: 200 };
    }

    const emergency = await hasEmergencyAccess(session!.doctorProfileId, patientProfileId);
    if (emergency) {
      return { authorized: true, status: 200 };
    }

    await writeAuditLog({
      userId: session!.id,
      action: 'ACCESS_DENIED',
      resourceType: 'PATIENT_PROFILE',
      resourceId: patientProfileId,
      patientId: patientProfileId,
      success: false,
      metadata: JSON.stringify({ reason: 'Doctor is not assigned to this patient' }),
      request,
    });
    return {
      authorized: false,
      status: 403,
      reason: 'Forbidden. You are not an authorized doctor for this patient.',
    };
  }

  return { authorized: false, status: 403, reason: 'Unauthorized access.' };
}

/**
 * ZERO TRUST CHECK: Medical Record Ownership & Assignment
 */
export async function canAccessMedicalRecord(
  session: SessionUser | null,
  recordId: string,
  request?: Request
): Promise<AuthorizationResult> {
  const authCheck = await requireAuthenticatedUser(session, request);
  if (!authCheck.authorized) return authCheck;

  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    select: { patientId: true },
  });

  if (!record) {
    return { authorized: false, status: 404, reason: 'Medical record not found.' };
  }

  return canAccessPatient(session, record.patientId, request);
}

/**
 * ZERO TRUST CHECK: Can create medical record or approve correction
 */
export async function canModifyClinicalRecord(
  session: SessionUser | null,
  patientProfileId: string,
  request?: Request
): Promise<AuthorizationResult> {
  const roleCheck = await requireRole(session, ['DOCTOR'], request);
  if (!roleCheck.authorized) return roleCheck;

  const permCheck = await requirePermission(session, 'RECORD_CREATE', request);
  if (!permCheck.authorized) return permCheck;

  return canAccessPatient(session, patientProfileId, request);
}

/**
 * Grants emergency break-glass access for a doctor to a patient.
 */
export async function grantEmergencyAccess(
  session: SessionUser,
  patientProfileId: string,
  reason: string,
  request?: Request
): Promise<{ success: boolean; accessId?: string; expiresAt?: Date; error?: string }> {
  if (session.role !== 'DOCTOR' || !session.doctorProfileId) {
    return { success: false, error: 'Only doctors can request emergency access.' };
  }

  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Emergency reason must be at least 10 characters.' };
  }

  const expiresAt = new Date(Date.now() + EMERGENCY_ACCESS_DURATION_MS);

  const access = await prisma.emergencyAccess.create({
    data: {
      doctorId: session.doctorProfileId,
      patientId: patientProfileId,
      reason: reason.trim(),
      expiresAt,
    },
  });

  await writeAuditLog({
    userId: session.id,
    action: 'EMERGENCY_ACCESS',
    resourceType: 'PATIENT_PROFILE',
    resourceId: patientProfileId,
    patientId: patientProfileId,
    success: true,
    metadata: JSON.stringify({
      emergencyAccessId: access.id,
      reason: reason.trim(),
      expiresAt: expiresAt.toISOString(),
    }),
    request,
  });

  return { success: true, accessId: access.id, expiresAt };
}
