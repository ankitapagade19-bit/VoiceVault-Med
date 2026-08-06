'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Calendar, Clock } from 'lucide-react';

export default function PatientAppointmentsPage() {
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
      <Sidebar role="PATIENT" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-xs text-slate-600">View and track your scheduled hospital consultations</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading appointments...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-900 font-bold uppercase">
                <tr>
                  <th className="p-4">Time Slot</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-blue-700 font-mono text-xs">{apt.timeSlot || '10:00 AM'}</td>
                    <td className="p-4 text-slate-800">{apt.reason || 'Routine Visit'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-bold text-[10px]">
                        {apt.status || 'CONFIRMED'}
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