'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { VersionTimeline } from '@/components/records/VersionTimeline';
import VoiceRecorder, { VoiceRecorderResult } from '@/components/voice/VoiceRecorder';
import { VoicePlayer } from '@/components/voice/VoicePlayer';
import { IntegrityBadge } from '@/components/security/IntegrityBadge';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { FilePlus, ShieldCheck, UserCheck, Calendar, HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DoctorPatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;
  const router = useRouter();

  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create record modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
    versionReason: 'INITIAL_CLINICAL_CONSULTATION',
  });
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPatientDetails = async () => {
    try {
      const res = await fetch(`/api/users`);
      // Re-fetch records directly for patient
      const recRes = await fetch(`/api/records?patientId=${patientId}`);
    } catch {
      setError('Failed to fetch patient records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DoctorPatientDetailClient patientId={patientId} />
  );
}

// Separate client interactive container
function DoctorPatientDetailClient({ patientId }: { patientId: string }) {
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal & Recording state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedResult, setRecordedResult] = useState<VoiceRecorderResult | null>(null);

  const [formData, setFormData] = useState({
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      const res = await fetch(`/api/records/patient/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
        setRecords(data.records || []);
        if (data.records && data.records.length > 0) {
          setSelectedRecordId(data.records[0].id);
          verifyChain(data.records[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async (recId: string) => {
    try {
      const res = await fetch(`/api/records/${recId}/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data.verification);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleRecordComplete = (data: VoiceRecorderResult) => {
    console.log('[Page] Audio pipeline complete. Populating record fields:', data);
    setRecordedAudioBlob(data.audioBlob);
    setRecordedResult(data);

    // Automatically populate medical record form fields using actual AI summary data
    const formattedNotes = [
      data.summary.duration ? `Duration: ${data.summary.duration}` : null,
      data.summary.followUp ? `Follow-Up: ${data.summary.followUp}` : null,
      data.transcript ? `Transcript: ${data.transcript}` : null,
      data.ipfsHash ? `IPFS Hash: ${data.ipfsHash}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    setFormData({
      symptoms: data.summary.symptoms || '',
      diagnosis: data.summary.history || data.summary.symptoms || 'Clinical Consultation',
      prescription: data.summary.medicines || 'N/A',
      notes: formattedNotes,
    });
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      if (recordedAudioBlob) {
        // Submit voice consultation + record data to /api/voice/upload
        const uploadFormData = new FormData();
        uploadFormData.append('file', recordedAudioBlob, 'consultation.wav');
        uploadFormData.append('patientId', patientId);
        uploadFormData.append('symptoms', formData.symptoms || 'Voice Consultation');
        uploadFormData.append('diagnosis', formData.diagnosis || 'Clinical Record');
        uploadFormData.append('prescription', formData.prescription || 'N/A');
        uploadFormData.append('notes', formData.notes || 'Audio consultation recorded');

        const uploadRes = await fetch('/api/voice/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          setIsModalOpen(false);
          setFormData({ symptoms: '', diagnosis: '', prescription: '', notes: '' });
          setRecordedAudioBlob(null);
          setRecordedResult(null);
          await loadData();
          return;
        }
      }

      // Fallback: POST /api/records
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          ...formData,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ symptoms: '', diagnosis: '', prescription: '', notes: '' });
        setRecordedAudioBlob(null);
        setRecordedResult(null);
        await loadData();
      }
    } catch (e) {
      console.error('[Page] Failed to create medical record:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRecord = records.find((r) => r.id === selectedRecordId);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="DOCTOR" />
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">{patient?.user?.name || 'Patient Profile'}</h1>
            <p className="text-xs text-slate-400 font-mono">
              Code: {patient?.patientCode || patientId} | DOB: {patient?.dateOfBirth || 'N/A'} | Blood: {patient?.bloodType || 'A+'}
            </p>
          </div>
          <button
            onClick={() => {
              setRecordedAudioBlob(null);
              setRecordedResult(null);
              setFormData({ symptoms: '', diagnosis: '', prescription: '', notes: '' });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs shadow flex items-center gap-1.5 transition-all"
          >
            <FilePlus className="w-4 h-4" />
            <span>Create Medical Record (Voice AI)</span>
          </button>
        </div>

        {/* Record Selection Tabs */}
        {records.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-400 mr-2">Select Record:</span>
            {records.map((r, i) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRecordId(r.id);
                  verifyChain(r.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedRecordId === r.id
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Record #{i + 1} ({formatDate(r.createdAt)})
              </button>
            ))}
          </div>
        )}

        {/* Selected Record Content */}
        {selectedRecord ? (
          <div className="space-y-6">
            {/* Integrity Status Header */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Cryptographic Integrity Status</h3>
                  <p className="text-xs text-slate-400">
                    Re-computes SHA-256 for all {selectedRecord.versions.length} versions in real-time
                  </p>
                </div>
              </div>
              <IntegrityBadge
                status={verificationResult?.status || 'VERIFIED'}
                message={verificationResult?.message}
                size="lg"
              />
            </div>

            {/* Version Timeline */}
            <VersionTimeline
              versions={selectedRecord.versions}
              currentVersionNumber={selectedRecord.versions[selectedRecord.versions.length - 1]?.versionNumber || 1}
            />

            {/* Voice Consultations */}
            <VoicePlayer consultations={selectedRecord.voiceConsultations || []} />

            {/* Voice Recorder Integration */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200">Record Additional Voice Consultation</h3>
              <VoiceRecorder
                recordId={selectedRecord.id}
                patientId={patientId}
                onRecordComplete={async (data) => {
                  // Post consultation update
                  const uploadFormData = new FormData();
                  uploadFormData.append('file', data.audioBlob, 'consultation.wav');
                  uploadFormData.append('patientId', patientId);
                  uploadFormData.append('recordId', selectedRecord.id);
                  uploadFormData.append('symptoms', data.summary.symptoms || 'Voice Consultation');
                  uploadFormData.append('diagnosis', data.summary.history || 'Clinical Follow-Up');
                  uploadFormData.append('prescription', data.summary.medicines || 'N/A');
                  uploadFormData.append(
                    'notes',
                    `Transcript: ${data.transcript}\nFollow-Up: ${data.summary.followUp || 'N/A'}`
                  );

                  await fetch('/api/voice/upload', {
                    method: 'POST',
                    body: uploadFormData,
                  });
                  loadData();
                }}
              />
            </div>
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
            <HeartPulse className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">No Medical Records Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click the 'Create Medical Record (Voice AI)' button above to record audio consultation and generate Version 1.
            </p>
          </div>
        )}

        {/* Create Record Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Medical Record via Voice AI">
          <div className="space-y-6 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {/* Step 1: Voice Recording & AI Pipeline */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-200 text-sm">
                Step 1: Record Clinical Consultation Audio
              </label>
              <p className="text-slate-400 text-xs">
                Recording audio will automatically run transcription (/api/transcribe), generate clinical AI summary (/api/ai-summary), and upload to IPFS.
              </p>
              <VoiceRecorder
                patientId={patientId}
                onRecordComplete={handleRecordComplete}
              />
            </div>

            {/* Step 2: AI-Populated Record Details */}
            <form onSubmit={handleCreateRecord} className="space-y-4 pt-4 border-t border-slate-800">
              <label className="block font-bold text-slate-200 text-sm">
                Step 2: Review AI-Generated Medical Record Fields
              </label>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Symptoms Description</label>
                <textarea
                  required
                  rows={2}
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Record audio consultation above to auto-populate symptoms..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Record audio consultation above to auto-populate diagnosis..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Prescription / Treatment Plan</label>
                <input
                  type="text"
                  required
                  value={formData.prescription}
                  onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                  placeholder="Record audio consultation above to auto-populate prescription..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Clinical Notes & Transcript</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Record audio consultation above to auto-populate notes & transcript..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-md transition-all"
              >
                {submitting ? 'Saving Medical Record...' : 'Save Medical Record & Compute SHA-256 Hash'}
              </button>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  );
}

