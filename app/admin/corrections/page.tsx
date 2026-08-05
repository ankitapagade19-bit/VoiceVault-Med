'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FileCheck2, Clock, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminCorrectionsPage() {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCorrections = async () => {
    try {
      const res = await fetch('/api/corrections');
      if (res.ok) {
        const data = await res.json();
        setCorrections(data.corrections || data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const pending = corrections.filter((c) => c.status === 'PENDING' || c.status === 'REVIEW').length;
  const approved = corrections.filter((c) => c.status === 'APPROVED').length;
  const rejected = corrections.filter((c) => c.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-100">Correction Requests</h1>
        <p className="text-xs text-slate-400 mt-1">Review and manage requested changes to patient medical records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending</h2>
          <p className="text-3xl font-black text-amber-400 mt-2">{pending}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Approved</h2>
          <p className="text-3xl font-black text-emerald-400 mt-2">{approved}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Rejected</h2>
          <p className="text-3xl font-black text-red-400 mt-2">{rejected}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {corrections.map((item) => (
          <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-100">{item.patient?.user?.name || item.patient || 'Patient'}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{item.id}</p>
              </div>
              <Badge variant={item.status === 'APPROVED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'danger'}>
                {item.status}
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-cyan-300">{item.reason || item.request}</p>
              <p className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">{item.requestedCorrection || item.description}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
              <span>Submitted: {formatDate(item.createdAt || item.submitted)}</span>
              {item.priority && <span>Priority: <strong className="text-slate-200">{item.priority}</strong></span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}