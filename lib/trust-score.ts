import { verifyRecordChain } from './hashing';
import { verifyMedicalRecordSignature } from './signatures';
import { verifyAuditChain } from './audit-chain';

export interface TrustScoreBreakdown {
  hashVerification: number;
  chainVerification: number;
  signatureVerification: number;
  auditConsistency: number;
  voiceVerification: number;
}

export interface TrustScoreResult {
  score: number;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'COMPROMISED';
  breakdown: TrustScoreBreakdown;
  details: string[];
}

interface RecordVersionForTrust {
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
  doctorSignature?: string | null;
  signingPublicKey?: string | null;
  createdBy?: { doctorProfile?: { id: string } | null };
}

interface VoiceForTrust {
  fileHash: string;
  ipfsCid: string;
}

/**
 * Calculates a 0-100 trust score for a medical record based on multiple verification dimensions.
 */
export async function calculateTrustScore(
  versions: RecordVersionForTrust[],
  voices: VoiceForTrust[] = [],
  originatingDoctorProfileId?: string | null
): Promise<TrustScoreResult> {
  const details: string[] = [];
  const breakdown: TrustScoreBreakdown = {
    hashVerification: 0,
    chainVerification: 0,
    signatureVerification: 0,
    auditConsistency: 0,
    voiceVerification: 0,
  };

  if (versions.length === 0) {
    return {
      score: 0,
      grade: 'COMPROMISED',
      breakdown,
      details: ['No record versions found.'],
    };
  }

  // Hash + chain verification (40 points total)
  const chainResult = verifyRecordChain(versions);
  if (chainResult.isVerified) {
    breakdown.hashVerification = 20;
    breakdown.chainVerification = 20;
    details.push('SHA-256 hash chain fully verified.');
  } else {
    details.push(`Chain verification failed: ${chainResult.message}`);
    breakdown.hashVerification = chainResult.status === 'TAMPER_DETECTED' ? 0 : 5;
    breakdown.chainVerification = 0;
  }

  // Digital signature verification (25 points)
  let signedCount = 0;
  let verifiedSignatures = 0;

  for (const v of versions) {
    if (v.doctorSignature) {
      signedCount++;
      const doctorProfileId =
        v.createdBy?.doctorProfile?.id || originatingDoctorProfileId || '';
      if (
        doctorProfileId &&
        verifyMedicalRecordSignature(
          v.currentHash,
          doctorProfileId,
          v.doctorSignature,
          v.signingPublicKey
        )
      ) {
        verifiedSignatures++;
      }
    }
  }

  if (signedCount === 0) {
    breakdown.signatureVerification = 10;
    details.push('No digital signatures present (legacy records).');
  } else {
    const sigRatio = verifiedSignatures / signedCount;
    breakdown.signatureVerification = Math.round(sigRatio * 25);
    details.push(`${verifiedSignatures}/${signedCount} doctor signatures verified.`);
  }

  // Audit consistency (20 points)
  const auditResult = await verifyAuditChain(200);
  if (auditResult.isVerified) {
    breakdown.auditConsistency = 20;
    details.push('Audit log hash chain verified.');
  } else {
    breakdown.auditConsistency = auditResult.status === 'TAMPER_DETECTED' ? 0 : 5;
    details.push(`Audit chain issue: ${auditResult.message}`);
  }

  // Voice verification (15 points) - CID and hash present
  if (voices.length === 0) {
    breakdown.voiceVerification = 15;
    details.push('No voice consultations (N/A — full points).');
  } else {
    const validVoices = voices.filter((v) => v.fileHash && v.ipfsCid);
    breakdown.voiceVerification = Math.round((validVoices.length / voices.length) * 15);
    details.push(`${validVoices.length}/${voices.length} voice files have valid IPFS metadata.`);
  }

  const score =
    breakdown.hashVerification +
    breakdown.chainVerification +
    breakdown.signatureVerification +
    breakdown.auditConsistency +
    breakdown.voiceVerification;

  let grade: TrustScoreResult['grade'];
  if (score >= 90) grade = 'EXCELLENT';
  else if (score >= 75) grade = 'GOOD';
  else if (score >= 55) grade = 'FAIR';
  else if (score >= 30) grade = 'POOR';
  else grade = 'COMPROMISED';

  return { score, grade, breakdown, details };
}
