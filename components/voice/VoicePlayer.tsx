'use client';

import React from 'react';
import { Volume2, ExternalLink, FileAudio, Calendar, HardDrive } from 'lucide-react';
import { formatDate, formatFileSize, formatHash } from '@/lib/utils';
import { getIpfsAudioUrl } from '@/lib/ipfs-client';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export interface VoiceConsultationItem {
  id: string;
  recordId: string;
  ipfsCid: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  duration?: number | null;
  fileHash: string;
  createdAt: string | Date;
  doctor?: {
    user: {
      name: string;
    };
  };
}

interface VoicePlayerProps {
  consultations: VoiceConsultationItem[];
}

export function VoicePlayer({ consultations }: VoicePlayerProps) {
  if (!consultations || consultations.length === 0) {
    return (
      <EmptyState
        title="No voice consultations recorded"
        description="Doctors can capture audio consultations during clinical examinations."
        icon={FileAudio}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">IPFS Voice Consultations</h3>
        </div>
        <Badge variant="info">{consultations.length} File(s) Pinned</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {consultations.map((item) => {
          const audioUrl = getIpfsAudioUrl(item.ipfsCid);

          return (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <FileAudio className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.fileName}</h4>
                    <p className="text-xs text-slate-500">
                      Doctor: {item.doctor?.user?.name || 'Authorized Practitioner'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(item.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    {formatFileSize(item.fileSize)}
                  </span>
                </div>
              </div>

              {/* Audio Controls */}
              <audio controls src={audioUrl} className="w-full rounded-lg h-10" />

              {/* Cryptographic Metadata Footer */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-1 text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong className="text-blue-700">IPFS CID:</strong> {formatHash(item.ipfsCid, 14, 8)}
                  </span>
                  <a
                    href={audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <span>Stream Audio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-500">SHA-256 Audio Hash:</span>{' '}
                  <code className="text-emerald-700 font-semibold">{formatHash(item.fileHash, 12, 10)}</code>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
