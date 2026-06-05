'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Lock, Unlock, LogOut, User as UserIcon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/', label: 'DASHBOARD' },
  { href: '/plan', label: 'DAILY PLAN' },
  { href: '/stock', label: 'STOCK DATA' },
  { href: '/dispatch', label: 'VEHICLE DISPATCH' },
  { href: '/reports', label: 'REPORTS' },
];

export function Navbar() {
  const pathname = usePathname();
  const { vehicleStatuses, isReadOnly, toggleReadOnly, isPreviewMode, togglePreviewMode, user, logout } = useApp();
  const [currentDate, setCurrentDate] = useState<string>("LOADING...");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
  }, []);

  const dispatchedCount = Object.values(vehicleStatuses || {}).filter(v => v?.isDispatched).length;

  if (!user) return null;

  return (
    <header className="w-full bg-[#030712] border-b border-[#1f2937] py-4 shrink-0 shadow-2xl z-[100]">
      <div className="w-full px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="bg-[#1e293b] p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <div>
              <h1 className="font-headline text-xl font-black tracking-[0.2em] text-white uppercase leading-none">
                Kalyani DISPATCH STOCK TRACKER
              </h1>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-1.5">
                {currentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <div className="bg-[#3b82f6]/20 p-1.5 rounded-lg">
                  <UserIcon className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{user.userId}</span>
                  <Badge className={cn(
                    "mt-1 text-[6px] px-1.5 py-0 rounded-sm font-black tracking-[0.2em] w-fit",
                    user.role === 'ADMIN' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  )}>
                    {user.role}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="ml-2 h-7 w-7 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
             </div>

             <div className="bg-[#0f172a] border border-[#1e293b] px-4 py-2 rounded-xl flex items-center gap-4 shadow-inner">
                <div className="flex items-baseline gap-2">
                  <span className="text-[#f59e0b] font-black text-3xl leading-none font-headline">{dispatchedCount}</span>
                  <span className="text-slate-500 text-[10px] font-black">/ 3</span>
                </div>
                <div className="h-5 w-[1px] bg-slate-700" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">VEHICLES<br/>OUT</p>
             </div>

             <div className="flex gap-2">
               <Button 
                variant={isReadOnly ? "outline" : "default"} 
                size="sm" 
                onClick={toggleReadOnly} 
                disabled={user.role === 'VIEWER' || isPreviewMode} 
                className={cn(
                  "h-7 px-3 font-black uppercase text-[8px] tracking-widest gap-1.5 rounded-lg border transition-all", 
                  isReadOnly ? "border-amber-500/50 text-amber-500 hover:bg-amber-500/10" : "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent shadow-lg"
                )}
               >
                 {isReadOnly ? <><Lock className="w-3 h-3" />EDIT</> : <><Unlock className="w-3 h-3" />LOCK</>}
               </Button>

               <Button variant="outline" size="sm" onClick={togglePreviewMode} 
                className="h-7 px-3 font-black uppercase text-[8px] tracking-widest gap-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-[#3b82f6] hover:text-white transition-all shadow-lg"
               >
                 <Monitor className="w-3 h-3" /> PREVIEW
               </Button>
             </div>
          </div>
        </div>

        <nav className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button className={cn("pb-2 text-base font-black tracking-[0.2em] uppercase transition-all border-b-2", pathname === item.href ? "text-[#3b82f6] border-[#3b82f6]" : "text-slate-500 border-transparent hover:text-white")}>
                {item.label}
              </button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
