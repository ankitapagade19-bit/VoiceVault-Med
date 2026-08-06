'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Calendar, Clock, User, CheckCircle2 } from 'lucide-react';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch('/api/appointments', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="DOCTOR" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Doctor Appointments Schedule</h1>
          <p className="text-xs text-slate-600 mt-0.5">Manage your daily patient consultations and scheduled visits</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 font-semibold">Loading appointments schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-700 text-xs font-medium shadow-sm">
            No scheduled appointments found.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-900 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-blue-700 font-mono text-xs">{apt.timeSlot || '09:00 AM'}</td>
                    <td className="p-4 font-extrabold text-slate-900">{apt.patientName || apt.patient?.user?.name || 'Patient'}</td>
                    <td className="p-4 text-slate-800">{apt.reason || 'General Consultation'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[10px] border border-emerald-300">
                        {apt.status || 'SCHEDULED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}