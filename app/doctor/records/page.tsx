import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { FileSpreadsheet, History, ArrowRight, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function DoctorRecordsPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['DOCTOR']);
  if (!auth.authorized || !session?.doctorProfileId) redirect('/login');

  const records = await prisma.medicalRecord.findMany({
    where: { originatingDoctorId: session.doctorProfileId },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: { include: { user: { select: { name: true, email: true } } } },
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="DOCTOR" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">Practitioner Clinical Records</h1>
            <p className="text-xs text-slate-400">All medical records created under your practitioner identity</p>
          </div>
          <Badge variant="success">{records.length} Total Records</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {records.map((r) => {
            const latestVersion = r.versions[0];
            return (
              <div
                key={r.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{r.patient.user.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Record ID: {r.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                    <Badge variant="info">{r.versions.length} Version(s)</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider block">Latest Diagnosis:</span>
                    <p className="text-slate-200 font-medium">{latestVersion?.diagnosis || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider block">Prescription:</span>
                    <p className="text-emerald-300 font-medium">{latestVersion?.prescription || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">
                    Active Hash: {latestVersion?.currentHash.substring(0, 16)}...
                  </span>
                  <Link
                    href={`/doctor/patients/${r.patientId}`}
                    className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                  >
                    View Chart & Versions <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
