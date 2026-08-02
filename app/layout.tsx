import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'VoiceVault Med — Secure. Verified. Trusted.',
  description:
    'VoiceVault Med is an immutable, voice-enabled Electronic Health Record platform powered by SHA-256 hash-chains, decentralized IPFS audio storage, Zero Trust authorization, and patient correction versioning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto">{children}</main>
        <footer className="border-t border-slate-800 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-semibold text-slate-400">
              VoiceVault Med © 2026 — Cryptographically Verified Electronic Health Record Architecture
            </p>
            <p className="text-[11px] text-slate-500 max-w-3xl mx-auto">
              VoiceVault Med is a secure clinical records platform with role-based access, immutable version history, and cryptographic verification for authorized institutional workflows.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
