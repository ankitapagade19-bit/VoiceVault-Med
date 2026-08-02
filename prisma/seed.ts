import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function canonicalize(data: any): string {
  const canonicalObject = {
    createdById: data.createdById?.trim() || '',
    diagnosis: data.diagnosis?.trim() || '',
    notes: data.notes?.trim() || '',
    previousHash: data.previousHash || null,
    prescription: data.prescription?.trim() || '',
    recordId: data.recordId?.trim() || '',
    symptoms: data.symptoms?.trim() || '',
    versionNumber: Number(data.versionNumber),
    versionReason: data.versionReason?.trim() || '',
  };
  return JSON.stringify(canonicalObject, Object.keys(canonicalObject).sort());
}

function hashRecord(data: any): string {
  return crypto.createHash('sha256').update(canonicalize(data), 'utf8').digest('hex');
}

async function main() {
  console.log('🌱 Starting VoiceVault Med Database Seeding...');

  // Clean existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.voiceConsultation.deleteMany();
  await prisma.medicalRecordVersion.deleteMany();
  await prisma.correctionRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.doctorPatientAssignment.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany();

  const commonPasswordHash = await bcrypt.hash('Password123!', 10);

  // 0. System Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'System Super Admin',
      email: 'admin@voicevault.med',
      passwordHash: commonPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 1. Staff User
  const staff = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Head Administrator)',
      email: 'staff@voicevault.med',
      passwordHash: commonPasswordHash,
      role: 'STAFF',
      status: 'ACTIVE',
    },
  });

  // 2. Doctor Users & Profiles
  const doctorUser1 = await prisma.user.create({
    data: {
      name: 'Dr. Alexander Fleming',
      email: 'dr.smith@voicevault.med',
      passwordHash: commonPasswordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      doctorProfile: {
        create: {
          doctorCode: 'DOC-101',
          specialization: 'Cardiology & General Medicine',
        },
      },
    },
    include: { doctorProfile: true },
  });

  const doctorUser2 = await prisma.user.create({
    data: {
      name: 'Dr. Meredith Grey',
      email: 'dr.jones@voicevault.med',
      passwordHash: commonPasswordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
      doctorProfile: {
        create: {
          doctorCode: 'DOC-102',
          specialization: 'Neurology & Internal Medicine',
        },
      },
    },
    include: { doctorProfile: true },
  });

  // 3. Patient Users & Profiles
  const patientUser1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@patient.med',
      passwordHash: commonPasswordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patientProfile: {
        create: {
          patientCode: 'PAT-201',
          dateOfBirth: '1985-04-12',
          phone: '+1 (555) 234-5678',
          bloodType: 'A+',
          emergencyContact: 'Mary Doe (+1 555-999-0000)',
        },
      },
    },
    include: { patientProfile: true },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane.smith@patient.med',
      passwordHash: commonPasswordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patientProfile: {
        create: {
          patientCode: 'PAT-202',
          dateOfBirth: '1992-09-28',
          phone: '+1 (555) 876-5432',
          bloodType: 'O-',
          emergencyContact: 'Robert Smith (+1 555-888-1111)',
        },
      },
    },
    include: { patientProfile: true },
  });

  const patientUser3 = await prisma.user.create({
    data: {
      name: 'Robert Johnson',
      email: 'robert.johnson@patient.med',
      passwordHash: commonPasswordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
      patientProfile: {
        create: {
          patientCode: 'PAT-203',
          dateOfBirth: '1978-11-05',
          phone: '+1 (555) 345-6789',
          bloodType: 'B+',
          emergencyContact: 'Alice Johnson (+1 555-777-2222)',
        },
      },
    },
    include: { patientProfile: true },
  });

  // 4. Doctor-Patient Assignments
  await prisma.doctorPatientAssignment.createMany({
    data: [
      {
        doctorId: doctorUser1.doctorProfile!.id,
        patientId: patientUser1.patientProfile!.id,
        active: true,
      },
      {
        doctorId: doctorUser1.doctorProfile!.id,
        patientId: patientUser2.patientProfile!.id,
        active: true,
      },
      {
        doctorId: doctorUser2.doctorProfile!.id,
        patientId: patientUser3.patientProfile!.id,
        active: true,
      },
    ],
  });

  // 5. Medical Record #1 with Multi-Version Cryptographic Hash Chain for John Doe
  const record1 = await prisma.medicalRecord.create({
    data: {
      patientId: patientUser1.patientProfile!.id,
      originatingDoctorId: doctorUser1.doctorProfile!.id,
    },
  });

  // Version 1 - Genesis Version
  const v1Data = {
    recordId: record1.id,
    versionNumber: 1,
    symptoms: 'Occasional dizziness, elevated BP (145/95 mmHg), mild morning headaches.',
    diagnosis: 'Essential Stage 1 Hypertension',
    prescription: 'Lisinopril 10mg orally once daily in the morning.',
    notes: 'Patient advised low-sodium diet and daily cardiovascular exercise.',
    versionReason: 'INITIAL_CLINICAL_CONSULTATION',
    createdById: doctorUser1.id,
    previousHash: null,
  };
  const v1Hash = hashRecord(v1Data);

  const version1 = await prisma.medicalRecordVersion.create({
    data: {
      ...v1Data,
      currentHash: v1Hash,
    },
  });

  // Version 2 - Approved Correction Version linked to Version 1 Hash
  const v2Data = {
    recordId: record1.id,
    versionNumber: 2,
    symptoms: 'BP reduced to 132/84 mmHg. Headaches resolved. Patient reported mild dry cough.',
    diagnosis: 'Essential Stage 1 Hypertension (Adjusted Dosage)',
    prescription: 'Lisinopril 20mg orally once daily in the morning.',
    notes: 'Dosage increased following patient feedback and 2-week ambulatory blood pressure monitoring.',
    versionReason: 'PATIENT_CORRECTION_APPROVED: Dosage adjustment following patient consultation review',
    createdById: doctorUser1.id,
    previousHash: v1Hash,
  };
  const v2Hash = hashRecord(v2Data);

  const version2 = await prisma.medicalRecordVersion.create({
    data: {
      ...v2Data,
      currentHash: v2Hash,
    },
  });

  // Approved Correction Request backing Version 2
  await prisma.correctionRequest.create({
    data: {
      recordId: record1.id,
      patientId: patientUser1.patientProfile!.id,
      requestedById: patientUser1.id,
      reason: 'Dosage was updated during follow-up phone call to 20mg but record still displayed 10mg.',
      requestedCorrection: 'Please update prescription dosage to Lisinopril 20mg once daily.',
      status: 'APPROVED',
      reviewedById: doctorUser1.id,
      reviewNotes: 'Verified with clinical follow-up chart. Updated prescription dosage to 20mg.',
      reviewedAt: new Date(),
    },
  });

  // 6. Medical Record #2 for Jane Smith with Pending Correction Request
  const record2 = await prisma.medicalRecord.create({
    data: {
      patientId: patientUser2.patientProfile!.id,
      originatingDoctorId: doctorUser1.doctorProfile!.id,
    },
  });

  const rec2V1Data = {
    recordId: record2.id,
    versionNumber: 1,
    symptoms: 'Persistent dry cough, mild fever (38.1°C), fatigue for 4 days.',
    diagnosis: 'Acute Bronchitis',
    prescription: 'Amoxicillin 500mg orally 3 times daily for 7 days. Rest & hydration.',
    notes: 'No known penicillin allergies reported during examination.',
    versionReason: 'INITIAL_CLINICAL_CONSULTATION',
    createdById: doctorUser1.id,
    previousHash: null,
  };
  const rec2V1Hash = hashRecord(rec2V1Data);

  await prisma.medicalRecordVersion.create({
    data: {
      ...rec2V1Data,
      currentHash: rec2V1Hash,
    },
  });

  // Pending Correction Request for Record 2
  await prisma.correctionRequest.create({
    data: {
      recordId: record2.id,
      patientId: patientUser2.patientProfile!.id,
      requestedById: patientUser2.id,
      reason: 'I am allergic to Penicillin. The notes say no known allergies.',
      requestedCorrection: 'Please update allergy notes to document Penicillin allergy and adjust antibiotic to Azithromycin.',
      status: 'PENDING',
    },
  });

  // 7. Voice Consultation Entry for John Doe
  await prisma.voiceConsultation.create({
    data: {
      recordId: record1.id,
      patientId: patientUser1.patientProfile!.id,
      doctorId: doctorUser1.doctorProfile!.id,
      ipfsCid: 'QmVoiceVaultSeedConsultationJohnDoe2026',
      fileName: 'cardiology_consultation_john_doe.mp3',
      mimeType: 'audio/mp3',
      fileSize: 1048576, // 1MB
      duration: 145, // 2 mins 25 sec
      fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  });

  // 8. Sample Appointments
  await prisma.appointment.createMany({
    data: [
      {
        patientId: patientUser1.patientProfile!.id,
        doctorId: doctorUser1.doctorProfile!.id,
        date: new Date(Date.now() + 86400000), // tomorrow
        timeSlot: '09:30 AM',
        reason: 'Follow-up BP Check & Prescription Review',
        status: 'SCHEDULED',
        queueNumber: 1,
      },
      {
        patientId: patientUser2.patientProfile!.id,
        doctorId: doctorUser1.doctorProfile!.id,
        date: new Date(Date.now() + 86400000 * 2), // in 2 days
        timeSlot: '11:00 AM',
        reason: 'Allergy & Antibiotic Consultation',
        status: 'SCHEDULED',
        queueNumber: 2,
      },
      {
        patientId: patientUser3.patientProfile!.id,
        doctorId: doctorUser2.doctorProfile!.id,
        date: new Date(Date.now() - 86400000), // yesterday
        timeSlot: '02:00 PM',
        reason: 'Neurological Examination',
        status: 'COMPLETED',
        notes: 'Patient responded well to initial exam. Follow up in 3 months.',
      },
    ],
  });

  // 8. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: staff.id,
        action: 'ADMIN_ACTION',
        resourceType: 'SYSTEM_SEED',
        metadata: JSON.stringify({ message: 'Initial system seed completed successfully' }),
      },
      {
        userId: doctorUser1.id,
        action: 'RECORD_CREATED',
        resourceType: 'MEDICAL_RECORD',
        resourceId: record1.id,
        patientId: patientUser1.patientProfile!.id,
        metadata: JSON.stringify({ versionNumber: 1, currentHash: v1Hash }),
      },
      {
        userId: patientUser1.id,
        action: 'CORRECTION_REQUEST_CREATED',
        resourceType: 'CORRECTION_REQUEST',
        resourceId: record1.id,
        patientId: patientUser1.patientProfile!.id,
      },
      {
        userId: doctorUser1.id,
        action: 'CORRECTION_REQUEST_APPROVED',
        resourceType: 'CORRECTION_REQUEST',
        resourceId: record1.id,
        patientId: patientUser1.patientProfile!.id,
        metadata: JSON.stringify({ versionCreated: 2, currentHash: v2Hash }),
      },
      {
        userId: doctorUser1.id,
        action: 'INTEGRITY_VERIFICATION_RUN',
        resourceType: 'RECORD_CHAIN',
        resourceId: record1.id,
        patientId: patientUser1.patientProfile!.id,
        metadata: JSON.stringify({ status: 'VERIFIED', versionCount: 2 }),
      },
    ],
  });

  console.log('✅ VoiceVault Med Seed Completed Successfully!');
  console.log('\n--- DEMO ACCOUNTS READY FOR HACKATHON ---');
  console.log('👑 Staff Admin:  staff@voicevault.med       | Password: Password123!');
  console.log('🩺 Doctor 1:     dr.smith@voicevault.med    | Password: Password123!');
  console.log('🩺 Doctor 2:     dr.jones@voicevault.med    | Password: Password123!');
  console.log('👤 Patient 1:    john.doe@patient.med       | Password: Password123! (Has Version 1 & 2)');
  console.log('👤 Patient 2:    jane.smith@patient.med     | Password: Password123! (Has Pending Request)');
  console.log('👤 Patient 3:    robert.johnson@patient.med | Password: Password123!');
  console.log('-----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
