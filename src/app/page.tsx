'use client';

import { useApp } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { KPICards } from '@/components/dashboard/KPICards';
import { LiveDashboard } from '@/components/dashboard/LiveDashboard';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { isLoading } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  return (
    <div className="h-screen flex flex-col bg-[#030712] overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full flex flex-col p-4 gap-4 overflow-hidden relative">
        {!isMounted || isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing...</span>
          </div>
        ) : (
          <>
            <KPICards />
            <LiveDashboard />
          </>
        )}
      </main>
    </div>
  );
}
