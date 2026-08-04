'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, History, Mic, Lock, FileCheck2, Activity, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Cryptographically Verified Health Records & Governance</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15]">
         <span className="text-white">VoiceVault</span>{" "}
         <span className="text-blue-500">Med</span>
        </h1>

        <p className="text-lg sm:text-xl font-medium text-slate-700 max-w-3xl mx-auto">
          Enterprise Hospital Record Management, Voice Consultation Pinning, and Zero Trust Compliance System.
        </p>

        <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Designed for clinical staff, physicians, and patients with immutable version histories, SHA-256 hash proofs, and real-time audit trails.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <span>Sign In to Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-all shadow-2xs"
          >
            Register Patient Account
          </Link>
        </div>
      </section>

      {/* PORTAL WORKSPACES */}
      <section className="space-y-6 pt-4">
        <div className="text-center space-y-1">
          <Badge variant="info">Operational Workspaces</Badge>
          <h2 className="text-2xl font-bold text-slate-900">Role-Based Access Control</h2>
          <p className="text-xs text-slate-500">Separation of duties enforced via zero trust server authorization.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Doctor Portal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Manage assigned patients, author immutable record versions, and capture voice consultations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Staff Portal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Register new patients, schedule appointments, organize queue status, and handle requests.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Patient Portal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              View medical history, stream voice consultations, submit correction requests, and export records.
            </p>
          </div>
        </div>
      </section>

      {/* CORE ARCHITECTURE PILLARS */}
      <section className="space-y-6 pt-4">
        <div className="text-center space-y-1">
          <Badge variant="success">Security Architecture</Badge>
          <h2 className="text-2xl font-bold text-slate-900">Cryptographic Integrity Guarantees</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">1. Immutable Version History</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Medical records are never overwritten. Approved updates or corrections create new versions linked back to the prior version hash.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">2. SHA-256 Hash Chain Verification</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every version computes a deterministic SHA-256 hash. Any unauthorized database tampering immediately invalidates the cryptographic chain.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">3. Decentralized IPFS Voice Pinning</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Audio consultations recorded in browser are hashed with SHA-256 and stored on IPFS, saving immutable CIDs into the database.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">4. Zero Trust Authorization</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Server-side API handlers evaluate user identity, active status, role permissions, and patient assignment links on every single request.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
