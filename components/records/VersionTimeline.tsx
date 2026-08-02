'use client';

import React, { useState } from 'react';
import { History, Key, FileText, UserCheck, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, formatHash } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface RecordVersionItem {
  id: string;
  versionNumber: number;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  previousHash: string | null;
  currentHash: string;
  versionReason: string;
  createdAt: string | Date;
  createdBy?: {
    name: string;
    role: string;
  };
}

interface VersionTimelineProps {
  versions: RecordVersionItem[];
  currentVersionNumber: number;
}

export function VersionTimeline({ versions, currentVersionNumber }: VersionTimelineProps) {
  const [expandedHashes, setExpandedHashes] = useState<Record<string, boolean>>({});

  const toggleHash = (versionId: string) => {
    setExpandedHashes((prev) => ({ ...prev, [versionId]: !prev[versionId] }));
  };

  // Sort versions descending (latest first)
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Immutable Record Version Timeline</h3>
        </div>
        <Badge variant="info">
          <span>{versions.length} Version(s) Recorded</span>
        </Badge>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {sortedVersions.map((v) => {
          const isLatest = v.versionNumber === currentVersionNumber;
          const isExpanded = expandedHashes[v.id];

          return (
            <div key={v.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                  isLatest
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 border-slate-300 text-slate-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-white' : 'bg-slate-400'}`} />
              </div>

              <div
                className={`bg-white p-5 rounded-xl border transition-all shadow-sm ${
                  isLatest ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {/* Version Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-slate-900">
                      Version {v.versionNumber}
                    </span>
                    {isLatest ? (
                      <Badge variant="success">Current / Active</Badge>
                    ) : (
                      <Badge variant="default">Historical Version</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(v.createdAt)}
                    </span>
                    {v.createdBy && (
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        {v.createdBy.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Revision Context */}
                <div className="mt-3 py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-900">Revision Reason:</strong> {v.versionReason}
                  </span>
                </div>

                {/* Clinical Content Grid */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Symptoms
                    </span>
                    <p className="text-slate-800 leading-relaxed">{v.symptoms}</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Diagnosis
                    </span>
                    <p className="text-slate-900 font-semibold leading-relaxed">{v.diagnosis}</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Prescription / Treatment
                    </span>
                    <p className="text-blue-700 font-bold leading-relaxed">{v.prescription}</p>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Clinical Notes
                    </span>
                    <p className="text-slate-700 leading-relaxed">{v.notes}</p>
                  </div>
                </div>

                {/* Cryptographic Hash Details Accordion */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => toggleHash(v.id)}
                    className="flex items-center justify-between w-full text-xs text-slate-500 hover:text-blue-600 transition-colors py-1"
                  >
                    <span className="flex items-center gap-1.5 font-mono">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      SHA-256 Hash Chain Proof (Current: {formatHash(v.currentHash, 6, 6)})
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-900 font-mono text-xs space-y-2 text-slate-200 animate-in fade-in duration-150">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Previous Version Hash (previousHash):</span>
                        <code className="text-amber-300 bg-slate-800 px-2 py-0.5 rounded block break-all">
                          {v.previousHash || 'GENESIS_NULL (Version 1 Root)'}
                        </code>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Computed Version Hash (currentHash):</span>
                        <code className="text-emerald-400 bg-slate-800 px-2 py-0.5 rounded block break-all">
                          {v.currentHash}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
