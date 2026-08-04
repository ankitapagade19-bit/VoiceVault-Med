import React from 'react';
import { 
  FaMicrophoneAlt, FaClipboardList, FaLink, FaShieldAlt, 
  FaCheckCircle, FaHistory, FaDatabase
} from 'react-icons/fa';
import Sidebar from '@/components/Sidebar';

const AuditPage = () => {
  const auditTrail = [
    { recordId: '#R-3821', version: 'v.4', hash: 'a4f8...3d1e', action: 'Correction approved', timestamp: '2026-08-04 09:23' },
    { recordId: '#R-3821', version: 'v.3', hash: 'b9e2...7f4a', action: 'Voice pinning', timestamp: '2026-08-03 16:10' },
    { recordId: '#R-2740', version: 'v.2', hash: 'c81d...9b2f', action: 'Staff update', timestamp: '2026-08-02 11:45' },
    { recordId: '#R-2740', version: 'v.1', hash: 'e3f0...6a8c', action: 'Initial record', timestamp: '2026-07-30 08:12' },
  ];

  const stats = [
    { num: '1,247', label: 'Total Versions', icon: FaHistory },
    { num: '384', label: 'Unique Records', icon: FaDatabase },
    { num: '100%', label: 'Chain Integrity', icon: FaShieldAlt },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="audit" />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-3">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
              <FaClipboardList />
            </span>
            Audit · Immutable Chain
          </h1>
          <span className="bg-white px-4 py-2 rounded-full border border-blue-200 text-blue-700 font-medium flex items-center gap-2">
            <FaCheckCircle className="text-green-500" /> Verified
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-300 transition-shadow shadow-sm">
              <div className="text-2xl font-semibold text-blue-800">{stat.num}</div>
              <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <stat.icon className="text-blue-500" /> {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Audit Trail Table */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-50 text-blue-600 p-2 rounded-full">
              <FaLink />
            </span>
            Version History & SHA-256 Hashes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-gray-200">
                  <th className="py-3 pr-4 font-semibold">Record ID</th>
                  <th className="py-3 pr-4 font-semibold">Version</th>
                  <th className="py-3 pr-4 font-semibold">SHA-256 Hash</th>
                  <th className="py-3 pr-4 font-semibold">Action</th>
                  <th className="py-3 pr-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-blue-50/30 transition">
                    <td className="py-3 pr-4 font-medium">{item.recordId}</td>
                    <td className="py-3 pr-4">
                      <span className="bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-700">{item.version}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <code className="bg-gray-100 px-3 py-1 rounded text-xs font-mono">{item.hash}</code>
                    </td>
                    <td className="py-3 pr-4">{item.action}</td>
                    <td className="py-3 pr-4 text-gray-600">{item.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Chain Integrity Badge */}
          <div className="mt-4 bg-blue-50 px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm text-blue-700">
            <FaLink className="text-blue-500" /> Chain integrity: <strong>verified</strong> · SHA-256
          </div>
        </div>

        {/* Security Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-50 text-blue-600 p-2 rounded-full">
              <FaShieldAlt />
            </span>
            Cryptographic Guarantees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-500">
              <div className="font-semibold text-blue-800 flex items-center gap-2">
                <FaLink className="text-blue-500" /> Immutable History
              </div>
              <div className="text-sm text-gray-600 mt-1">Records never overwritten; new versions linked to prior hash</div>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-500">
              <div className="font-semibold text-blue-800 flex items-center gap-2">
                <FaShieldAlt className="text-blue-500" /> SHA-256 Chain
              </div>
              <div className="text-sm text-gray-600 mt-1">Deterministic hashing; tampering breaks the chain</div>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border-l-4 border-blue-500">
              <div className="font-semibold text-blue-800 flex items-center gap-2">
                <FaDatabase className="text-blue-500" /> IPFS Pinning
              </div>
              <div className="text-sm text-gray-600 mt-1">Voice consultations stored with immutable CIDs</div>
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500 border-t border-gray-200 pt-4 mt-6">
          <FaMicrophoneAlt className="inline text-blue-500 mr-1" /> VoiceVault Med · cryptographically verified
        </div>
      </main>
    </div>
  );
};

export default AuditPage;