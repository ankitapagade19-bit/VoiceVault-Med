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

    // 2. Prepare Pinata Request Body
    const pinataFormData = new FormData();
    const fileBlob = new Blob([buffer], { type: file.type || 'audio/webm' });
    pinataFormData.append('file', fileBlob, file.name || `consultation-${Date.now()}.webm`);

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      console.error('PINATA_JWT environment variable is missing in .env');
      return NextResponse.json({ error: 'Pinata configuration error on server.' }, { status: 500 });
    }

    // 3. Upload File to Pinata IPFS
    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt.trim()}`,
      },
      body: pinataFormData,
    });

    if (!pinataRes.ok) {
      const pinataErrorText = await pinataRes.text();
      console.error('Pinata API Error Response:', pinataErrorText);
      return NextResponse.json(
        { error: `Pinata API Error: ${pinataRes.statusText}` },
        { status: 502 }
      );
    }

    const pinataData = await pinataRes.json();
    const ipfsCid = pinataData.IpfsHash;

    // 4. Obtain target MedicalRecord ID
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

    // 5. Create child MedicalRecordVersion with IPFS proof
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

    // 6. Audit Log
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
    console.error('Upload Endpoint Catch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}