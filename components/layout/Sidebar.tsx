'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  FileSpreadsheet,
  Mic,
  ShieldCheck,
  History,
  Activity,
  Calendar,
  Lock,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'STAFF' | 'DOCTOR' | 'PATIENT';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navItems = {
    ADMIN: [
      { label: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Correction Requests', href: '/admin/corrections', icon: FileCheck2 },
      { label: 'User Directory', href: '/admin/users', icon: Users },
      { label: 'Audit Logs', href: '/admin/audit', icon: History },
      { label: 'Security & Chains', href: '/admin/security', icon: ShieldCheck },
    ],
    STAFF: [
      { label: 'Staff Dashboard', href: '/staff', icon: LayoutDashboard },
      { label: 'Appointments & Queue', href: '/staff/appointments', icon: Calendar },
      { label: 'Patient Directory', href: '/staff/users', icon: Users },
      { label: 'Audit Logs', href: '/staff/audit', icon: History },
    ],
    DOCTOR: [
      { label: 'Doctor Dashboard', href: '/doctor', icon: LayoutDashboard },
      { label: 'Clinical Records', href: '/doctor/records', icon: FileSpreadsheet },
      { label: 'Voice Consultations', href: '/doctor/voice', icon: Mic },
      { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
      { label: 'Correction Requests', href: '/doctor/corrections', icon: FileCheck2 },
      { label: 'Chain Verification', href: '/doctor/integrity', icon: ShieldCheck },
    ],
    PATIENT: [
      { label: 'Patient Portal', href: '/patient', icon: LayoutDashboard },
      { label: 'Medical History', href: '/patient/records', icon: FileSpreadsheet },
      { label: 'Voice Recordings', href: '/patient/voice', icon: Mic },
      { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
      { label: 'Correction Requests', href: '/patient/corrections', icon: FileCheck2 },
      { label: 'Access History', href: '/patient/activity', icon: Activity },
    ],
  };

  const items = navItems[role] || navItems.PATIENT;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-6 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 hidden md:flex">
      <div className="space-y-4">
        {/* Role Identity Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Workspace Role
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">{role} PORTAL</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
              Active
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Security Status Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
        <div className="flex items-center gap-1.5 text-blue-700 font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Zero Trust Governance</span>
        </div>
        <p className="text-[11px] leading-tight text-slate-500">
          Server verifies identity, role, and relationship on every API call.
        </p>
      </div>
    </aside>
  );
}
