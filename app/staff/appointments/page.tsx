'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Clock, User } from 'lucide-react';

export default function StaffAppointmentsQueuePage() {
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
      <Sidebar role="STAFF" />
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Hospital Queue & Appointments</h1>
          <p className="text-xs text-slate-600">Real-time daily patient queue management for hospital staff</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading live queue...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                    {apt.status || 'SCHEDULED'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {apt.timeSlot || '09:00 AM'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    {apt.patientName || 'Patient Record'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">Reason: {apt.reason || 'Routine Checkup'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}