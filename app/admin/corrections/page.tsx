import React, { useState } from 'react';
import { 
  FaMicrophoneAlt, FaPenFancy, FaCheckCircle, FaTimesCircle, 
  FaClock, FaUser, FaCalendarAlt, FaInfoCircle
} from 'react-icons/fa';
import Sidebar from '@/components/Sidebar';

const CorrectionsPage = () => {
  const [corrections, setCorrections] = useState([
    { 
      id: '#C-042', 
      patient: 'Elena Vasquez', 
      request: 'Update allergy record', 
      description: 'Patient reports new penicillin allergy discovered during recent consultation.',
      status: 'Pending', 
      submitted: '2026-08-03',
      priority: 'High'
    },
    { 
      id: '#C-039', 
      patient: 'James Carter', 
      request: 'Correct lab result', 
      description: 'Lab results for lipid panel show incorrect values due to sample mix-up.',
      status: 'Review', 
      submitted: '2026-08-02',
      priority: 'Medium'
    },
    { 
      id: '#C-035', 
      patient: 'Maya Iyer', 
      request: 'Voice consult pinning', 
      description: 'Request to pin voice consultation recording for specialist review.',
      status: 'Pending', 
      submitted: '2026-08-01',
      priority: 'Low'
    },
    { 
      id: '#C-031', 
      patient: 'Thomas Wright', 
      request: 'Update contact information', 
      description: 'Patient\'s phone number and address have changed.',
      status: 'Approved', 
      submitted: '2026-07-30',
      priority: 'Low'
    },
  ]);

  const handleApprove = (id: string) => {
    setCorrections(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: 'Approved' } : item
      )
    );
  };

  const handleReject = (id: string) => {
    setCorrections(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: 'Rejected' } : item
      )
    );
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";
    const statusMap: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Review': 'bg-orange-100 text-orange-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return `${baseClasses} ${statusMap[status] || 'bg-blue-100 text-blue-800'}`;
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium";
    const priorityMap: Record<string, string> = {
      'High': 'bg-red-100 text-red-700',
      'Medium': 'bg-orange-100 text-orange-700',
      'Low': 'bg-blue-100 text-blue-700',
    };
    return `${baseClasses} ${priorityMap[priority] || 'bg-gray-100 text-gray-700'}`;
  };

  const pendingCount = corrections.filter(c => c.status === 'Pending' || c.status === 'Review').length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="corrections" />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap">
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-3">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
              <FaPenFancy />
            </span>
            Corrections · Workflow
          </h1>
          <div className="flex items-center gap-3">
            <span className="bg-white px-4 py-2 rounded-full border border-blue-200 text-blue-700 font-medium flex items-center gap-2">
              <FaClock className="text-blue-500" /> {pendingCount} pending
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-semibold text-blue-800">{pendingCount}</div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <FaClock className="text-yellow-500" /> Pending Review
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-semibold text-green-800">
              {corrections.filter(c => c.status === 'Approved').length}
            </div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" /> Approved
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-2xl font-semibold text-red-800">
              {corrections.filter(c => c.status === 'Rejected').length}
            </div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <FaTimesCircle className="text-red-500" /> Rejected
            </div>
          </div>
        </div>

        {/* Corrections Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {corrections.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-800">{item.id}</span>
                    <span className={getPriorityBadge(item.priority)}>{item.priority}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaUser className="text-blue-500" /> {item.patient}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt className="text-blue-500" /> {item.submitted}
                    </span>
                  </div>
                </div>
                <span className={getStatusBadge(item.status)}>{item.status}</span>
              </div>
              
              <div className="mb-3">
                <div className="font-medium text-gray-800">{item.request}</div>
                <div className="text-sm text-gray-600 mt-1 flex items-start gap-2">
                  <FaInfoCircle className="text-blue-400 mt-0.5" />
                  {item.description}
                </div>
              </div>

              {(item.status === 'Pending' || item.status === 'Review') && (
                <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle /> Approve
                  </button>
                  <button 
                    onClick={() => handleReject(item.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <FaTimesCircle /> Reject
                  </button>
                </div>
              )}
              
              {item.status === 'Approved' && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-green-600 flex items-center gap-2">
                  <FaCheckCircle /> Approved on {new Date().toLocaleDateString()}
                </div>
              )}
              
              {item.status === 'Rejected' && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-red-600 flex items-center gap-2">
                  <FaTimesCircle /> Rejected
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-right text-xs text-gray-500 border-t border-gray-200 pt-4 mt-8">
          <FaMicrophoneAlt className="inline text-blue-500 mr-1" /> VoiceVault Med · cryptographically verified
        </div>
      </main>
    </div>
  );
};

export default CorrectionsPage;