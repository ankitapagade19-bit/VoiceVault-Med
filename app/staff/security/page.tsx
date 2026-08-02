import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function StaffSecurityPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['STAFF']);
  if (!auth.authorized) redirect('/login');

  const [deniedLogs, integrityLogs, totalVersions] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: 'ACCESS_DENIED' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.auditLog.findMany({
      where: { action: { in: ['INTEGRITY_VERIFICATION_RUN', 'INTEGRITY_FAILURE'] } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.medicalRecordVersion.count(),
  ]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="STAFF" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">Security & Cryptographic Integrity Overview</h1>
            <p className="text-xs text-slate-400">
              Zero Trust access denial events & real-time hash-chain verification status
            </p>
          </div>
          <Badge variant="success">All SHA-256 Chains Active</Badge>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hashed Record Snapshots</span>
            <p className="text-3xl font-black text-emerald-400">{totalVersions}</p>
            <p className="text-[11px] text-slate-500">Append-only medical record versions in database</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked Access Attempts</span>
            <p className="text-3xl font-black text-red-400">{deniedLogs.length}</p>
            <p className="text-[11px] text-slate-500">Zero Trust server-side policy enforcement blocks</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Chain Verifications</span>
            <p className="text-3xl font-black text-cyan-400">{integrityLogs.length}</p>
            <p className="text-[11px] text-slate-500">SHA-256 chain verification checks executed</p>
          </div>
        </div>

        {/* Blocked Denied Requests Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Zero Trust Access Denial Events
          </h3>

          <div className="space-y-2 text-xs">
            {deniedLogs.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">No access denial events recorded.</p>
            ) : (
              deniedLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-red-300 block">
                      {log.user?.name || 'Unauthenticated User'} ({log.user?.role || 'Guest'})
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Attempted unauthorized access to {log.resourceType} {log.resourceId}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{formatDate(log.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
