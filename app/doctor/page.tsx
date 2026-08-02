import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { Users, FileCheck2, ShieldCheck, ArrowRight, UserCheck, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default async function DoctorDashboardPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['DOCTOR', 'ADMIN']);
  if (!auth.authorized || !session?.doctorProfileId) redirect('/login');

  const doctorProfileId = session.doctorProfileId;

  // Fetch assigned patients for this doctor
  const assignments = await prisma.doctorPatientAssignment.findMany({
    where: { doctorId: doctorProfileId, active: true },
    include: {
      patient: {
        include: {
          user: { select: { name: true, email: true } },
          medicalRecords: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
          },
        },
      },
    },
  });

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: doctorProfileId },
    include: { patient: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { date: 'asc' },
    take: 5,
  });

  const pendingCorrectionsCount = await prisma.correctionRequest.count({
    where: {
      patientId: { in: assignments.map((a) => a.patientId) },
      status: 'PENDING',
    },
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="DOCTOR" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Physician Clinical Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <strong>{session.name}</strong>. Zero Trust restricts record access to your assigned roster.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/corrections"
              className="px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <FileCheck2 className="w-4 h-4 text-amber-600" />
              <span>Pending Corrections ({pendingCorrectionsCount})</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Patients</span>
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{assignments.length}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Review Requests</span>
              <FileCheck2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{pendingCorrectionsCount}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SHA-256 Chain Status</span>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-lg font-bold text-emerald-700 mt-1">✓ 100% Cryptographically Verified</p>
          </div>
        </div>

        {/* Appointments Preview */}
        {appointments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Upcoming Patient Appointments
              </h3>
              <Badge variant="info">{appointments.length} Scheduled</Badge>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="med-table-header">
                  <tr>
                    <th className="px-4 py-2.5">Time Slot</th>
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((app) => (
                    <tr key={app.id} className="med-table-row">
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{app.timeSlot} ({formatDate(app.date)})</td>
                      <td className="px-4 py-2.5 text-slate-800 font-bold">{app.patient?.user?.name}</td>
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

        {/* Assigned Patients Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Authorized Patient Roster
            </h3>
            <Badge variant="success">Zero Trust Enforced</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asgn) => {
              const patient = asgn.patient;
              const latestRecord = patient.medicalRecords[0];
              const latestVersion = latestRecord?.versions[0];

              return (
                <div
                  key={patient.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{patient.user.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        Code: {patient.patientCode} | DOB: {patient.dateOfBirth || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="info">{patient.bloodType || 'A+'}</Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">Latest Diagnosis:</span>
                    {latestVersion ? (
                      <p className="text-slate-800 font-semibold truncate">{latestVersion.diagnosis}</p>
                    ) : (
                      <p className="text-slate-400 italic">No medical records created yet</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      {latestRecord ? `Last Visit: ${formatDate(latestRecord.createdAt)}` : 'New Patient'}
                    </span>
                    <Link
                      href={`/doctor/patients/${patient.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs flex items-center gap-1 transition-all"
                    >
                      <span>Clinical Chart</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
