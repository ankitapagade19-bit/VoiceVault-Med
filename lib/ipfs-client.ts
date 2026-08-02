/**
 * Client-safe IPFS URL resolver.
 * Free of Node.js 'fs' dependencies, safe for browser components.
 */
export function getIpfsAudioUrl(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('QmVoiceVault')) {
    // Local fallback streaming route
    return `/api/voice/stream/${cid}`;
  }

  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
  return `${gateway}/${cid}`;
}
