'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, RotateCcw, UploadCloud, CheckCircle2, AlertCircle, FileAudio } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface VoiceRecorderProps {
  recordId: string;
  patientId: string;
  onUploadSuccess?: (consultation: any) => void;
}

export function VoiceRecorder({ recordId, patientId, onUploadSuccess }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string; cid?: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setUploadStatus(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setSelectedFile(null);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      setUploadStatus({ type: 'error', message: 'Could not access browser microphone. Please check permissions.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setSelectedFile(null);
    setRecordingTime(0);
    setUploadStatus(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAudioBlob(null);
      setAudioUrl(URL.createObjectURL(file));
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    const fileToUpload = selectedFile || (audioBlob ? new File([audioBlob], `consultation_${Date.now()}.webm`, { type: 'audio/webm' }) : null);

    if (!fileToUpload) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('recordId', recordId);
      if (recordingTime > 0) {
        formData.append('duration', recordingTime.toString());
      }

      const res = await fetch('/api/voice/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload audio to IPFS');
      }

      setUploadStatus({
        type: 'success',
        message: `Audio pinned to IPFS successfully (${data.provider === 'pinata' ? 'Pinata IPFS Node' : 'Local Storage Adapter'})!`,
        cid: data.voiceConsultation.ipfsCid,
      });

      if (onUploadSuccess) {
        onUploadSuccess(data.voiceConsultation);
      }
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Voice Consultation Recording</h3>
        </div>
        <Badge variant="purple">Decentralized IPFS Pinning</Badge>
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        {isRecording ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 animate-ping absolute inset-0" />
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md relative z-10 transition-all"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            </div>
            <span className="text-xl font-mono font-bold text-red-600 animate-pulse">
              Recording {formatTimer(recordingTime)}
            </span>
            <span className="text-xs text-slate-500">Click button to stop microphone recording</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            {!audioUrl ? (
              <>
                <button
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all hover:scale-105"
                >
                  <Mic className="w-7 h-7" />
                </button>
                <span className="text-xs font-semibold text-slate-700">Click to Start Voice Recording</span>
              </>
            ) : (
              <div className="w-full space-y-4 text-center">
                <audio controls src={audioUrl} className="w-full max-w-md mx-auto rounded-lg h-10" />
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={resetRecording}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-record / Clear
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {isUploading ? 'Pinning to IPFS...' : 'Pin Audio to IPFS'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alternative Audio File Picker */}
        {!isRecording && !audioUrl && (
          <div className="pt-4 border-t border-slate-200 w-full text-center">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs">
              <FileAudio className="w-4 h-4 text-blue-600" />
              <span>Select Audio File (.webm, .wav, .mp3, .m4a)</span>
              <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Upload Feedback Status */}
      {uploadStatus && (
        <div
          className={`p-4 rounded-xl border ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <p className="font-bold">{uploadStatus.message}</p>
              {uploadStatus.cid && (
                <p className="font-mono text-xs text-emerald-700">
                  <strong>IPFS CID:</strong> {uploadStatus.cid}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
