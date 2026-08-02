'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface TrustScoreBadgeProps {
  score: number;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'COMPROMISED';
  size?: 'sm' | 'lg';
}

const gradeConfig = {
  EXCELLENT: { variant: 'success' as const, icon: ShieldCheck, color: 'text-emerald-400' },
  GOOD: { variant: 'success' as const, icon: ShieldCheck, color: 'text-emerald-300' },
  FAIR: { variant: 'warning' as const, icon: AlertTriangle, color: 'text-amber-400' },
  POOR: { variant: 'warning' as const, icon: AlertTriangle, color: 'text-orange-400' },
  COMPROMISED: { variant: 'danger' as const, icon: ShieldAlert, color: 'text-red-400' },
};

export function TrustScoreBadge({ score, grade, size = 'sm' }: TrustScoreBadgeProps) {
  const config = gradeConfig[grade] || gradeConfig.COMPROMISED;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
      <Icon className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${config.color}`} />
      <Badge variant={config.variant}>
        Trust Score: {score}/100 ({grade})
      </Badge>
    </div>
  );
}
