import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canModifyClinicalRecord } from '@/lib/authorization';
import { uploadAudioToIpfs } from '@/lib/ipfs';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'DOCTOR' || !session.doctorProfileId) {
    return NextResponse.json({ error: 'Only authorized doctors can upload voice consultations' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const recordId = formData.get('recordId') as string | null;
    const durationStr = formData.get('duration') as string | null;

    if (!file || !recordId) {
      return NextResponse.json({ error: 'Audio file and recordId are required' }, { status: 400 });
    }

    // MIME type check
    const allowedMimeTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/m4a'];
    if (!allowedMimeTypes.includes(file.type) && !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'Invalid audio format. Please upload a valid audio file.' }, { status: 400 });
    }

    // Size limit (max 25MB for MVP)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file size exceeds 25MB limit' }, { status: 400 });
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      select: { patientId: true },
    });

    if (!record) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 });
    }

    // Zero Trust authorization check
    const authCheck = await canModifyClinicalRecord(session, record.patientId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to IPFS / Fallback Adapter
    const ipfsResult = await uploadAudioToIpfs(buffer, file.name || 'consultation.webm', file.type);

    const duration = durationStr ? parseInt(durationStr, 10) : undefined;

    // Save metadata in database
    const voiceConsultation = await prisma.voiceConsultation.create({
      data: {
        recordId,
        patientId: record.patientId,
        doctorId: session.doctorProfileId,
        ipfsCid: ipfsResult.cid,
        fileName: file.name || 'voice_consultation.webm',
        mimeType: file.type || 'audio/webm',
        fileSize: ipfsResult.fileSize,
        duration: duration || null,
        fileHash: ipfsResult.fileHash,
      },
    });

    await writeAuditLog({
      userId: session.id,
      action: 'VOICE_UPLOADED',
      resourceType: 'VOICE_CONSULTATION',
      resourceId: voiceConsultation.id,
      patientId: record.patientId,
      metadata: JSON.stringify({
        ipfsCid: ipfsResult.cid,
        fileHash: ipfsResult.fileHash,
        fileSize: ipfsResult.fileSize,
        provider: ipfsResult.provider,
      }),
      request,
    });

    const patient = await prisma.patientProfile.findUnique({
      where: { id: record.patientId },
      select: { userId: true },
    });

    if (patient) {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        userId: patient.userId,
        type: 'VOICE_UPLOADED',
        title: 'Voice Consultation Available',
        message: `Dr. ${session.name} uploaded a voice consultation (IPFS: ${ipfsResult.cid.substring(0, 12)}...).`,
        resourceType: 'VOICE_CONSULTATION',
        resourceId: voiceConsultation.id,
      });
    }

    return NextResponse.json({
      success: true,
      voiceConsultation,
      provider: ipfsResult.provider,
    });
  } catch (error: any) {
    console.error('Voice Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process voice consultation upload' }, { status: 500 });
  }
}
