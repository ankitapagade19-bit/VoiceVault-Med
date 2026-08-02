'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ShieldCheck, ShieldAlert, Key, Lock, RefreshCw, AlertTriangle, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { IntegrityBadge } from '@/components/security/IntegrityBadge';
import { formatHash } from '@/lib/utils';

export default function DoctorIntegrityPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tamperFeedback, setTamperFeedback] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        if (data.records && data.records.length > 0) {
          setSelectedRecordId(data.records[0].id);
          runVerification(data.records[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const runVerification = async (recId: string) => {
    setLoading(true);
    setTamperFeedback(null);
    try {
      const res = await fetch(`/api/records/${recId}/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerification(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!selectedRecordId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/integrity/tamper-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedRecordId,
          versionNumber: 1,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTamperFeedback('⚠️ Simulated database tampering executed on Version 1! Re-running cryptographic verification...');
        // Immediately re-run verification
        setTimeout(() => {
          runVerification(selectedRecordId);
        }, 600);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="DOCTOR" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">Cryptographic Hash Chain Inspector</h1>
            <p className="text-xs text-slate-400">
              Blockchain-inspired SHA-256 verification re-computes hashes on-demand to guarantee historical integrity
            </p>
          </div>
          <Badge variant="success">SHA-256 Active</Badge>
        </div>

        {/* Record Selection Dropdown & Run Button */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-300">Select Record:</label>
            <select
              value={selectedRecordId}
              onChange={(e) => {
                setSelectedRecordId(e.target.value);
                runVerification(e.target.value);
              }}
              className="p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs"
            >
              {records.map((r, i) => (
                <option key={r.id} value={r.id}>
                  Record #{i + 1} ({r.id.substring(0, 12)}...) - Patient: {r.patient?.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => runVerification(selectedRecordId)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-Verify Chain</span>
            </button>

            <button
              onClick={handleSimulateTamper}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Simulates an unauthorized integrity breach to verify hash-chain detection"
            >
              <Bug className="w-3.5 h-3.5 text-red-400" />
              <span>Simulate Integrity Breach</span>
            </button>
          </div>
        </div>

        {tamperFeedback && (
          <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse">
            {tamperFeedback}
          </div>
        )}

        {/* Verification Result Overview Card */}
        {verification && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">Verification Result Payload</h3>
                  <p className="text-xs text-slate-400">{verification.verification?.message}</p>
                </div>
                <IntegrityBadge status={verification.verification?.status} size="lg" />
              </div>

              {/* Version Chain Nodes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Version Nodes ({verification.versions?.length || 0})
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {verification.versions?.map((v: any) => (
                    <div
                      key={v.versionNumber}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between font-sans">
                        <span className="font-bold text-slate-200">Version {v.versionNumber}</span>
                        <span className="text-slate-500">{new Date(v.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <div>
                          <span className="text-slate-500">previousHash:</span>{' '}
                          <code className="text-amber-400">{v.previousHash || 'GENESIS_NULL'}</code>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold">currentHash:</span>{' '}
                          <code className="text-emerald-400">{v.currentHash}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
