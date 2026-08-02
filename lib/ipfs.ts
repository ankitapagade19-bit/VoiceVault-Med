import { generateFileHash } from './hashing';
import path from 'path';
import { getIpfsAudioUrl } from './ipfs-client';

export { getIpfsAudioUrl };

export interface IpfsUploadResult {
  cid: string;
  fileHash: string;
  fileSize: number;
  provider: 'pinata' | 'local_fallback';
}

/**
 * Server-Side IPFS Storage Abstraction Engine
 * Pinata IPFS pinFileToIPFS integration + Local filesystem fallback for offline development.
 */
export async function uploadAudioToIpfs(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<IpfsUploadResult> {
  const fileHash = generateFileHash(fileBuffer);
  const fileSize = fileBuffer.length;

  const pinataJwt = process.env.PINATA_JWT;

  // Use Pinata if JWT is configured
  if (pinataJwt && pinataJwt.trim() !== '') {
    try {
      const formData = new FormData();
      const uint8Array = new Uint8Array(fileBuffer);
      const blob = new Blob([uint8Array], { type: mimeType });
      formData.append('file', blob, fileName);

      const metadata = JSON.stringify({
        name: fileName,
        keyvalues: { fileHash, app: 'VoiceVault_Med' },
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({ cidVersion: 1 });
      formData.append('pinataOptions', options);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          cid: data.IpfsHash,
          fileHash,
          fileSize,
          provider: 'pinata',
        };
      }
      console.warn('Pinata API failed, falling back to local storage adapter:', await response.text());
    } catch (error) {
      console.warn('Pinata request error, using fallback:', error);
    }
  }

  // Fallback: Local storage adapter for offline development
  const fs = await import('fs');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate deterministic CID representation from SHA-256 hash
  const pseudoCid = `QmVoiceVault${fileHash.substring(0, 32)}`;
  const localFileName = `${pseudoCid}-${path.basename(fileName)}`;
  const filePath = path.join(uploadDir, localFileName);

  fs.writeFileSync(filePath, fileBuffer);

  return {
    cid: pseudoCid,
    fileHash,
    fileSize,
    provider: 'local_fallback',
  };
}
