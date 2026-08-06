import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'DOCTOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Doctor access required.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    let patientId = formData.get('patientId') as string;
    const recordId = formData.get('recordId') as string;

    const diagnosis = (formData.get('diagnosis') as string) || 'Voice Consultation Record';
    const prescription = (formData.get('prescription') as string) || 'N/A';
    const symptoms = (formData.get('symptoms') as string) || 'Voice Consultation';
    const notes = (formData.get('notes') as string) || 'Audio consultation recorded and pinned to IPFS.';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
    }

    // Fallback: If patientId isn't sent directly, look it up from recordId
    if (!patientId && recordId) {
      const existingRecord = await prisma.medicalRecord.findUnique({
        where: { id: recordId },
        select: { patientId: true },
      });
      if (existingRecord) {
        patientId = existingRecord.patientId;
      }
    }

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required.' }, { status: 400 });
    }

    // 1. Generate SHA-256 Hash of raw audio buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 2. Upload File to Pinata IPFS
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!pinataRes.ok) {
      return NextResponse.json({ error: 'Failed to upload audio to Pinata IPFS.' }, { status: 502 });
    }

    const pinataData = await pinataRes.json();
    const ipfsCid = pinataData.IpfsHash;

    // 3. Obtain target MedicalRecord ID
    let targetRecordId = recordId;
    if (!targetRecordId) {
      const record = await prisma.medicalRecord.create({
        data: {
          patientId,
          originatingDoctorId: session.doctorProfileId || session.id,
        },
      });
      targetRecordId = record.id;
    }

    // 4. Create child MedicalRecordVersion with IPFS proof
    const version = await prisma.medicalRecordVersion.create({
      data: {
        versionNumber: 1,
        diagnosis,
        prescription,
        symptoms,
        notes,
        createdBy: { connect: { id: session.id } },
        currentHash: audioHash,
        record: {
          connect: { id: targetRecordId },
        },
      },
    });

    // 5. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'VOICE_RECORD_PINNED_IPFS',
        resourceType: 'MEDICAL_RECORD',
        resourceId: targetRecordId,
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      recordId: targetRecordId,
      versionId: version.id,
      audioHash,
      ipfsCid,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}