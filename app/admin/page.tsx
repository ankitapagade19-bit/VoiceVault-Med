'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Shield, FileCheck2, Users, History } from 'lucide-react';
import { formatDate, formatHash } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'corrections' | 'users' | 'audit'>('corrections');

  const [selectedCorrection, setSelectedCorrection] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [updatedSymptoms, setUpdatedSymptoms] = useState('');
  const [updatedDiagnosis, setUpdatedDiagnosis] = useState('');
  const [updatedPrescription, setUpdatedPrescription] = useState('');
  const [updatedNotes, setUpdatedNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [corrRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/corrections'),
        fetch('/api/users'),
        fetch('/api/audit'),
      ]);

      if (corrRes.ok) {
        const corrData = await corrRes.json();
        setCorrections(corrData.corrections || []);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.auditLogs || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReviewModal = (correction: any) => {
    setSelectedCorrection(correction);
    setReviewAction('APPROVE');
    setReviewNotes('');
    const latestVersion = correction.record?.versions?.[0];
    setUpdatedSymptoms(latestVersion?.symptoms || '');
    setUpdatedDiagnosis(latestVersion?.diagnosis || '');
    setUpdatedPrescription(latestVersion?.prescription || '');
    setUpdatedNotes(latestVersion?.notes || '');
    setActionFeedback(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCorrection) return;

    setIsSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/admin/corrections/${selectedCorrection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          reviewNotes,
          ...(reviewAction === 'APPROVE' && {
            symptoms: updatedSymptoms,
            diagnosis: updatedDiagnosis,
            prescription: updatedPrescription,
            notes: updatedNotes,
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review decision.');

      setActionFeedback(`Correction request ${reviewAction === 'APPROVE' ? 'approved & version created' : 'rejected'}.`);
      setTimeout(() => {
        setSelectedCorrection(null);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = corrections.filter((c) => c.status === 'PENDING').length;
  const approvedCount = corrections.filter((c) => c.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-black text-slate-100">Admin Operations Console</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review correction requests, audit cryptographic logs, and oversee user governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            Pending Reviews: <strong className="text-amber-400">{pendingCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
            Approved Versions: <strong className="text-emerald-400">{approvedCount}</strong>
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('corrections')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'corrections' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Correction Workflow ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'users' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'audit' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Chain Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: CORRECTION WORKFLOW */}
      {activeTab === 'corrections' && (
        <div className="space-y-4">
          {loading ? (
            <SkeletonLoader rows={4} />
          ) : corrections.length === 0 ? (
            <EmptyState title="No correction requests" description="No patient or doctor correction requests found." icon={FileCheck2} />
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Requested Correction</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {corrections.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <Badge variant={c.status === 'PENDING' ? 'warning' : c.status === 'APPROVED' ? 'success' : 'danger'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-100">{c.patient?.user?.name || 'Patient'}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{c.reason}</td>
                      <td className="px-4 py-3 text-cyan-300 font-medium max-w-xs truncate">{c.requestedCorrection}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {c.status === 'PENDING' ? (
                          <button
                            onClick={() => openReviewModal(c)}
                            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow"
                          >
                            Review & Action
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {loading ? (
            <SkeletonLoader rows={5} />
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">User Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-100">{u.name}</td>
                      <td className="px-4 py-3 text-slate-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'purple' : u.role === 'DOCTOR' ? 'success' : u.role === 'STAFF' ? 'info' : 'default'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-red-950/80 text-red-400 border border-red-800'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT CHAIN LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {loading ? (
            <SkeletonLoader rows={5} />
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-slate-800 text-slate-400 font-sans font-bold">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Current Hash (SHA-256)</th>
                    <th className="px-4 py-3 font-sans">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {auditLogs.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-cyan-400">{a.action}</td>
                      <td className="px-4 py-3 text-slate-300">{a.resourceType}</td>
                      <td className="px-4 py-3 text-slate-500">{a.userId ? formatHash(a.userId, 6, 4) : 'System'}</td>
                      <td className="px-4 py-3 text-amber-300">{formatHash(a.currentHash || '', 10, 6)}</td>
                      <td className="px-4 py-3 text-slate-500 font-sans">{formatDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REVIEW MODAL */}
      {selectedCorrection && (
        <Modal isOpen={!!selectedCorrection} onClose={() => setSelectedCorrection(null)} title="Review Correction Request" maxWidth="xl">
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-slate-300">
              <p><strong>Reason:</strong> {selectedCorrection.reason}</p>
              <p className="text-cyan-400"><strong>Requested Change:</strong> {selectedCorrection.requestedCorrection}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Decision</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-400">
                  <input type="radio" name="decision" value="APPROVE" checked={reviewAction === 'APPROVE'} onChange={() => setReviewAction('APPROVE')} />
                  <span>Approve & Generate Version N</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-red-400">
                  <input type="radio" name="decision" value="REJECT" checked={reviewAction === 'REJECT'} onChange={() => setReviewAction('REJECT')} />
                  <span>Reject Request</span>
                </label>
              </div>
            </div>

            {reviewAction === 'APPROVE' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-200 block">New Immutable Version Content:</span>
                <input type="text" placeholder="Symptoms" value={updatedSymptoms} onChange={(e) => setUpdatedSymptoms(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" />
                <input type="text" placeholder="Diagnosis" value={updatedDiagnosis} onChange={(e) => setUpdatedDiagnosis(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" />
                <input type="text" placeholder="Prescription" value={updatedPrescription} onChange={(e) => setUpdatedPrescription(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-cyan-400" />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 mb-1">Review Notes</label>
              <textarea rows={2} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Administrative notes..." className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" />
            </div>

            {actionFeedback && (
              <div className={`p-3 rounded-xl font-bold ${actionFeedback.startsWith('Error') ? 'bg-red-950/80 text-red-300' : 'bg-emerald-950/80 text-emerald-300'}`}>
                {actionFeedback}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setSelectedCorrection(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold disabled:opacity-50">
                {isSubmitting ? 'Processing...' : 'Submit Decision'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
