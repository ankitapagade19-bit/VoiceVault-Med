'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { FileCheck2, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function DoctorCorrectionsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Review form
  const [action, setAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [correctedSymptoms, setCorrectedSymptoms] = useState('');
  const [correctedDiagnosis, setCorrectedDiagnosis] = useState('');
  const [correctedPrescription, setCorrectedPrescription] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/corrections');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openReviewModal = (req: any) => {
    setSelectedRequest(req);
    setAction('APPROVE');
    const latestVersion = req.record?.versions?.[0];
    setCorrectedSymptoms(latestVersion?.symptoms || '');
    setCorrectedDiagnosis(latestVersion?.diagnosis || '');
    setCorrectedPrescription(latestVersion?.prescription || req.requestedCorrection || '');
    setReviewNotes('');
    setFeedback(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const res = await fetch(`/api/corrections/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewNotes,
          symptoms: correctedSymptoms,
          diagnosis: correctedDiagnosis,
          prescription: correctedPrescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review correction request');

      setFeedback({
        type: 'success',
        message:
          action === 'APPROVE'
            ? `Correction Approved! New Version ${data.version.versionNumber} created and linked to SHA-256 chain.`
            : 'Correction Request Rejected. Medical record remains unchanged.',
      });

      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const processedRequests = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="DOCTOR" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">Patient Correction Requests</h1>
            <p className="text-xs text-slate-400">
              Review patient feedback. Approvals generate cryptographically linked new versions (Version N).
            </p>
          </div>
          <Badge variant="warning">{pendingRequests.length} Pending Review</Badge>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            } text-xs flex items-center gap-2`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Pending Requests List */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Pending Action Required
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">All patient correction requests have been reviewed!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-slate-900/80 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-100">{req.patient?.user?.name || 'Patient'}</h4>
                      <p className="text-xs text-slate-400 font-mono">Record ID: {req.recordId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{formatDate(req.createdAt)}</span>
                      <Badge variant="warning">PENDING</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-amber-400 font-bold block mb-1">Patient Reason for Correction:</span>
                      <p className="text-slate-200">{req.reason}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-cyan-400 font-bold block mb-1">Requested Corrected Details:</span>
                      <p className="text-slate-200">{req.requestedCorrection}</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => openReviewModal(req)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow transition-all"
                    >
                      Review & Process Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests History */}
        {processedRequests.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-base font-bold text-slate-100">Reviewed Request History</h3>
            <div className="space-y-2">
              {processedRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">
                      {req.patient?.user?.name} — {req.reason}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Reviewed Notes: {req.reviewNotes || 'No notes'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{formatDate(req.reviewedAt)}</span>
                    <Badge variant={req.status === 'APPROVED' ? 'success' : 'danger'}>
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Review Correction Request */}
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Review Correction Request & Generate Version N"
          maxWidth="xl"
        >
          {selectedRequest && (
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300">
                <p className="font-bold">Patient Requested Change:</p>
                <p className="mt-1 text-slate-200">{selectedRequest.requestedCorrection}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Doctor Decision</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-400">
                    <input
                      type="radio"
                      name="action"
                      value="APPROVE"
                      checked={action === 'APPROVE'}
                      onChange={() => setAction('APPROVE')}
                    />
                    <span>Approve (Create Version N)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-red-400">
                    <input
                      type="radio"
                      name="action"
                      value="REJECT"
                      checked={action === 'REJECT'}
                      onChange={() => setAction('REJECT')}
                    />
                    <span>Reject Request</span>
                  </label>
                </div>
              </div>

              {action === 'APPROVE' && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <p className="font-bold text-emerald-400">Enter Final Corrected Clinical Content:</p>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Symptoms</label>
                    <input
                      type="text"
                      value={correctedSymptoms}
                      onChange={(e) => setCorrectedSymptoms(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Diagnosis</label>
                    <input
                      type="text"
                      value={correctedDiagnosis}
                      onChange={(e) => setCorrectedDiagnosis(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">Prescription / Treatment</label>
                    <input
                      type="text"
                      value={correctedPrescription}
                      onChange={(e) => setCorrectedPrescription(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Practitioner Review Notes</label>
                <textarea
                  rows={2}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain review justification..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md ${
                  action === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {action === 'APPROVE' ? 'Confirm & Create New Version' : 'Reject Correction Request'}
              </button>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
}
