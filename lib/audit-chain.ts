import crypto from 'crypto';
import { prisma } from './db';

export interface AuditChainEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  patientId: string | null;
  success: boolean;
  metadata: string | null;
  ipAddress: string | null;
  previousHash: string | null;
  createdAt: Date;
}

/**
 * Canonicalizes audit log fields for hash chain computation.
 */
export function canonicalizeAuditEntry(data: {
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  patientId: string | null;
  success: boolean;
  metadata: string | null;
  ipAddress: string | null;
  previousHash: string | null;
  createdAt: string;
}): string {
  const canonical = {
    action: data.action,
    createdAt: data.createdAt,
    ipAddress: data.ipAddress || null,
    metadata: data.metadata || null,
    patientId: data.patientId || null,
    previousHash: data.previousHash || null,
    resourceId: data.resourceId || null,
    resourceType: data.resourceType,
    success: data.success,
    userId: data.userId || null,
  };
  return JSON.stringify(canonical, Object.keys(canonical).sort());
}

/**
 * Computes SHA-256 hash for an audit log entry.
 */
export function generateAuditHash(data: Parameters<typeof canonicalizeAuditEntry>[0]): string {
  return crypto.createHash('sha256').update(canonicalizeAuditEntry(data), 'utf8').digest('hex');
}

/**
 * Retrieves the latest audit log hash for chain linking.
 */
export async function getLatestAuditHash(): Promise<string | null> {
  try {
    const dbQuery = prisma.auditLog.findFirst({
      where: { currentHash: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { currentHash: true },
    }).then(latest => latest?.currentHash ?? null);

    const timeout = new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 200));
    return await Promise.race([dbQuery, timeout]);
  } catch {
    return null;
  }
}

/**
 * Verifies the full audit log hash chain.
 */
export async function verifyAuditChain(limit: number = 500): Promise<{
  isVerified: boolean;
  status: 'VERIFIED' | 'TAMPER_DETECTED' | 'BROKEN_CHAIN';
  message: string;
  verifiedCount: number;
  failedLogId?: string;
}> {
  const logs = await prisma.auditLog.findMany({
    where: { currentHash: { not: null } },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  if (logs.length === 0) {
    return { isVerified: true, status: 'VERIFIED', message: 'No chained audit logs to verify.', verifiedCount: 0 };
  }

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    if (i === 0) {
      if (log.previousHash !== null && log.previousHash !== '') {
        return {
          isVerified: false,
          status: 'BROKEN_CHAIN',
          message: 'Genesis audit log must have null previousHash.',
          verifiedCount: 0,
          failedLogId: log.id,
        };
      }
    } else {
      const prev = logs[i - 1];
      if (log.previousHash !== prev.currentHash) {
        return {
          isVerified: false,
          status: 'BROKEN_CHAIN',
          message: `Audit chain broken at log ${log.id}.`,
          verifiedCount: i,
          failedLogId: log.id,
        };
      }
    }

    const recomputed = generateAuditHash({
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      patientId: log.patientId,
      success: log.success,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      previousHash: log.previousHash,
      createdAt: log.createdAt.toISOString(),
    });

    if (recomputed !== log.currentHash) {
      return {
        isVerified: false,
        status: 'TAMPER_DETECTED',
        message: `Audit tamper detected at log ${log.id}.`,
        verifiedCount: i,
        failedLogId: log.id,
      };
    }
  }

  return {
    isVerified: true,
    status: 'VERIFIED',
    message: `All ${logs.length} audit log entries verified.`,
    verifiedCount: logs.length,
  };
}
