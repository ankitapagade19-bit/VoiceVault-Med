import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role: z.enum(['STAFF', 'DOCTOR', 'PATIENT']),
  doctorCode: z.string().optional(),
  specialization: z.string().optional(),
  patientCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  bloodType: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const assignDoctorPatientSchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  patientId: z.string().min(1, 'Patient is required'),
});

export const createMedicalRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  symptoms: z.string().min(3, 'Symptoms description is required'),
  diagnosis: z.string().min(3, 'Diagnosis is required'),
  prescription: z.string().min(3, 'Prescription details required'),
  notes: z.string().default('Initial clinical notes'),
  versionReason: z.string().default('INITIAL_RECORD'),
});

export const createCorrectionRequestSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  reason: z.string().min(5, 'Please explain why a correction is needed'),
  requestedCorrection: z.string().min(5, 'Please provide the corrected information'),
});

export const reviewCorrectionSchema = z.object({
  correctionRequestId: z.string().min(1, 'Correction request ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  reviewNotes: z.string().optional(),
  // For approval, doctor can supply corrected values or use patient's requested info
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

export const voiceUploadSchema = z.object({
  recordId: z.string().min(1, 'Medical Record ID is required'),
  duration: z.number().optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(12, 'Password must be at least 12 characters'),
});

export const passwordResetSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  temporaryPassword: z.string().min(12, 'Temporary password must be at least 12 characters'),
});
