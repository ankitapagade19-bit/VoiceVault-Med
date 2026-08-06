'use client';

import React, { useState } from 'react';
import { Mic, Square, UploadCloud, ShieldCheck, Check } from 'lucide-react';

interface VoiceRecorderProps {
  recordId?: string;
  patientId: string;
  onUploadSuccess?: () => void;
}

export function VoiceRecorder({ recordId, patientId, onUploadSuccess }: VoiceRecorderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const startRecording = async () => {
    try {
      setErrorMessage(null);
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
      setErrorMessage('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Please record or choose an audio file first.');
      return;
    }

    if (!patientId) {
      setErrorMessage('Patient ID is missing.');
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId); // Crucial: explicitly attached
    if (recordId) formData.append('recordId', recordId);

    try {
      const res = await fetch('/api/voice/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadResult(data);
        setFile(null);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setErrorMessage(data.error || 'Failed to upload audio to Pinata IPFS.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving voice consultation.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Mic className="w-4 h-4 text-cyan-400" />
          Voice Consultation Recording
        </h3>
        <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 font-bold text-[10px] border border-cyan-800">
          Decentralized IPFS Pinning
        </span>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold flex items-center gap-1.5 shadow"
            >
              <Mic className="w-3.5 h-3.5" /> Start Recording
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-extrabold flex items-center gap-1.5 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 text-red-400" /> Stop Recording
            </button>
          )}

          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs text-slate-400"
          />
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !file}
          className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 font-extrabold flex items-center gap-1.5 shadow transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          {uploading ? 'Pinning to IPFS...' : 'Pin Audio to IPFS'}
        </button>
      </div>

      {file && (
        <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
          <Check className="w-4 h-4" /> Audio Attached: {file.name}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold">
          {errorMessage}
        </div>
      )}

      {uploadResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs space-y-2 text-emerald-300">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Audio Pinned to Pinata IPFS & Synced to DB
          </div>
          <div className="font-mono text-[11px] text-slate-300 break-all space-y-1">
            <div><strong className="font-sans text-slate-400">SHA-256 Hash:</strong> {uploadResult.audioHash}</div>
            <div><strong className="font-sans text-slate-400">IPFS CID:</strong> {uploadResult.ipfsCid}</div>
          </div>
        </div>
      )}
    </div>
  );
}