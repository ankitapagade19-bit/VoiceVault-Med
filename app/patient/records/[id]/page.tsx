'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { VersionTimeline } from '@/components/records/VersionTimeline';
import { VoicePlayer } from '@/components/voice/VoicePlayer';
import { IntegrityBadge } from '@/components/security/IntegrityBadge';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { FileEdit, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PatientRecordDetailPage() {
  const params = useParams();
  const recordId = params.id as string;

  const [record, setRecord] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Correction request modal
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [requestedCorrection, setRequestedCorrection] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadRecordData = async () => {
    try {
      const res = await fetch(`/api/records`);
      if (res.ok) {
        const data = await res.json();
        const matched = data.records.find((r: any) => r.id === recordId);
        setRecord(matched);
        if (matched) verifyRecordChain(matched.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const verifyRecordChain = async (id: string) => {
    try {
      const res = await fetch(`/api/records/${id}/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerification(data.verification);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecordData();
  }, [recordId]);

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          reason,
          requestedCorrection,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit correction request');

      setFeedback({
        type: 'success',
        message: 'Correction request submitted to practitioner! Status: PENDING review.',
      });
      setIsCorrectionModalOpen(false);
      setReason('');
      setRequestedCorrection('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const versions = record?.versions || [];
  const latestVersion = versions[0];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="PATIENT" />
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">Medical Record #{recordId.substring(0, 10)}...</h1>
            <p className="text-xs text-slate-400">
              Originating Doctor: Dr. {record?.originatingDoctor?.user?.name || 'Practitioner'} | Recorded:{' '}
              {formatDate(record?.createdAt)}
            </p>
          </div>
          <button
            onClick={() => setIsCorrectionModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow flex items-center gap-1.5 transition-all"
          >
            <FileEdit className="w-4 h-4" />
            <span>Request Record Correction</span>
          </button>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            } text-xs flex items-center gap-2`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Integrity Status Badge */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Cryptographic Integrity Status</h3>
              <p className="text-xs text-slate-400">
                Re-computed SHA-256 validation across all {versions.length} version snapshots
              </p>
            </div>
          </div>
          <IntegrityBadge status={verification?.status || 'VERIFIED'} size="lg" />
        </div>

        {/* Complete Version History */}
        {versions.length > 0 && (
          <VersionTimeline versions={versions} currentVersionNumber={latestVersion?.versionNumber || 1} />
        )}

        {/* Voice Consultations */}
        {record?.voiceConsultations && <VoicePlayer consultations={record.voiceConsultations} />}

        {/* Request Correction Modal */}
        <Modal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          title="Submit Patient Correction Request"
        >
          <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 space-y-1">
              <span className="font-bold text-emerald-400">VoiceVault Med Immutable Policy:</span>
              <p className="text-[11px] text-slate-400">
                Submitting a correction request will NOT overwrite existing records. If approved by your doctor, a NEW Version {latestVersion ? latestVersion.versionNumber + 1 : 2} will be created, preserving Version 1 intact.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                What information appears incorrect?
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Dosage on record says 10mg, but doctor updated prescription to 20mg during consultation."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                What should the corrected information be?
              </label>
              <textarea
                required
                rows={3}
                value={requestedCorrection}
                onChange={(e) => setRequestedCorrection(e.target.value)}
                placeholder="e.g. Please update prescription to Lisinopril 20mg once daily in the morning."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md"
            >
              Submit Request for Doctor Review
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
