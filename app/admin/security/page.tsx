import React from 'react';
import { 
  FaMicrophoneAlt, FaLock, FaShieldAlt, FaLink, 
  FaCloudUploadAlt, FaUserLock, FaCheckCircle, 
  FaDatabase, FaKey, FaServer, FaHistory
} from 'react-icons/fa';
import Sidebar from '@/components/Sidebar';

const SecurityPage = () => {
  const securityFeatures = [
    {
      icon: FaLink,
      title: 'SHA-256 Hash Chain',
      description: 'All versions linked via deterministic hashes. Tampering breaks the chain.',
      status: 'Active'
    },
    {
      icon: FaCloudUploadAlt,
      title: 'IPFS Voice Pinning',
      description: 'Consultations pinned to IPFS with immutable CIDs stored in DB.',
      status: 'Active'
    },
    {
      icon: FaUserLock,
      title: 'Zero Trust RBAC',
      description: 'Every API request checks identity, role, and patient assignment.',
      status: 'Active'
    },
    {
      icon: FaServer,
      title: 'Decentralized Storage',
      description: 'Medical records distributed across IPFS network for redundancy.',
      status: 'Active'
    },
    {
      icon: FaKey,
      title: 'Cryptographic Keys',
      description: 'SHA-256 based signing for all record versions and updates.',
      status: 'Active'
    },
    {
      icon: FaHistory,
      title: 'Immutable Versioning',
      description: 'Medical records are never overwritten; new versions created.',
      status: 'Active'
    },
  ];

  const auditLogs = [
    { event: 'User login', user: 'Dr. Sarah Lin', timestamp: '2026-08-04 10:23:15', status: 'Success' },
    { event: 'Record access', user: 'Michael Torres', timestamp: '2026-08-04 09:45:02', status: 'Success' },
    { event: 'Failed login', user: 'unknown', timestamp: '2026-08-04 08:12:34', status: 'Failed' },
    { event: 'Correction approval', user: 'System Admin', timestamp: '2026-08-03 16:20:00', status: 'Success' },
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";
    const statusMap: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Success': 'bg-green-100 text-green-800',
      'Failed': 'bg-red-100 text-red-800',
      'Inactive': 'bg-gray-100 text-gray-700',
    };
    return `${baseClasses} ${statusMap[status] || 'bg-blue-100 text-blue-800'}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="security" />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-3">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
              <FaLock />
            </span>
            Security · Zero Trust & Integrity
          </h1>
          <div className="flex items-center gap-3">
            <span className="bg-white px-4 py-2 rounded-full border border-green-200 text-green-700 font-medium flex items-center gap-2">
              <FaCheckCircle className="text-green-500" /> All Systems Secure
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-semibold text-green-800">100%</div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <FaShieldAlt className="text-green-500" /> Chain Integrity
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-semibold text-blue-800">1,247</div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <FaDatabase className="text-blue-500" /> Hashed Records
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-semibold text-blue-800">384</div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <FaCloudUploadAlt className="text-blue-500" /> IPFS CIDs
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-semibold text-blue-800">12</div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <FaUserLock className="text-blue-500" /> Active Users
            </div>
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-50 text-blue-600 p-2 rounded-full">
              <FaShieldAlt />
            </span>
            Security Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 hover:border-blue-300 transition">
                <div className="flex items-start gap-3">
                  <feature.icon className="text-blue-600 text-xl mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-800 flex items-center justify-between">
                      {feature.title}
                      <span className={getStatusBadge(feature.status)}>{feature.status}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{feature.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-50 text-blue-600 p-2 rounded-full">
              <FaServer />
            </span>
            Recent Security Events
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-200">
                  <th className="py-3 pr-4 font-semibold">Event</th>
                  <th className="py-3 pr-4 font-semibold">User</th>
                  <th className="py-3 pr-4 font-semibold">Timestamp</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                    <td className="py-3 pr-4 font-medium">{log.event}</td>
                    <td className="py-3 pr-4 text-gray-600">{log.user}</td>
                    <td className="py-3 pr-4 text-gray-600">{log.timestamp}</td>
                    <td className="py-3 pr-4">
                      <span className={getStatusBadge(log.status)}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-gray-100">
            <span className="bg-blue-50 px-4 py-1.5 rounded-full text-xs text-blue-700 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" /> Cryptographic proofs: enabled
            </span>
            <span className="bg-blue-50 px-4 py-1.5 rounded-full text-xs text-blue-700 flex items-center gap-2">
              <FaHistory /> Version history: immutable
            </span>
            <span className="bg-blue-50 px-4 py-1.5 rounded-full text-xs text-blue-700 flex items-center gap-2">
              <FaShieldAlt /> Zero trust: active
            </span>
            <span className="ml-auto text-xs text-gray-500">
              Last audit: 2026-08-04 10:15 UTC
            </span>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500 border-t border-gray-200 pt-4 mt-8">
          <FaMicrophoneAlt className="inline text-blue-500 mr-1" /> VoiceVault Med · cryptographically verified
        </div>
      </main>
    </div>
  );
};

export default SecurityPage;