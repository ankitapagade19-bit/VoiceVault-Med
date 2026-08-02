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
  const cidOrId = params.id;

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

    // Check local fallback file
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
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
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // Redirect to external IPFS gateway if not found locally
    const gateway = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';
    return NextResponse.redirect(`${gateway}/${voice.ipfsCid}`);
  } catch (error) {
    console.error('Voice Stream Error:', error);
    return NextResponse.json({ error: 'Failed to stream voice consultation' }, { status: 500 });
  }
}
