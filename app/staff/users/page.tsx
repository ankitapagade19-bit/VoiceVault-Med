'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Users, UserPlus, Link2, Search, CheckCircle2, XCircle, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function StaffUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCTOR',
    specialization: '',
    patientCode: '',
    dateOfBirth: '',
    phone: '',
    bloodType: 'A+',
  });

  const [assignment, setAssignment] = useState({
    doctorId: '',
    patientId: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<string>('');
  const [resetPassword, setResetPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setFeedback({ type: 'success', message: `User '${newUser.name}' created successfully as ${newUser.role}` });
      setIsAddUserOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch('/api/users/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bind assignment');

      setFeedback({ type: 'success', message: 'Doctor successfully assigned to Patient!' });
      setIsAssignOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Account ${nextStatus === 'ACTIVE' ? 'reactivated' : 'deactivated'} successfully.` });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetTarget, temporaryPassword: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setFeedback({ type: 'success', message: 'Temporary password issued and account flagged for first login change.' });
      setResetTarget('');
      setResetPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const doctors = users.filter((u) => u.role === 'DOCTOR' && u.doctorProfile);
  const patients = users.filter((u) => u.role === 'PATIENT' && u.patientProfile);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="STAFF" />
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">User Management Directory</h1>
            <p className="text-xs text-slate-400">
              Provision Doctor/Patient accounts & manage explicit Zero Trust Doctor-Patient assignments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAssignOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Link2 className="w-4 h-4 text-cyan-400" />
              <span>Assign Doctor to Patient</span>
            </button>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register User</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            } text-xs flex items-center gap-2`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {['ALL', 'STAFF', 'DOCTOR', 'PATIENT'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  roleFilter === r
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Metadata / Code</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-100">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role === 'STAFF' ? 'purple' : u.role === 'DOCTOR' ? 'success' : 'info'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-300">
                      {u.doctorProfile && (
                        <span>
                          Code: {u.doctorProfile.doctorCode} | Spec: {u.doctorProfile.specialization}
                        </span>
                      )}
                      {u.patientProfile && (
                        <span>
                          Code: {u.patientProfile.patientCode} | DOB: {u.patientProfile.dateOfBirth || 'N/A'}
                        </span>
                      )}
                      {u.role === 'STAFF' && <span className="text-slate-500">System Admin</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.role !== 'STAFF' && (
                          <button
                            onClick={() => toggleUserStatus(u.id, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              u.status === 'ACTIVE'
                                ? 'bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900'
                                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {u.role !== 'STAFF' && (
                          <button
                            onClick={() => {
                              setResetTarget(u.id);
                              setResetPassword('');
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                          >
                            <span className="flex items-center gap-1"><KeyRound className="w-3 h-3" />Reset</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Register User */}
        <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Register New User Account">
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Role Type</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              >
                <option value="DOCTOR">Doctor Practitioner</option>
                <option value="PATIENT">Patient Account</option>
                <option value="STAFF">Staff Account</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="e.g. Dr. Alice Vance or Bob Marley"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="user@voicevault.med"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Temporary Password</label>
              <input
                type="password"
                required
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Create a strong temporary password"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            {newUser.role === 'DOCTOR' && (
              <div>
                <label className="block font-bold text-slate-300 mb-1">Specialization</label>
                <input
                  type="text"
                  value={newUser.specialization}
                  onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                  placeholder="Cardiology / Internal Medicine"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                />
              </div>
            )}

            {newUser.role === 'PATIENT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newUser.dateOfBirth}
                    onChange={(e) => setNewUser({ ...newUser, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Blood Type</label>
                  <input
                    type="text"
                    value={newUser.bloodType}
                    onChange={(e) => setNewUser({ ...newUser, bloodType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md"
            >
              Provision Account
            </button>
          </form>
        </Modal>

        {/* Modal: Reset Password */}
        <Modal isOpen={!!resetTarget} onClose={() => setResetTarget('')} title="Reset Temporary Password">
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-400">Set a strong temporary password and require the user to change it at next sign-in.</p>
            <input
              type="password"
              required
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New temporary password"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
            />
            <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs">
              Issue Temporary Password
            </button>
          </form>
        </Modal>

        {/* Modal: Assign Doctor to Patient */}
        <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Doctor to Patient">
          <form onSubmit={handleAssign} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Select Doctor</label>
              <select
                required
                value={assignment.doctorId}
                onChange={(e) => setAssignment({ ...assignment, doctorId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.doctorProfile.id} value={d.doctorProfile.id}>
                    {d.name} ({d.doctorProfile.doctorCode} - {d.doctorProfile.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Select Patient</label>
              <select
                required
                value={assignment.patientId}
                onChange={(e) => setAssignment({ ...assignment, patientId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.patientProfile.id} value={p.patientProfile.id}>
                    {p.name} ({p.patientProfile.patientCode})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-extrabold text-xs shadow-md"
            >
              Establish Zero Trust Doctor-Patient Relationship
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
}
