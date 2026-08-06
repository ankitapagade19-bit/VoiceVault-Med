'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments & Patient Queue</h1>
          <p className="text-xs text-slate-500">Manage daily hospital consultations and queue status</p>
        </div>
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-sm"
        >
          Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading live queue from database...</div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No active appointments found in queue.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                  {apt.status || 'SCHEDULED'}
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {apt.timeSlot || '09:00 AM'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  {apt.patientName || 'Patient Record'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Doctor: {apt.doctorName || 'Assigned Physician'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}