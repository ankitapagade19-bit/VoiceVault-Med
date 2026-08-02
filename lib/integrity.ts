import { prisma } from './db';
import { verifyRecordChain, ChainVerificationStatus } from './hashing';

export interface RecordIntegritySummary {
  recordId: string;
  patientId: string;
  versionCount: number;
  status: ChainVerificationStatus;
  isVerified: boolean;
  latestHash: string | null;
  latestVersionNumber: number;
}

export interface SystemIntegrityMetrics {
  totalRecords: number;
  totalVersions: number;
  verifiedRecords: number;
  tamperedRecords: number;
  pendingCorrections: number;
  latestHash: string | null;
  latestVerificationTime: string | null;
  records: RecordIntegritySummary[];
}

/**
 * Verifies integrity of a single medical record's version chain.
 */
export async function verifySingleRecordIntegrity(recordId: string): Promise<RecordIntegritySummary | null> {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
    include: {
      versions: { orderBy: { versionNumber: 'asc' } },
    },
  });

  if (!record) return null;

  const verification = verifyRecordChain(record.versions);
  const latestVersion = record.versions[record.versions.length - 1];

  return {
    recordId: record.id,
    patientId: record.patientId,
    versionCount: record.versions.length,
    status: verification.status,
    isVerified: verification.isVerified,
    latestHash: latestVersion?.currentHash ?? null,
    latestVersionNumber: latestVersion?.versionNumber ?? 0,
  };
}

/**
 * Computes system-wide integrity metrics, optionally scoped to specific record IDs.
 */
export async function computeSystemIntegrityMetrics(
  recordIds?: string[]
): Promise<SystemIntegrityMetrics> {
  const whereClause = recordIds?.length ? { id: { in: recordIds } } : {};

  const [records, pendingCorrections, latestVerificationLog] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: whereClause,
      include: {
        versions: { orderBy: { versionNumber: 'asc' } },
      },
    }),
    prisma.correctionRequest.count({
      where: {
        status: 'PENDING',
        ...(recordIds?.length
          ? { recordId: { in: recordIds } }
          : {}),
      },
    }),
    prisma.auditLog.findFirst({
      where: { action: { in: ['INTEGRITY_VERIFICATION_RUN', 'INTEGRITY_FAILURE'] } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const summaries: RecordIntegritySummary[] = [];
  let verifiedRecords = 0;
  let tamperedRecords = 0;
  let totalVersions = 0;
  let latestHash: string | null = null;
  let latestVersionNumber = 0;

  for (const record of records) {
    const verification = verifyRecordChain(record.versions);
    const latestVersion = record.versions[record.versions.length - 1];

    totalVersions += record.versions.length;

    if (verification.isVerified) {
      verifiedRecords++;
    } else {
      tamperedRecords++;
    }

    if (latestVersion && latestVersion.versionNumber >= latestVersionNumber) {
      latestVersionNumber = latestVersion.versionNumber;
      latestHash = latestVersion.currentHash;
    }

    summaries.push({
      recordId: record.id,
      patientId: record.patientId,
      versionCount: record.versions.length,
      status: verification.status,
      isVerified: verification.isVerified,
      latestHash: latestVersion?.currentHash ?? null,
      latestVersionNumber: latestVersion?.versionNumber ?? 0,
    });
  }

  return {
    totalRecords: records.length,
    totalVersions,
    verifiedRecords,
    tamperedRecords,
    pendingCorrections,
    latestHash,
    latestVerificationTime: latestVerificationLog?.createdAt.toISOString() ?? null,
    records: summaries,
  };
}

/**
 * Resolves record IDs accessible to a doctor via active patient assignments.
 */
export async function getDoctorAccessibleRecordIds(doctorProfileId: string): Promise<string[]> {
  const assignments = await prisma.doctorPatientAssignment.findMany({
    where: { doctorId: doctorProfileId, active: true },
    select: { patientId: true },
  });

  const patientIds = assignments.map((a) => a.patientId);
  if (patientIds.length === 0) return [];

  const records = await prisma.medicalRecord.findMany({
    where: { patientId: { in: patientIds } },
    select: { id: true },
  });

  return records.map((r) => r.id);
}
