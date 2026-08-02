import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { VoicePlayer } from '@/components/voice/VoicePlayer';
import { Mic, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { redirect } from 'next/navigation';

export default async function DoctorVoicePage() {
  const session = await getSession();
  const auth = await requireRole(session, ['DOCTOR']);
  if (!auth.authorized || !session?.doctorProfileId) redirect('/login');

  const consultations = await prisma.voiceConsultation.findMany({
    where: { doctorId: session.doctorProfileId },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: { include: { user: { select: { name: true } } } },
      doctor: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="DOCTOR" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">IPFS Voice Consultation Repository</h1>
            <p className="text-xs text-slate-400">
              Decentralized audio consultations pinned to IPFS with stored SHA-256 file hashes
            </p>
          </div>
          <Badge variant="purple">{consultations.length} Consultation(s) Pinned</Badge>
        </div>

        <VoicePlayer consultations={consultations} />
      </div>
    </div>
  );
}
