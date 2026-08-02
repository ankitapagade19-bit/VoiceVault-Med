import crypto from 'crypto';

export interface RecordVersionDataInput {
  recordId: string;
  versionNumber: number;
  createdById: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  versionReason: string;
  previousHash: string | null;
}

export type ChainVerificationStatus =
  | 'VERIFIED'
  | 'TAMPER_DETECTED'
  | 'BROKEN_CHAIN'
  | 'INVALID_VERSION_SEQUENCE';

export interface ChainVerificationResult {
  status: ChainVerificationStatus;
  isVerified: boolean;
  message: string;
  verifiedVersionCount: number;
  failedVersionNumber?: number;
  details?: {
    versionNumber: number;
    expectedHash?: string;
    actualHash?: string;
    expectedPreviousHash?: string;
    actualPreviousHash?: string;
  };
}

/**
 * Creates a deterministic, key-sorted canonical string representation
 * of integrity-relevant medical record version fields before hashing.
 */
export function canonicalizeRecordVersionData(data: RecordVersionDataInput): string {
  const canonicalObject = {
    createdById: data.createdById?.trim() || '',
    diagnosis: data.diagnosis?.trim() || '',
    notes: data.notes?.trim() || '',
    previousHash: data.previousHash || null,
    prescription: data.prescription?.trim() || '',
    recordId: data.recordId?.trim() || '',
    symptoms: data.symptoms?.trim() || '',
    versionNumber: Number(data.versionNumber),
    versionReason: data.versionReason?.trim() || '',
  };

  return JSON.stringify(canonicalObject, Object.keys(canonicalObject).sort());
}

/**
 * Calculates SHA-256 hash over canonical record version representation.
 */
export function generateRecordHash(data: RecordVersionDataInput): string {
  const canonicalString = canonicalizeRecordVersionData(data);
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Verifies a single record version by recomputing its cryptographic SHA-256 hash.
 */
export function verifyRecordVersion(
  data: RecordVersionDataInput,
  storedCurrentHash: string
): boolean {
  const recomputedHash = generateRecordHash(data);
  return recomputedHash === storedCurrentHash;
}

/**
 * Verifies the full cryptographic hash-chain across all versions of a medical record.
 * Checks:
 * 1. Recomputed hash equals stored currentHash for every version.
 * 2. Version N previousHash equals Version N-1 currentHash.
 * 3. Sequential version numbers (1, 2, 3...).
 */
export function verifyRecordChain(
  versions: Array<{
    versionNumber: number;
    recordId: string;
    createdById: string;
    symptoms: string;
    diagnosis: string;
    prescription: string;
    notes: string;
    versionReason: string;
    previousHash: string | null;
    currentHash: string;
  }>
): ChainVerificationResult {
  if (!versions || versions.length === 0) {
    return {
      status: 'VERIFIED',
      isVerified: true,
      message: 'No record versions to verify.',
      verifiedVersionCount: 0,
    };
  }

  // Sort versions ascending by versionNumber
  const sorted = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

  // Validate initial sequence
  if (sorted[0].versionNumber !== 1) {
    return {
      status: 'INVALID_VERSION_SEQUENCE',
      isVerified: false,
      message: `Initial version number must be 1, but found version ${sorted[0].versionNumber}`,
      verifiedVersionCount: 0,
      failedVersionNumber: sorted[0].versionNumber,
    };
  }

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Check version sequence continuity
    if (i > 0 && current.versionNumber !== sorted[i - 1].versionNumber + 1) {
      return {
        status: 'INVALID_VERSION_SEQUENCE',
        isVerified: false,
        message: `Broken sequence: expected version ${sorted[i - 1].versionNumber + 1}, found version ${current.versionNumber}`,
        verifiedVersionCount: i,
        failedVersionNumber: current.versionNumber,
      };
    }

    // Check previous hash link
    if (i === 0) {
      if (current.previousHash !== null && current.previousHash !== '') {
        return {
          status: 'BROKEN_CHAIN',
          isVerified: false,
          message: `Genesis Version 1 must have null previousHash, but found '${current.previousHash}'`,
          verifiedVersionCount: 0,
          failedVersionNumber: 1,
          details: {
            versionNumber: 1,
            expectedPreviousHash: 'null',
            actualPreviousHash: current.previousHash || undefined,
          },
        };
      }
    } else {
      const prevVersion = sorted[i - 1];
      if (current.previousHash !== prevVersion.currentHash) {
        return {
          status: 'BROKEN_CHAIN',
          isVerified: false,
          message: `Hash link broken at Version ${current.versionNumber}. Previous hash does not match Version ${prevVersion.versionNumber}'s current hash.`,
          verifiedVersionCount: i,
          failedVersionNumber: current.versionNumber,
          details: {
            versionNumber: current.versionNumber,
            expectedPreviousHash: prevVersion.currentHash,
            actualPreviousHash: current.previousHash || undefined,
          },
        };
      }
    }

    // Verify current content hash against stored hash
    const input: RecordVersionDataInput = {
      recordId: current.recordId,
      versionNumber: current.versionNumber,
      createdById: current.createdById,
      symptoms: current.symptoms,
      diagnosis: current.diagnosis,
      prescription: current.prescription,
      notes: current.notes,
      versionReason: current.versionReason,
      previousHash: current.previousHash,
    };

    const recomputedHash = generateRecordHash(input);

    if (recomputedHash !== current.currentHash) {
      return {
        status: 'TAMPER_DETECTED',
        isVerified: false,
        message: `Tamper detected at Version ${current.versionNumber}! Content hash mismatch. Stored hash does not match computed SHA-256.`,
        verifiedVersionCount: i,
        failedVersionNumber: current.versionNumber,
        details: {
          versionNumber: current.versionNumber,
          expectedHash: current.currentHash,
          actualHash: recomputedHash,
        },
      };
    }
  }

  return {
    status: 'VERIFIED',
    isVerified: true,
    message: `All ${sorted.length} version(s) in the cryptographic chain are 100% verified and authentic.`,
    verifiedVersionCount: sorted.length,
  };
}

/**
 * Generates SHA-256 hash of an audio file Buffer or Uint8Array.
 */
export function generateFileHash(fileBuffer: Buffer | Uint8Array): string {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}
