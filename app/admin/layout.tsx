'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Central Sidebar for Admin section */}
      <Sidebar role="ADMIN" />

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}