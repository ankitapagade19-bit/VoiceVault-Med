import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { FileSpreadsheet, ArrowRight, ShieldCheck, History } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function PatientRecordsPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['PATIENT']);
  if (!auth.authorized || !session?.patientProfileId) redirect('/login');

  const records = await prisma.medicalRecord.findMany({
    where: { patientId: session.patientProfileId },
    orderBy: { createdAt: 'desc' },
    include: {
      originatingDoctor: { include: { user: { select: { name: true } } } },
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="PATIENT" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">My Medical Records</h1>
            <p className="text-xs text-slate-400">
              Only your authorized records are visible. Transparent version history & integrity proofs.
            </p>
          </div>
          <Badge variant="info">{records.length} Record(s)</Badge>
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
                    <h3 className="text-base font-bold text-slate-100">
                      Record #{r.id.substring(0, 12)}...
                    </h3>
                    <p className="text-xs text-slate-400">
                      Practitioner: Dr. {r.originatingDoctor.user.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                    <Badge variant="success">Version {latestVersion?.versionNumber || 1}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider block">Diagnosis:</span>
                    <p className="text-slate-200 font-medium">{latestVersion?.diagnosis || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-wider block">Prescription:</span>
                    <p className="text-emerald-300 font-medium">{latestVersion?.prescription || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">
                    SHA-256 Hash: {latestVersion?.currentHash.substring(0, 16)}...
                  </span>
                  <Link
                    href={`/patient/records/${r.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs shadow flex items-center gap-1 transition-all"
                  >
                    <span>View Record & History</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
