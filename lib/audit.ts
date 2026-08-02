import { prisma } from './db';
import { getClientIp } from './request';
import { generateAuditHash, getLatestAuditHash } from './audit-chain';

export interface AuditLogInput {
  userId?: string | null;
  action:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'USER_CREATED'
    | 'USER_STATUS_CHANGED'
    | 'PATIENT_ASSIGNMENT_CREATED'
    | 'PATIENT_ACCESSED'
    | 'RECORD_CREATED'
    | 'RECORD_VIEWED'
    | 'RECORD_VERSION_CREATED'
    | 'CORRECTION_REQUEST_CREATED'
    | 'CORRECTION_REQUEST_APPROVED'
    | 'CORRECTION_REQUEST_REJECTED'
    | 'VOICE_UPLOADED'
    | 'VOICE_ACCESSED'
    | 'INTEGRITY_VERIFICATION_RUN'
    | 'INTEGRITY_FAILURE'
    | 'ACCESS_DENIED'
    | 'ADMIN_ACTION'
    | 'EMERGENCY_ACCESS'
    | 'NOTIFICATION_SENT';
  resourceType: string;
  resourceId?: string | null;
  patientId?: string | null;
  success?: boolean;
  metadata?: string | null;
  ipAddress?: string | null;
  request?: Request | null;
}

/**
 * Writes an append-only, cryptographically chained audit event log entry.
 */
export async function writeAuditLog(input: AuditLogInput) {
  try {
    let sanitizedMetadata = input.metadata;

    if (sanitizedMetadata) {
      try {
        const parsed = JSON.parse(sanitizedMetadata);
        delete parsed.password;
        delete parsed.passwordHash;
        delete parsed.token;
        delete parsed.secret;
        sanitizedMetadata = JSON.stringify(parsed);
      } catch {
        // Not valid JSON, keep string
      }
    }

    const ipAddress = input.ipAddress ?? (input.request ? getClientIp(input.request) : null);
    const previousHash = await getLatestAuditHash();
    const createdAt = new Date();
    const success = input.success !== undefined ? input.success : true;

    const currentHash = generateAuditHash({
      userId: input.userId || null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId || null,
      patientId: input.patientId || null,
      success,
      metadata: sanitizedMetadata || null,
      ipAddress,
      previousHash,
      createdAt: createdAt.toISOString(),
    });

    const dbPromise = prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId || null,
        patientId: input.patientId || null,
        success,
        metadata: sanitizedMetadata || null,
        ipAddress,
        previousHash,
        currentHash,
        createdAt,
      },
    });

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 200));
    return await Promise.race([dbPromise, timeoutPromise]);
  } catch (error) {
    console.error('Failed to write audit log entry:', error);
    return null;
  }
}
