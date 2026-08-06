import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';

export default async function StaffAuditPage() {
  const session = await getSession();
  const auth = await requireRole(session, ['STAFF', 'ADMIN']);
  if (!auth.authorized) redirect('/login');

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-900">
      <Sidebar role="STAFF" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">System Audit Log Viewer</h1>
            <p className="text-xs text-slate-400">
              Immutable security event logging for all authentication, data access, and versioning events
            </p>
          </div>
          <Badge variant="purple">{logs.length} Recorded Log Entries</Badge>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor / User</th>
                  <th className="px-6 py-3.5">Action Event</th>
                  <th className="px-6 py-3.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-3.5 text-slate-400 font-sans">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-200 font-sans">{log.user?.name || 'System / Anonymous'}</div>
                      <div className="text-[10px] text-slate-400">{log.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-3.5 font-sans">
                      <Badge variant={log.action.includes('DENIED') || log.action.includes('FAILURE') ? 'danger' : 'success'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      {log.success ? (
                        <span className="text-emerald-400 font-bold">SUCCESS</span>
                      ) : (
                        <span className="text-red-400 font-bold">DENIED / FAIL</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}