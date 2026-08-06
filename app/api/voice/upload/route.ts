import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  console.log('---> Upload endpoint hit');
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

    console.log('---> Generating SHA-256 Hash...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Prepare Form Data for Pinata API
    const pinataFormData = new FormData();
    const fileBlob = new Blob([buffer], { type: file.type || 'audio/webm' });
    pinataFormData.append('file', fileBlob, file.name || `consultation-${Date.now()}.webm`);

    const headers: Record<string, string> = {};
    const pinataJwt = process.env.PINATA_JWT;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (pinataJwt && pinataJwt.trim() !== '') {
      headers['Authorization'] = `Bearer ${pinataJwt.trim()}`;
    } else if (pinataApiKey && pinataSecretKey) {
      headers['pinata_api_key'] = pinataApiKey.trim();
      headers['pinata_secret_api_key'] = pinataSecretKey.trim();
    } else {
      console.error('Missing Pinata keys in .env');
      return NextResponse.json(
        { error: 'Pinata API credentials missing in .env configuration.' },
        { status: 500 }
      );
    }

    console.log('---> Sending request to Pinata IPFS...');
    
    // Add 10-second timeout controller so fetch never hangs the server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: pinataFormData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!pinataRes.ok) {
      const errorText = await pinataRes.text();
      console.error('Pinata Rejected Upload:', pinataRes.status, errorText);
      return NextResponse.json(
        { error: `Pinata IPFS Error (${pinataRes.status}): ${errorText || pinataRes.statusText}` },
        { status: 502 }
      );
    }

    const pinataJson = await pinataRes.json();
    const ipfsCid = pinataJson?.IpfsHash || pinataJson?.ipfsHash || pinataJson?.hash;
    console.log('---> Pinata Success! CID:', ipfsCid);

    // Save to Database
    let targetRecordId = recordId;
    if (!targetRecordId) {
      const newRecord = await prisma.medicalRecord.create({
        data: {
          patientId,
          originatingDoctorId: session.doctorProfileId || session.id,
        },
      });
      targetRecordId = newRecord.id;
    }

    const version = await prisma.medicalRecordVersion.create({
      data: {
        versionNumber: 1,
        diagnosis,
        prescription,
        symptoms,
        notes,
        currentHash: audioHash,
        createdBy: {
          connect: { id: session.id },
        },
        record: {
          connect: { id: targetRecordId },
        },
      },
    });
    
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
    console.error('Upload Route Error:', error);
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Pinata upload timed out (network issue).' }, { status: 504 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}