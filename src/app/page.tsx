'use client';

import { useApp } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { KPICards } from '@/components/dashboard/KPICards';
import { LiveDashboard } from '@/components/dashboard/LiveDashboard';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { isLoading, stocks } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full flex flex-col p-3 gap-3 overflow-hidden relative">
        {!isMounted || (isLoading && stocks.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-700">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Factory...</span>
          </div>
        ) : (
          <>
            <KPICards />
            <div className="flex-1 flex flex-col min-h-0">
              <LiveDashboard />
            </div>
          </>
        )}
      </main>
    </div>
  );
}