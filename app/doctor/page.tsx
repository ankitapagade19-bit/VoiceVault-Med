'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Mic, Square, UploadCloud, ShieldCheck, Check, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function DoctorVoiceUploadPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/patients', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.patients) setPatients(data.patients);
      })
      .catch(console.error);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const recordedFile = new File([blob], `consultation-${Date.now()}.webm`, { type: 'audio/webm' });
        setFile(recordedFile);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedPatient) {
      alert('Please select a patient and attach or record audio.');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', selectedPatient);
    formData.append('diagnosis', diagnosis);
    formData.append('prescription', prescription);

    try {
      const res = await fetch('/api/voice/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadResult(data);
        setFile(null);
        setDiagnosis('');
        setPrescription('');
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err) {
      alert('Network error during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="DOCTOR" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Voice Consultation & IPFS Pinning</h1>
          <p className="text-xs text-slate-500">
            Record physician audio notes, generate cryptographic SHA-256 proof, and store on Pinata IPFS.
          </p>
        </div>

        <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Patient</label>
            <select
              required
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.patientProfile?.id || p.id}>
                  {p.name || p.user?.name} ({p.email || p.user?.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Clinical Diagnosis Notes</label>
              <textarea
                rows={3}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis details..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Prescription Details</label>
              <textarea
                rows={3}
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Enter rx instructions..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Audio Input Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="font-bold text-slate-800 block">Consultation Audio Input</span>

            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-sm"
                >
                  <Mic className="w-4 h-4" /> Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-2 animate-pulse"
                >
                  <Square className="w-4 h-4 text-red-500" /> Recording... (Click to Stop)
                </button>
              )}

              <span className="text-slate-400 font-bold">OR</span>

              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-600"
              />
            </div>

            {file && (
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Audio Attached: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            {uploading ? 'Pinning to Pinata IPFS & Saving to Neon DB...' : 'Upload & Pin Consultation'}
          </button>
        </form>

        {/* Upload Success Proof Panel */}
        {uploadResult && (
          <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              Successfully Pinned to Pinata IPFS & Synced to Neon PostgreSQL
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-sans font-bold">SHA-256 Audio Hash: </span>
                <span className="text-slate-900 break-all">{uploadResult.audioHash}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans font-bold">IPFS CID: </span>
                <span className="text-blue-700 break-all">{uploadResult.ipfsCid}</span>
              </div>
              <div>
                <a
                  href={uploadResult.gatewayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-sans font-bold flex items-center gap-1 mt-1"
                >
                  Listen on Pinata IPFS Gateway <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}