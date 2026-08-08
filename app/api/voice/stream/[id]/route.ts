import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessPatient } from '@/lib/authorization';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  // Decode the CID in case it was URL-encoded by getIpfsAudioUrl
  const cidOrId = decodeURIComponent(params.id);

  try {
    const voice = await prisma.voiceConsultation.findFirst({
      where: {
        OR: [{ id: cidOrId }, { ipfsCid: cidOrId }],
      },
    });

    if (!voice) {
      return NextResponse.json({ error: 'Voice consultation not found' }, { status: 404 });
    }

    // Zero Trust Check: Can user access patient's data?
    const authCheck = await canAccessPatient(session, voice.patientId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // 1. Check for a local file whose name starts with the exact CID
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      const matchedFile = files.find((f) => f.startsWith(voice.ipfsCid));
      if (matchedFile) {
        const filePath = path.join(uploadDir, matchedFile);
        const fileBuffer = fs.readFileSync(filePath);
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': voice.mimeType || 'audio/webm',
            'Content-Length': fileBuffer.length.toString(),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // 2. Seeded / mock CIDs (QmVoiceVault prefix) have no real IPFS backing.
    //    Try serving any existing audio from uploads as a demo stand-in,
    //    then fall back to a synthesized silent WAV so the player shows a real duration.
    if (voice.ipfsCid.startsWith('QmVoiceVault')) {
      if (fs.existsSync(uploadDir)) {
        const allFiles = fs.readdirSync(uploadDir);
        const anyAudio = allFiles.find((f) =>
          f.endsWith('.webm') || f.endsWith('.wav') || f.endsWith('.mp3') || f.endsWith('.ogg')
        );
        if (anyAudio) {
          const filePath = path.join(uploadDir, anyAudio);
          const fileBuffer = fs.readFileSync(filePath);
          const ext = path.extname(anyAudio).toLowerCase();
          const mimeMap: Record<string, string> = {
            '.webm': 'audio/webm',
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
            '.wav': 'audio/wav',
          };
          const mimeType = mimeMap[ext] || 'audio/webm';
          return new Response(fileBuffer, {
            headers: {
              'Content-Type': mimeType,
              'Content-Length': fileBuffer.length.toString(),
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
      // Last resort: synthesized 3-second silent WAV so the player shows a non-zero duration
      const wavBuffer = generateSilentWav(3);
      return new Response(new Uint8Array(wavBuffer), {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': wavBuffer.length.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-store',
        },
      });
    }

    // 3. Real Pinata CID: fetch from the gateway with JWT authorization
    const pinataJwt = process.env.PINATA_JWT;
    const gatewayBase = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
    const gatewayUrl = `${gatewayBase}/${voice.ipfsCid}`;

    const fetchHeaders: Record<string, string> = {};
    if (pinataJwt && pinataJwt.trim() !== '') {
      fetchHeaders['Authorization'] = `Bearer ${pinataJwt.trim()}`;
    }

    const gatewayRes = await fetch(gatewayUrl, { headers: fetchHeaders });
    if (!gatewayRes.ok) {
      console.error(`IPFS gateway ${gatewayUrl} returned ${gatewayRes.status}`);
      return NextResponse.json(
        { error: `IPFS gateway returned ${gatewayRes.status}: ${gatewayRes.statusText}` },
        { status: 502 }
      );
    }

    const contentType = gatewayRes.headers.get('content-type') || voice.mimeType || 'audio/webm';
    const audioData = await gatewayRes.arrayBuffer();
    return new Response(audioData, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioData.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Voice Stream Error:', error);
    return NextResponse.json({ error: 'Failed to stream voice consultation' }, { status: 500 });
  }
}

/**
 * Generates a minimal valid PCM WAV buffer filled with silence.
 * Used ONLY as a last-resort fallback for seeded/mock CIDs that have no
 * actual audio source on disk or on IPFS.
 * Must NOT be used for real uploaded recordings.
 */
function generateSilentWav(durationSeconds: number): Buffer {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize); // zeros = silence

  // RIFF chunk descriptor
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');

  // fmt sub-chunk
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);                                        // sub-chunk size (PCM)
  buffer.writeUInt16LE(1, 20);                                         // AudioFormat = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  // sample bytes already 0 from Buffer.alloc

  return buffer;
}
