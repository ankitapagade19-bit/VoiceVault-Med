'use client';

import React from 'react';
import { History, ShieldCheck, Database, HardDrive } from 'lucide-react';

export default function AuditPage() {
  const auditLogs = [
    { recordId: "#R-3821", version: "v4", hash: "a4f8...3d1e", action: "Correction Approved", time: "2026-08-04 09:23" },
    { recordId: "#R-3821", version: "v3", hash: "b9e2...7f4a", action: "Voice Pinning", time: "2026-08-03 16:10" },
    { recordId: "#R-2740", version: "v2", hash: "c81d...9b2f", action: "Staff Update", time: "2026-08-02 11:45" },
    { recordId: "#R-2740", version: "v1", hash: "e3f0...6a8c", action: "Initial Record", time: "2026-07-30 08:12" },
  ];

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Audit • Immutable Chain
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          View all record versions and verify the integrity of every medical record stored in VoiceVault.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Versions</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">1,247</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unique Records</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">384</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chain Integrity</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">100%</p>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Version History & Cryptographic Proofs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 font-sans text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Record ID</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">SHA-256 Hash</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {auditLogs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-all">
                  <td className="px-4 py-3 font-bold text-blue-600">{log.recordId}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{log.version}</td>
                  <td className="px-4 py-3 text-slate-600 bg-slate-50 rounded px-2 py-1 my-1 inline-block border border-slate-200">
                    {log.hash}
                  </td>
                  <td className="px-4 py-3 font-sans font-medium text-slate-900">{log.action}</td>
                  <td className="px-4 py-3 font-sans text-slate-500">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <History className="w-4 h-4 text-blue-600" />
            <span>Immutable History</span>
          </div>
          <p className="text-xs text-slate-600">
            Records are never overwritten. Every change creates a new version.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>SHA-256 Verification</span>
          </div>
          <p className="text-xs text-slate-600">
            Every version is cryptographically linked with its predecessor.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>IPFS Storage</span>
          </div>
          <p className="text-xs text-slate-600">
            Voice consultations are securely pinned using immutable content IDs.
          </p>
        </div>
      </div>
    </div>
  );
}