"use client";

import { getIpfsAudioUrl } from '@/lib/ipfs-client';

import React, { useState, useRef } from "react";

// Existing IPFS upload implementation - kept intact and read-only
const uploadToIPFS = async (blob: Blob): Promise<string> => {
  try {
    const mod: any = await import("@/lib/ipfs-client");
    const upload: ((b: Blob) => Promise<string>) | undefined = mod.uploadToIPFS ?? mod.default ?? mod.upload;
    if (upload) return await upload(blob);
  } catch (e) {
    console.warn("Dynamic import of ipfs-client failed, using direct upload fallback:", e);
  }
  const formData = new FormData();
  formData.append("file", blob, "consultation.wav");
  const res = await fetch("/api/voice/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "IPFS Upload failed");
  return data.ipfsCid || data.ipfsHash || data.hash;
};

export interface AISummary {
  symptoms: string;
  duration: string;
  history: string;
  medicines: string;
  followUp: string;
}

export interface VoiceRecorderResult {
  audioBlob: Blob;
  ipfsHash: string;
  transcript: string;
  summary: AISummary;
}

export interface VoiceRecorderProps {
  onRecordComplete?: (data: VoiceRecorderResult) => void;
  onUploadSuccess?: () => void;
  patientId?: string;
  recordId?: string;
}

export default function VoiceRecorder({
  onRecordComplete,
  onUploadSuccess,
  patientId,
  recordId,
}: VoiceRecorderProps) {
  console.log("NEW VoiceRecorder Loaded");
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [ipfsAudioUrl, setIpfsAudioUrl] = useState("");
  const [ipfsHashVal, setIpfsHashVal] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setTranscript("");
      setSummary(null);
      setAudioUrl("");
      setIpfsAudioUrl("");
      setIpfsHashVal("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setProcessingStatus("Recording audio consultation...");
    } catch (err) {
      console.error("[VoiceRecorder] Microphone access denied:", err);
      alert("Unable to access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      await processAudioPipeline(audioBlob);
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const processAudioPipeline = async (audioBlob: Blob) => {
    try {
      // 1. Transcribe Audio via /api/transcribe
      setProcessingStatus("Transcribing audio consultation (/api/transcribe)...");
      const formData = new FormData();
      formData.append("file", audioBlob, "consultation.wav");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const transcribeData = await transcribeRes.json();
      if (!transcribeRes.ok) {
        console.error("[VoiceRecorder Error] /api/transcribe failed:", transcribeData);
        throw new Error(transcribeData.error || "Transcription failed at /api/transcribe");
      }

      const rawTranscript = transcribeData.transcript;
      if (!rawTranscript) {
        throw new Error("No transcript text returned from /api/transcribe");
      }
      setTranscript(rawTranscript);
      console.log("[VoiceRecorder] Transcript received successfully:", rawTranscript);

      // 2. Generate Clinical AI Summary via /api/ai-summary
      setProcessingStatus("Generating clinical summary (/api/ai-summary)...");
      const summaryRes = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: rawTranscript }),
      });

      const summaryData: AISummary = await summaryRes.json();
      if (!summaryRes.ok) {
        console.error("[VoiceRecorder Error] /api/ai-summary failed:", summaryData);
        throw new Error("Clinical AI Summary failed at /api/ai-summary");
      }

      setSummary(summaryData);
      console.log("[VoiceRecorder] AI summary received successfully:", summaryData);

      // 3. Upload Original Audio to IPFS using existing implementation
      setProcessingStatus("Uploading original audio to IPFS...");
      const localUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(localUrl);

      let ipfsHash = "";
      try {
        ipfsHash = await uploadToIPFS(audioBlob);
        setIpfsHashVal(ipfsHash);
        // Use the authenticated streaming proxy (same as VoicePlayer) to avoid gateway auth issues
        setIpfsAudioUrl(getIpfsAudioUrl(ipfsHash));
      } catch (ipfsError) {
        console.warn("[VoiceRecorder] IPFS Upload warning:", ipfsError);
      }

      setProcessingStatus("Processing complete.");

      // 4. Pass complete payload back to parent callback
      const result: VoiceRecorderResult = {
        audioBlob,
        ipfsHash,
        transcript: rawTranscript,
        summary: summaryData,
      };

      if (onRecordComplete) {
        onRecordComplete(result);
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error("[VoiceRecorder Pipeline Error]", error?.message || error);
      setProcessingStatus(`Error: ${error?.message || "Audio processing pipeline failed"}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm text-sm"
          >
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-900 transition-colors shadow-sm text-sm animate-pulse"
          >
            Stop Recording
          </button>
        )}
        {processingStatus && (
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            {processingStatus}
          </span>
        )}
      </div>

      {audioUrl && (
        <div className="mt-4 p-3 border rounded bg-slate-50 space-y-2">
          <h4 className="font-semibold text-xs text-slate-800">Recorded Audio Player (Local Preview)</h4>
          <audio controls className="w-full h-9">
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      {ipfsAudioUrl && (
        <div className="mt-4 p-3 border rounded bg-emerald-50 border-emerald-200 space-y-2">
          <h4 className="font-semibold text-xs text-emerald-900">Audio Stored on IPFS</h4>
          <audio controls className="w-full h-9">
            <source src={ipfsAudioUrl} />
          </audio>
          {ipfsHashVal && (
            <p className="text-xs text-emerald-700 font-mono break-all">
              <strong>IPFS Hash (CID):</strong> {ipfsHashVal}
            </p>
          )}
        </div>
      )}

      {transcript && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 space-y-1">
          <h4 className="font-semibold text-slate-900">Consultation Transcript</h4>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{transcript}</p>
        </div>
      )}

      {summary && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-1.5 text-slate-800">
          <h4 className="font-semibold text-blue-900">Clinical AI Summary</h4>
          <p><strong>Symptoms:</strong> {summary.symptoms || "N/A"}</p>
          <p><strong>Duration:</strong> {summary.duration || "N/A"}</p>
          <p><strong>History:</strong> {summary.history || "N/A"}</p>
          <p><strong>Medicines:</strong> {summary.medicines || "N/A"}</p>
          <p><strong>Follow-Up:</strong> {summary.followUp || "N/A"}</p>
        </div>
      )}
    </div>
  );
}

export { VoiceRecorder };