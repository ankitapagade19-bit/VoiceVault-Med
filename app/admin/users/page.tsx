'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users, Plus, UserCheck, ShieldAlert } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const active = users.filter((u) => u.status === 'ACTIVE').length;
  const doctors = users.filter((u) => u.role === 'DOCTOR').length;
  const staff = users.filter((u) => u.role === 'STAFF').length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Governance
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 ml-11">
            Manage doctors, staff, patients, and administrators.
          </p>
        </div>

        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Users</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{users.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Accounts</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{active}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctors</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{doctors}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</p>
          <p className="text-3xl font-extrabold text-slate-700 mt-2">{staff}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="space-y-4">
        {loading ? (
          <SkeletonLoader rows={5} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No user accounts have been created yet."
            icon={Users}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{u.name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            u.role === 'ADMIN'
                              ? 'purple'
                              : u.role === 'DOCTOR'
                              ? 'success'
                              : u.role === 'STAFF'
                              ? 'info'
                              : 'default'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all">
                          Edit
                        </button>
                        <button className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-all">
                          Disable
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}