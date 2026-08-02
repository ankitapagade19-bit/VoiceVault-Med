import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { FileCheck2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function PatientCorrectionsPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['PATIENT']);
  if (!auth.authorized || !session?.patientProfileId) redirect('/login');

  const requests = await prisma.correctionRequest.findMany({
    where: { patientId: session.patientProfileId },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewedBy: { select: { name: true } },
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="PATIENT" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">Correction Requests Tracker</h1>
            <p className="text-xs text-slate-400">
              Track the status of your record modification requests submitted for doctor review
            </p>
          </div>
          <Badge variant="warning">{requests.length} Request(s) Submitted</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {requests.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 border border-slate-800">
              <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No correction requests submitted yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                You can request corrections on any of your medical record pages.
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Record ID: {req.recordId}</h3>
                    <p className="text-xs text-slate-400">Submitted: {formatDate(req.createdAt)}</p>
                  </div>
                  <Badge
                    variant={
                      req.status === 'APPROVED'
                        ? 'success'
                        : req.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {req.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">Reason for Request:</span>
                    <p className="text-slate-200">{req.reason}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">Requested Corrected Info:</span>
                    <p className="text-slate-200">{req.requestedCorrection}</p>
                  </div>
                </div>

                {req.status !== 'PENDING' && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <span className="text-emerald-400 font-bold block">
                      Doctor Review Notes ({req.reviewedBy?.name || 'Practitioner'}):
                    </span>
                    <p className="text-slate-300 italic">{req.reviewNotes || 'No notes provided'}</p>
                    <span className="text-[10px] text-slate-500 block">{formatDate(req.reviewedAt)}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
