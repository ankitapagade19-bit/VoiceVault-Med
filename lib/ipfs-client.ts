/**
 * Client-safe IPFS URL resolver.
 * Routes ALL CIDs through our authenticated /api/voice/stream proxy endpoint.
 * This avoids CORS errors, 403s from dedicated gateways, and invalid URLs
 * from seeded/mock CIDs that have no real IPFS backing.
 */
export function getIpfsAudioUrl(cid: string): string {
  if (!cid) return '';
  // Always route through the server-side authenticated streaming proxy.
  // Never expose raw Pinata gateway URLs to the browser to avoid auth issues.
  return `/api/voice/stream/${encodeURIComponent(cid)}`;
}
