import { describe, it, expect } from 'vitest';
import {
  canonicalizeRecordVersionData,
  generateRecordHash,
  verifyRecordVersion,
  verifyRecordChain,
  RecordVersionDataInput,
} from '../lib/hashing';

describe('Cryptographic Hash Chain Engine', () => {
  const v1Data: RecordVersionDataInput = {
    recordId: 'rec_1001',
    versionNumber: 1,
    createdById: 'doc_fleming',
    symptoms: 'Elevated BP 145/95 mmHg, mild headaches',
    diagnosis: 'Essential Stage 1 Hypertension',
    prescription: 'Lisinopril 10mg once daily',
    notes: 'Low sodium diet advised',
    versionReason: 'INITIAL_CLINICAL_CONSULTATION',
    previousHash: null,
  };

  it('should produce identical canonical strings regardless of field input whitespace ordering', () => {
    const canonical1 = canonicalizeRecordVersionData(v1Data);
    const canonical2 = canonicalizeRecordVersionData({ ...v1Data });

    expect(canonical1).toBe(canonical2);
    expect(canonical1).toContain('"versionNumber":1');
    expect(canonical1).toContain('"previousHash":null');
  });

  it('should generate a 64-character hex SHA-256 hash', () => {
    const hash = generateRecordHash(v1Data);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should detect altered clinical content immediately', () => {
    const hashOriginal = generateRecordHash(v1Data);

    const tamperedData: RecordVersionDataInput = {
      ...v1Data,
      prescription: 'Lisinopril 100mg once daily', // Altered dosage
    };

    const hashTampered = generateRecordHash(tamperedData);

    expect(hashOriginal).not.toBe(hashTampered);
    expect(verifyRecordVersion(tamperedData, hashOriginal)).toBe(false);
  });

  it('should verify a valid 2-version chain with previousHash linkage', () => {
    const v1Hash = generateRecordHash(v1Data);

    const v2Data: RecordVersionDataInput = {
      recordId: 'rec_1001',
      versionNumber: 2,
      createdById: 'doc_fleming',
      symptoms: 'BP 132/84 mmHg, headaches resolved',
      diagnosis: 'Essential Stage 1 Hypertension (Adjusted)',
      prescription: 'Lisinopril 20mg once daily',
      notes: 'Dosage increased following patient feedback',
      versionReason: 'PATIENT_CORRECTION_APPROVED',
      previousHash: v1Hash,
    };

    const v2Hash = generateRecordHash(v2Data);

    const versionChain = [
      { ...v1Data, currentHash: v1Hash },
      { ...v2Data, currentHash: v2Hash },
    ];

    const result = verifyRecordChain(versionChain);

    expect(result.status).toBe('VERIFIED');
    expect(result.isVerified).toBe(true);
    expect(result.verifiedVersionCount).toBe(2);
  });

  it('should report TAMPER_DETECTED when historical Version 1 text is modified without recalculating hash', () => {
    const v1Hash = generateRecordHash(v1Data);

    const v2Data: RecordVersionDataInput = {
      recordId: 'rec_1001',
      versionNumber: 2,
      createdById: 'doc_fleming',
      symptoms: 'BP 132/84 mmHg',
      diagnosis: 'Essential Stage 1 Hypertension',
      prescription: 'Lisinopril 20mg once daily',
      notes: 'Dosage updated',
      versionReason: 'CORRECTION',
      previousHash: v1Hash,
    };

    const v2Hash = generateRecordHash(v2Data);

    // Tampered chain: Version 1 diagnosis modified to "Terminal Stage 4" without changing stored currentHash
    const tamperedChain = [
      {
        ...v1Data,
        diagnosis: 'UNAUTHORIZED TAMPERED DIAGNOSIS',
        currentHash: v1Hash, // Stored original hash
      },
      { ...v2Data, currentHash: v2Hash },
    ];

    const result = verifyRecordChain(tamperedChain);

    expect(result.status).toBe('TAMPER_DETECTED');
    expect(result.isVerified).toBe(false);
    expect(result.failedVersionNumber).toBe(1);
  });
});
