"use client";

import React, { useState, useRef } from "react";

// Import uploadToIPFS dynamically or ensure it's properly exported from ipfs-client
const uploadToIPFS = async (blob: Blob): Promise<string> => {
  // Dynamically import the ipfs-client and support both named and default exports
  const mod: any = await import("@/lib/ipfs-client");
  const upload: ((b: Blob) => Promise<string>) | undefined = mod.uploadToIPFS ?? mod.default ?? mod.upload;
  if (!upload) throw new Error("uploadToIPFS not found in @/lib/ipfs-client");
  return upload(blob);
};

interface AISummary {
  symptoms: string;
  duration: string;
  history: string;
  medicines: string;
  followUp: string;
}

interface VoiceRecorderProps {
  onRecordComplete: (data: {
    audioBlob: Blob;
    ipfsHash: string;
    transcript: string;
    summary: AISummary;
  }) => void;
}

export default function VoiceRecorder({ onRecordComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [ipfsAudioUrl, setIpfsAudioUrl] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setProcessingStatus("Recording...");
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Unable to access microphone.");
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
      // 1. Transcribe Audio
      setProcessingStatus("Transcribing audio (Whisper)...");
      const formData = new FormData();
      formData.append("file", audioBlob, "consultation.wav");

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const transcribeData = await transcribeRes.json();
      if (!transcribeRes.ok) throw new Error(transcribeData.error || "Transcription failed");

      const rawTranscript = transcribeData.transcript;
      setTranscript(rawTranscript);

      // 2. Generate AI Summary
      setProcessingStatus("Generating clinical summary (AI)...");
      const summaryRes = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: rawTranscript }),
      });
      const summaryData: AISummary = await summaryRes.json();
      setSummary(summaryData);

      // 3. Upload Original Audio to IPFS (Ground Truth)
      setProcessingStatus("Uploading raw audio to IPFS...");
      const ipfsHash = await uploadToIPFS(audioBlob);
      setAudioUrl(URL.createObjectURL(audioBlob));

      // Replace with your own gateway if needed
      setIpfsAudioUrl(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);

      setProcessingStatus("Completed successfully.");

      // 4. Pass complete payload back to parent page
      onRecordComplete({
        audioBlob,
        ipfsHash,
        transcript: rawTranscript,
        summary: summaryData,
      });
    } catch (error) {
      console.error("Pipeline error:", error);
      setProcessingStatus("Error processing recording.");
    }
  };
  
  {audioUrl && (
  <div className="mt-4 p-3 border rounded bg-gray-50">
    <h4 className="font-semibold mb-2">Recorded Audio (Local)</h4>
    <audio controls className="w-full">
      <source src={audioUrl} type="audio/wav" />
      Your browser does not support audio.
    </audio>
  </div>
  )}

  {ipfsAudioUrl && (
  <div className="mt-4 p-3 border rounded bg-green-50">
    <h4 className="font-semibold mb-2">Audio Stored on IPFS</h4>

    <audio controls className="w-full">
      <source src={ipfsAudioUrl} />
    </audio>

    <p className="text-xs text-green-700 mt-2 break-all">
      {ipfsAudioUrl}
    </p>
  </div>
  )}

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-900 transition-colors"
          >
            Stop Recording
          </button>
        )}
        {processingStatus && (
          <span className="text-sm font-medium text-gray-600">{processingStatus}</span>
        )}
      </div>

      {transcript && (
        <div className="mt-4 p-3 bg-gray-50 border rounded text-sm text-gray-800">
          <h4 className="font-semibold text-gray-900 mb-1">Transcript</h4>
          <p>{transcript}</p>
        </div>
      )}

      {summary && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm space-y-1">
          <h4 className="font-semibold text-blue-900 mb-2">Clinical AI Summary</h4>
          <p><strong>Symptoms:</strong> {summary.symptoms}</p>
          <p><strong>Duration:</strong> {summary.duration}</p>
          <p><strong>History:</strong> {summary.history}</p>
          <p><strong>Medicines:</strong> {summary.medicines}</p>
          <p><strong>Follow-Up:</strong> {summary.followUp}</p>
        </div>
      )}
    </div>
  );
}