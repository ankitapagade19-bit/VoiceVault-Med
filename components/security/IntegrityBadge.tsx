import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface IntegrityBadgeProps {
  status: 'VERIFIED' | 'TAMPER_DETECTED' | 'BROKEN_CHAIN' | 'INVALID_VERSION_SEQUENCE' | 'PENDING';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function IntegrityBadge({ status, message, size = 'md' }: IntegrityBadgeProps) {
  if (status === 'VERIFIED') {
    return (
      <Badge variant="success" className={size === 'lg' ? 'text-sm py-1.5 px-3' : ''}>
        <ShieldCheck className={size === 'lg' ? 'w-4 h-4 text-emerald-400' : 'w-3.5 h-3.5 text-emerald-400'} />
        <span>Cryptographically Verified (SHA-256)</span>
      </Badge>
    );
  }

  if (status === 'TAMPER_DETECTED' || status === 'BROKEN_CHAIN') {
    return (
      <Badge variant="danger" className={size === 'lg' ? 'text-sm py-1.5 px-3 glow-crimson' : ''}>
        <ShieldAlert className={size === 'lg' ? 'w-4 h-4 text-red-400' : 'w-3.5 h-3.5 text-red-400'} />
        <span>Integrity Warning: {status === 'TAMPER_DETECTED' ? 'Tamper Detected' : 'Broken Chain'}</span>
      </Badge>
    );
  }

  if (status === 'INVALID_VERSION_SEQUENCE') {
    return (
      <Badge variant="warning" className={size === 'lg' ? 'text-sm py-1.5 px-3' : ''}>
        <AlertTriangle className={size === 'lg' ? 'w-4 h-4 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
        <span>Invalid Version Sequence</span>
      </Badge>
    );
  }

  return (
    <Badge variant="default">
      <Lock className="w-3.5 h-3.5 text-slate-400" />
      <span>Integrity Unverified</span>
    </Badge>
  );
}
