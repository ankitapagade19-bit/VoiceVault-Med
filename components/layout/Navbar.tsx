'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  const fetchSession = useCallback(async () => {
    try {
      // Append timestamp query parameter to bypass browser/disk level HTTP cache completely
      const res = await fetch(`/api/auth/me?ts=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate' 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [pathname, fetchSession]);

  // Handle Browser Back-Forward Cache (bfcache) restoration
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Re-fetch the real active session and revalidate client routing
        fetchSession();
        router.refresh();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [fetchSession, router]);

  const handleLogout = async () => {
    try {
      // Wiping state immediately prevents layout flicker while network request finishes
      setCurrentUser(null);
      localStorage.clear();
      sessionStorage.clear();

      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' }
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      // Hard refresh and redirect clears Next.js router cache
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-700 transition-all">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                VoiceVault <span className="text-blue-600">Med</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold">
                SHA-256 Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Hospital Record Governance & Consultation System
            </p>
          </div>
        </Link>

        {/* Right Side Navigation / Profile */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Role: <strong className="text-blue-600">{currentUser.role}</strong>
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4 text-slate-500" />}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-600 transition-all"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                Portal Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs transition-all"
              >
                Register Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}