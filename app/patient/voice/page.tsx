import React from 'react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/authorization';
import { Sidebar } from '@/components/layout/Sidebar';
import { VoicePlayer } from '@/components/voice/VoicePlayer';
import { Mic } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { redirect } from 'next/navigation';

export default async function PatientVoicePage() {
  const session = await getSession();
  const auth = await requireRole(session, ['PATIENT']);
  if (!auth.authorized || !session?.patientProfileId) redirect('/login');

  const consultations = await prisma.voiceConsultation.findMany({
    where: { patientId: session.patientProfileId },
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="PATIENT" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-100">My IPFS Voice Consultations</h1>
            <p className="text-xs text-slate-400">
              Listen to audio recordings of consultations pinned to IPFS
            </p>
          </div>
          <Badge variant="purple">{consultations.length} Available File(s)</Badge>
        </div>

        <VoicePlayer consultations={consultations} />
      </div>
    </div>
  );
}
