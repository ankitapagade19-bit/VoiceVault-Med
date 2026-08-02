import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { Users, FileSpreadsheet, FileCheck2, ShieldCheck, History, UserPlus, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default async function StaffOverviewPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['STAFF', 'ADMIN']);
  if (!auth.authorized) redirect('/login');

  const [totalPatients, totalDoctors, totalRecords, pendingCorrections, recentAppointments, recentAuditLogs] = await Promise.all([
    prisma.patientProfile.count(),
    prisma.doctorProfile.count(),
    prisma.medicalRecord.count(),
    prisma.correctionRequest.count({ where: { status: 'PENDING' } }),
    prisma.appointment.findMany({
      take: 5,
      orderBy: { date: 'asc' },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: true } }),
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="STAFF" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Administration & Queue Console</h1>
            <p className="text-xs text-slate-500 mt-0.5">Patient registration, appointment scheduling, and front-desk queue management.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </Link>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Patients</span>
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalPatients}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-teal-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Doctors</span>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalDoctors}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-purple-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Records</span>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalRecords}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Corrections</span>
              <FileCheck2 className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{pendingCorrections}</p>
          </div>
        </div>

        {/* Appointments Queue Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Front Desk Appointment Schedule & Queue
            </h3>
            <Badge variant="info">{recentAppointments.length} Active</Badge>
          </div>

          {recentAppointments.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No appointments scheduled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="med-table-header">
                  <tr>
                    <th className="px-4 py-2.5">Queue #</th>
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Doctor</th>
                    <th className="px-4 py-2.5">Date & Slot</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.map((app) => (
                    <tr key={app.id} className="med-table-row">
                      <td className="px-4 py-2.5 font-bold text-blue-700">#{app.queueNumber || '-'}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{app.patient?.user?.name}</td>
                      <td className="px-4 py-2.5 text-slate-700">{app.doctor?.user?.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatDate(app.date)} ({app.timeSlot})</td>
                      <td className="px-4 py-2.5 text-slate-600">{app.reason}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={app.status === 'COMPLETED' ? 'success' : 'info'}>{app.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Activity Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              Recent Security Audit Events
            </h3>
          </div>

          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={log.success ? 'success' : 'danger'}>
                    {log.action}
                  </Badge>
                  <span className="text-slate-800 font-semibold">
                    {log.user?.name || 'System'} ({log.resourceType})
                  </span>
                </div>
                <span className="text-slate-500 font-mono">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
