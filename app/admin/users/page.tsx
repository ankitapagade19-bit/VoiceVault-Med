import React, { useState } from 'react';
import { 
  FaMicrophoneAlt, FaUsersCog, FaUserPlus, FaUserEdit, 
  FaUserMinus, FaCheckCircle, FaTimesCircle, FaSearch,
  FaUserMd, FaUserNurse, FaUserInjured, FaFilter
} from 'react-icons/fa';
import Sidebar from '@/components/Sidebar';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Doctor' | 'Staff' | 'Patient' | 'Admin';
  status: 'Active' | 'Inactive' | 'Suspended';
  department: string;
  lastActive: string;
  assignedPatients?: number;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Dr. Sarah Lin', email: 'sarah.lin@voicevault.com', role: 'Doctor', status: 'Active', department: 'Cardiology', lastActive: '2026-08-04', assignedPatients: 24 },
    { id: 2, name: 'Michael Torres', email: 'michael.torres@voicevault.com', role: 'Staff', status: 'Active', department: 'Administration', lastActive: '2026-08-03', assignedPatients: 0 },
    { id: 3, name: 'Priya Sharma', email: 'priya.sharma@voicevault.com', role: 'Patient', status: 'Inactive', department: 'N/A', lastActive: '2026-07-28', assignedPatients: 0 },
    { id: 4, name: 'Dr. Omar Hassan', email: 'omar.hassan@voicevault.com', role: 'Doctor', status: 'Active', department: 'Neurology', lastActive: '2026-08-04', assignedPatients: 18 },
    { id: 5, name: 'Emily Chen', email: 'emily.chen@voicevault.com', role: 'Staff', status: 'Active', department: 'Emergency', lastActive: '2026-08-02', assignedPatients: 0 },
    { id: 6, name: 'Robert Johnson', email: 'robert.johnson@voicevault.com', role: 'Patient', status: 'Active', department: 'N/A', lastActive: '2026-08-01', assignedPatients: 0 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');

  const getRoleIcon = (role: string) => {
    const iconMap: Record<string, any> = {
      'Doctor': FaUserMd,
      'Staff': FaUserNurse,
      'Patient': FaUserInjured,
      'Admin': FaUsersCog,
    };
    return iconMap[role] || FaUserMd;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";
    const statusMap: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Inactive': 'bg-gray-100 text-gray-700',
      'Suspended': 'bg-red-100 text-red-800',
    };
    return `${baseClasses} ${statusMap[status] || 'bg-blue-100 text-blue-800'}`;
  };

  const toggleUserStatus = (id: number) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === id 
          ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
          : user
      )
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    doctors: users.filter(u => u.role === 'Doctor').length,
    staff: users.filter(u => u.role === 'Staff').length,
    patients: users.filter(u => u.role === 'Patient').length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="users" />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-3">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
              <FaUsersCog />
            </span>
            Users · Role-Based Access
          </h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
            <FaUserPlus /> Add User
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-semibold text-blue-800">{stats.total}</div>
            <div className="text-xs text-gray-600 mt-1">Total</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-semibold text-green-800">{stats.active}</div>
            <div className="text-xs text-gray-600 mt-1">Active</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-semibold text-blue-800">{stats.doctors}</div>
            <div className="text-xs text-gray-600 mt-1">Doctors</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-semibold text-blue-800">{stats.staff}</div>
            <div className="text-xs text-gray-600 mt-1">Staff</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="text-2xl font-semibold text-blue-800">{stats.patients}</div>
            <div className="text-xs text-gray-600 mt-1">Patients</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Doctor">Doctor</option>
                <option value="Staff">Staff</option>
                <option value="Patient">Patient</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-200">
                  <th className="py-3 pr-4 font-semibold">User</th>
                  <th className="py-3 pr-4 font-semibold">Role</th>
                  <th className="py-3 pr-4 font-semibold">Department</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Last Active</th>
                  <th className="py-3 pr-4 font-semibold">Patients</th>
                  <th className="py-3 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                      <td className="py-3 pr-4">
                        <div>
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-700 w-fit">
                          <RoleIcon className="text-blue-500" /> {user.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{user.department}</td>
                      <td className="py-3 pr-4">
                        <span className={getStatusBadge(user.status)}>{user.status}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{user.lastActive}</td>
                      <td className="py-3 pr-4 text-gray-600">{user.assignedPatients || 0}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition" title="Edit">
                            <FaUserEdit />
                          </button>
                          <button 
                            onClick={() => toggleUserStatus(user.id)}
                            className={`p-2 rounded-full transition ${user.status === 'Active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {user.status === 'Active' ? <FaUserMinus /> : <FaCheckCircle />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500 border-t border-gray-200 pt-4 mt-8">
          <FaMicrophoneAlt className="inline text-blue-500 mr-1" /> VoiceVault Med · cryptographically verified
        </div>
      </main>
    </div>
  );
};

export default UsersPage;