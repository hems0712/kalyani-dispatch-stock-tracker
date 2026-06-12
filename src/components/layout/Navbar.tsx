
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, Unlock, LogOut, User as UserIcon, Monitor, RefreshCw, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const KalyaniLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="kalyaniGrad" cx="50%" cy="50%" r="50%" fx="75%" fy="25%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </radialGradient>
      <clipPath id="logoClipNav">
        <circle cx="50" cy="50" r="48" />
      </clipPath>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#kalyaniGrad)" />
    <g clipPath="url(#logoClipNav)">
      <path 
        d="M84 16 L2 50 L84 84" 
        stroke="white" 
        strokeWidth="18" 
        strokeLinecap="butt" 
        strokeLinejoin="miter" 
      />
    </g>
  </svg>
);

const navItems = [
  { href: '/', label: 'DASHBOARD' },
  { href: '/plan', label: 'DAILY PLAN' },
  { href: '/stock', label: 'STOCK DATA' },
  { href: '/dispatch', label: 'VEHICLE DISPATCH' },
  { href: '/reports', label: 'REPORTS' },
];

export function Navbar() {
  const pathname = usePathname();
  const { vehicleStatuses, isReadOnly, toggleReadOnly, isPreviewMode, togglePreviewMode, user, logout, resetDailyData, theme, toggleTheme } = useApp();
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const year = now.getFullYear();
    setCurrentDate(`${dayName}, ${day} ${month} ${year}`);
  }, []);

  const dispatchedCount = Object.values(vehicleStatuses || {}).filter(v => v?.isDispatched).length;

  if (!user) return null;

  return (
    <header className="w-full bg-background border-b border-border pt-2 pb-0 shrink-0 shadow-sm z-[100]">
      <div className="w-full px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <KalyaniLogo className="w-10 h-10 drop-shadow-md" />
            <div className="space-y-0.5">
              <h1 className="font-headline text-3xl font-black tracking-[0.05em] text-foreground uppercase leading-none">
                KALYANI DISPATCH STOCK TRACKER
              </h1>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] leading-none">
                {currentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
             <div className="flex gap-1 items-center">
               <Button 
                variant="outline"
                size="sm" 
                onClick={toggleTheme}
                className="h-7 w-7 p-0 font-black border-border bg-accent text-foreground hover:bg-accent/80 rounded transition-all shadow-sm"
               >
                 {theme === 'dark' ? <Sun className="w-2.5 h-2.5" /> : <Moon className="w-2.5 h-2.5" />}
               </Button>

               {user.role === 'ADMIN' && (
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button variant="outline" size="sm" className="h-7 border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 font-black uppercase text-[7px] tracking-widest gap-1 px-2">
                       <RefreshCw className="w-2.5 h-2.5" /> RESET
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent className="bg-background border-border text-foreground">
                     <AlertDialogHeader>
                       <AlertDialogTitle className="font-headline text-lg uppercase tracking-widest">Confirm Daily Reset</AlertDialogTitle>
                       <AlertDialogDescription className="text-muted-foreground">
                         Permanently clear all vehicle loads, plans, and shipped quantities for the current shift.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel className="bg-accent border-border text-foreground hover:bg-accent/80">CANCEL</AlertDialogCancel>
                       <AlertDialogAction onClick={resetDailyData} className="bg-destructive hover:bg-destructive/90 text-white font-black">RESET DATA</AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               )}
             </div>

             <div className="flex items-center gap-2 bg-accent px-2 py-1 rounded border border-border shadow-sm">
                <div className="bg-primary/20 p-0.5 rounded">
                  <UserIcon className="w-2.5 h-2.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-foreground uppercase tracking-widest leading-none">{user.userId}</span>
                  <Badge className={cn(
                    "mt-0.5 text-[5px] px-1 py-0 rounded-sm font-black tracking-widest w-fit",
                    user.role === 'ADMIN' ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                  )}>
                    {user.role}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} className="ml-1 h-5 w-5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded">
                  <LogOut className="w-2.5 h-2.5" />
                </Button>
             </div>

             <div className="bg-card border border-border px-3 py-1 rounded flex items-center gap-2 shadow-sm">
                <div className="flex items-baseline gap-1">
                  <span className="text-amber-500 font-black text-xl leading-none font-headline">{dispatchedCount}</span>
                  <span className="text-muted-foreground text-[8px] font-black">/ 4</span>
                </div>
                <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-tight">VEHICLES<br/>OUT</p>
             </div>

             <div className="flex gap-1 items-center">
               <Button 
                variant="outline"
                size="sm" 
                onClick={toggleReadOnly} 
                disabled={user.role === 'VIEWER' || isPreviewMode} 
                className={cn(
                  "h-7 px-2 font-black uppercase text-[8px] tracking-widest gap-1 rounded border transition-all", 
                  isReadOnly 
                    ? "bg-red-600/10 text-red-500 border-red-500/30 hover:bg-red-600/20" 
                    : "bg-emerald-600/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-600/20"
                )}
               >
                 {isReadOnly ? <><Lock className="w-2.5 h-2.5 text-red-500" /> LOCK</> : <><Unlock className="w-2.5 h-2.5 text-emerald-500" /> UNLOCK</>}
               </Button>

               <Button variant="outline" size="sm" onClick={togglePreviewMode} 
                className="h-7 px-2 font-black uppercase text-[8px] tracking-widest gap-1 rounded border border-border bg-accent text-foreground hover:bg-primary hover:text-white transition-all shadow-sm"
               >
                 <Monitor className="w-2.5 h-2.5" /> PREVIEW
               </Button>
             </div>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button className={cn(
                "pb-2 text-[16px] font-black tracking-[0.15em] uppercase transition-all border-b-[3px]", 
                pathname === item.href 
                  ? "text-primary border-primary" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}>
                {item.label}
              </button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
