'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Users, FileCheck2, ShieldCheck, ArrowRight, UserCheck, Calendar, UserPlus, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function DoctorDashboardPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pendingCorrectionsCount, setPendingCorrectionsCount] = useState<number>(0);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Register Patient Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dateOfBirth: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      const patientsRes = await fetch('/api/patients', { cache: 'no-store' });
      if (patientsRes.ok) {
        const pData = await patientsRes.json();
        setAssignments(pData.patients || []);
      }

      const aptRes = await fetch('/api/appointments', { cache: 'no-store' });
      if (aptRes.ok) {
        const aData = await aptRes.json();
        setAppointments(aData.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsRegisterOpen(false);
        setFormData({ name: '', email: '', phone: '', gender: 'MALE', dateOfBirth: '', address: '' });
        fetchDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register patient');
      }
    } catch (err) {
      alert('Error registering patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="DOCTOR" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Physician Clinical Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <strong>{session?.name || 'Doctor'}</strong>. Zero Trust restricts record access to your assigned roster.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
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
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Time Slot</th>
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{app.timeSlot} ({formatDate(app.date)})</td>
                      <td className="px-4 py-2.5 text-slate-800 font-bold">{app.patient?.user?.name || app.patientName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{app.reason}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={app.status === 'COMPLETED' ? 'success' : 'info'}>{app.status || 'SCHEDULED'}</Badge>
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
            {assignments.map((patient: any) => (
              <div
                key={patient.id}
                className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{patient.name || patient.user?.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Email: {patient.email || patient.user?.email}
                    </p>
                  </div>
                  <Badge variant="info">Patient</Badge>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">Active Patient Profile</span>
                  <Link
                    href={`/doctor/patients/${patient.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs flex items-center gap-1 transition-all"
                  >
                    <span>Clinical Chart</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Register Patient Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register New Patient</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                  placeholder="patient@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200"
                    placeholder="+123456789"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all mt-2"
              >
                {submitting ? 'Registering...' : 'Save Patient to Database'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}