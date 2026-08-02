import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { FileSpreadsheet, Mic, FileCheck2, HeartPulse, ArrowRight, Calendar, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default async function PatientOverviewPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['PATIENT', 'ADMIN']);
  if (!auth.authorized || !session?.patientProfileId) redirect('/login');

  const patientProfileId = session.patientProfileId;

  const [records, voiceConsultations, correctionRequests, appointments] = await Promise.all([
    prisma.medicalRecord.findMany({
      where: { patientId: patientProfileId },
      orderBy: { createdAt: 'desc' },
      include: {
        originatingDoctor: { include: { user: { select: { name: true } } } },
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    }),
    prisma.voiceConsultation.findMany({
      where: { patientId: patientProfileId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.correctionRequest.findMany({
      where: { patientId: patientProfileId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.findMany({
      where: { patientId: patientProfileId },
      orderBy: { date: 'asc' },
      include: { doctor: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  const latestRecord = records[0];
  const latestVersion = latestRecord?.versions[0];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PATIENT" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome, {session.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent, immutable access to your clinical record history, voice consultations, and appointments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">Patient Governance Enforced</Badge>
            {latestRecord && (
              <a
                href={`/api/reports/medical-record/${latestRecord.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF Report</span>
              </a>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Medical Records</span>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{records.length}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-purple-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Voice Consultations</span>
              <Mic className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{voiceConsultations.length}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-teal-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Appointments</span>
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{appointments.length}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Correction Requests</span>
              <FileCheck2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{correctionRequests.length}</p>
          </div>
        </div>

        {/* Latest Active Medical Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-blue-600" />
              Active Clinical Snapshot
            </h3>
            {latestRecord && (
              <a
                href={`/api/reports/medical-record/${latestRecord.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                View Printable Medical Report <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {latestVersion ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Diagnosis</span>
                <p className="text-slate-900 font-bold text-sm">{latestVersion.diagnosis}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Prescription</span>
                <p className="text-blue-700 font-bold text-sm">{latestVersion.prescription}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Active Version</span>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Version {latestVersion.versionNumber}</Badge>
                  <span className="text-slate-500">{formatDate(latestVersion.createdAt)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No medical records on file yet.</p>
          )}
        </div>

        {/* Appointments List */}
        {appointments.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                My Scheduled Appointments
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="med-table-header">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Time Slot</th>
                    <th className="px-4 py-2.5">Doctor</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((app) => (
                    <tr key={app.id} className="med-table-row">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{formatDate(app.date)}</td>
                      <td className="px-4 py-2.5 text-blue-700 font-semibold">{app.timeSlot}</td>
                      <td className="px-4 py-2.5 text-slate-800">{app.doctor?.user?.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{app.reason}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={app.status === 'COMPLETED' ? 'success' : 'info'}>{app.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
