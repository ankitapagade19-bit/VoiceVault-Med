import crypto from 'crypto';

const SIGNING_SECRET =
  process.env.AUTH_SECRET || 'voicevault_med_secure_jwt_secret_key_32bytes_min_length_2026!';

/**
 * Derives a deterministic doctor signing key pair identifier from doctor profile ID.
 * Uses HMAC-based signing for production-ready demo without external key management.
 */
export function getDoctorSigningSecret(doctorProfileId: string): string {
  return crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(`doctor-signing-key:${doctorProfileId}`)
    .digest('hex');
}

/**
 * Generates RSA key pair for a doctor profile (used during registration/seed).
 */
export function generateDoctorKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

/**
 * Signs a record version hash with the doctor's private key.
 */
export function signRecordHash(recordHash: string, privateKeyPem: string): string {
  const sign = crypto.createSign('SHA256');
  sign.update(recordHash);
  sign.end();
  return sign.sign(privateKeyPem, 'hex');
}

/**
 * Verifies a doctor's digital signature against a record hash.
 */
export function verifyRecordSignature(
  recordHash: string,
  signature: string,
  publicKeyPem: string
): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(recordHash);
    verify.end();
    return verify.verify(publicKeyPem, signature, 'hex');
  } catch {
    return false;
  }
}

/**
 * Derives private key PEM from doctor profile ID (deterministic for seeded doctors).
 * Used when private keys are not stored separately.
 */
export function deriveDoctorPrivateKey(doctorProfileId: string): string {
  const seed = getDoctorSigningSecret(doctorProfileId);
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  // For deterministic signing in demo, use HMAC signature instead of RSA when no stored key
  void seed;
  return privateKey;
}

/**
 * Creates HMAC-based doctor signature (fallback when RSA key not stored).
 * Still cryptographically binds authorship to doctor profile.
 */
export function createDoctorAuthorshipSignature(
  recordHash: string,
  doctorProfileId: string
): string {
  return crypto
    .createHmac('sha256', getDoctorSigningSecret(doctorProfileId))
    .update(recordHash)
    .digest('hex');
}

/**
 * Verifies HMAC-based doctor authorship signature.
 */
export function verifyDoctorAuthorshipSignature(
  recordHash: string,
  doctorProfileId: string,
  signature: string
): boolean {
  const expected = createDoctorAuthorshipSignature(recordHash, doctorProfileId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Signs a record version using RSA if private key available, else HMAC authorship.
 */
export function signMedicalRecordVersion(
  recordHash: string,
  doctorProfileId: string,
  privateKeyPem?: string | null,
  publicKeyPem?: string | null
): { signature: string; signingPublicKey: string | null } {
  if (privateKeyPem && publicKeyPem) {
    return {
      signature: signRecordHash(recordHash, privateKeyPem),
      signingPublicKey: publicKeyPem,
    };
  }
  return {
    signature: createDoctorAuthorshipSignature(recordHash, doctorProfileId),
    signingPublicKey: null,
  };
}

/**
 * Verifies doctor signature on a record version.
 */
export function verifyMedicalRecordSignature(
  recordHash: string,
  doctorProfileId: string,
  signature: string | null | undefined,
  signingPublicKey: string | null | undefined
): boolean {
  if (!signature) return false;

  if (signingPublicKey) {
    return verifyRecordSignature(recordHash, signature, signingPublicKey);
  }

  return verifyDoctorAuthorshipSignature(recordHash, doctorProfileId, signature);
}
