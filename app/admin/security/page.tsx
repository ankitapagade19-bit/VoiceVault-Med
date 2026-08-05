'use client';

import React from 'react';
import { ShieldCheck, Lock, HardDrive, Database, Key, History, Activity } from 'lucide-react';

export default function SecurityPage() {
  const securityFeatures = [
    {
      title: "SHA-256 Hash Chain",
      description: "All record versions are linked using deterministic SHA-256 hashes.",
      status: "Active",
      icon: Lock,
    },
    {
      title: "IPFS Voice Pinning",
      description: "Voice consultations are pinned on IPFS using immutable content IDs.",
      status: "Active",
      icon: HardDrive,
    },
    {
      title: "Zero Trust RBAC",
      description: "Every request is validated using role-based access control.",
      status: "Active",
      icon: ShieldCheck,
    },
    {
      title: "Decentralized Storage",
      description: "Medical records are securely stored with redundant architecture.",
      status: "Active",
      icon: Database,
    },
    {
      title: "Cryptographic Keys",
      description: "Every update is cryptographically verified before being stored.",
      status: "Active",
      icon: Key,
    },
    {
      title: "Immutable Versioning",
      description: "Records are never overwritten. Every update creates a new version.",
      status: "Active",
      icon: History,
    },
  ];

  const logs = [
    { event: "User Login", user: "Dr. Sarah Lin", time: "2026-08-04 10:23", status: "Success" },
    { event: "Patient Record Access", user: "Michael Torres", time: "2026-08-04 09:45", status: "Success" },
    { event: "Failed Login Attempt", user: "Unknown", time: "2026-08-04 08:12", status: "Failed" },
    { event: "Correction Approved", user: "System Admin", time: "2026-08-03 16:20", status: "Success" },
  ];

  return (
    <div className="space-y-6 text-slate-900">
      {/* Page Title Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security Center</h1>
        <p className="text-xs text-slate-600 mt-1">
          Monitor security, integrity, and Zero Trust protection across VoiceVault.
        </p>
      </div>

      {/* High-Contrast Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chain Integrity</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">100%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hashed Records</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">1,247</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">IPFS Records</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">384</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Users</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">12</p>
        </div>
      </div>

      {/* Security Architecture Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Security Architecture</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {securityFeatures.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-xs text-slate-900">{item.title}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Security Events Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Recent Security Events</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {logs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-all">
                  <td className="px-4 py-3 font-semibold text-slate-900">{log.event}</td>
                  <td className="px-4 py-3 text-slate-600">{log.user}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{log.time}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'Success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}