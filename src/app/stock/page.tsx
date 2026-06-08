'use client';

import { useApp } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Lock, Unlock, Box, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BIN_MULTIPLIERS } from '@/lib/constants';

function StockCard({ 
  stock, 
  index, 
  isReadOnly, 
  updateBinCount 
}: { 
  stock: any; 
  index: number; 
  isReadOnly: boolean; 
  updateBinCount: (partNumber: string, binCount: number) => void;
}) {
  const [localBinCount, setLocalBinCount] = useState<string>(stock.binCount?.toString() || "0");
  const isFocusedRef = useRef(false);
  const multiplier = BIN_MULTIPLIERS[stock.partNumber] || 1;
  const hasPlan = (stock.plannedDispatch || 0) > 0;
  const isShort = hasPlan && stock.pdiStock < stock.plannedDispatch;

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalBinCount(stock.binCount?.toString() || "0");
    }
  }, [stock.binCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const val = e.target.value;
    setLocalBinCount(val);
    const numericVal = val === "" ? 0 : parseInt(val);
    if (!isNaN(numericVal)) {
      updateBinCount(stock.partNumber, numericVal);
    }
  };

  return (
    <Card className={cn(
      "border-border bg-card rounded-2xl overflow-hidden shadow-xl transition-all border-2 hover:border-primary/30"
    )}>
      <CardHeader className="py-3 px-4 border-b border-border bg-accent">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-700 font-headline uppercase">SL {index + 1}</span>
            <span className="font-headline font-black text-xl text-primary tracking-[0.1em] bg-primary/10 px-2.5 py-1 rounded-xl">
              {stock.partNumber}
            </span>
          </div>
          {hasPlan ? (
            <Badge className={cn("text-[8px] px-2 py-0.5 rounded-md font-black tracking-widest", isShort ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
              {isShort ? "SHORT" : "OK"}
            </Badge>
          ) : (
            <Badge className="bg-muted text-muted-foreground text-[8px] px-2 py-0.5 rounded-md font-black tracking-widest border border-border">
              STANDBY
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">NO. OF BINS</p>
            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">x{multiplier} / BIN</span>
          </div>
          <div className="relative">
            <Box className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isReadOnly ? "text-slate-700" : "text-slate-600")} />
            <Input 
              type="number" 
              placeholder="0"
              value={localBinCount} 
              disabled={isReadOnly}
              onFocus={() => { isFocusedRef.current = true; }}
              onBlur={() => { isFocusedRef.current = false; }}
              onChange={handleChange}
              className="h-16 pl-10 text-5xl font-black text-center bg-black/60 font-headline border-white/10 rounded-xl focus-visible:ring-primary text-white disabled:!text-white disabled:opacity-100" text-white disabled:!text-white disabled:opacity-100"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-dashed border-border">
          <div className="flex justify-between items-center">
             <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">TOTAL STOCK</span>
             <span className="text-2xl font-black font-headline text-emerald-500 leading-none">{stock.pdiStock}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
             <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">TARGET: {stock.plannedDispatch || 0}</span>
             {hasPlan && (
               <span className={cn("text-[10px] font-black font-headline", isShort ? "text-red-500" : "text-emerald-500/60")}>
                {stock.pdiStock - stock.plannedDispatch >= 0 ? '+' : ''}{stock.pdiStock - stock.plannedDispatch}
               </span>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StockDataModule() {
  const { stocks, updateBinCount, isReadOnly, isLoading } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || (isLoading && stocks.length === 0)) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing...</span>
      </div>
    );
  }

  const indexedStocks = stocks.map((s, index) => ({ ...s, index }));

  const handleSave = () => {
    if (isReadOnly) return;
    toast({ title: "Inventory Committed", description: "PDI Area stock levels updated based on bin audit." });
  };

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 overflow-hidden">
      <header className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border shadow-2xl shrink-0 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-headline font-black text-foreground uppercase tracking-[0.4em]">STOCK DATA</h1>
              {isReadOnly ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">AUDIT PHYSICAL PDI QUANTITIES BY BIN COUNT (SL NO INCLUDED)</p>
          </div>
          {!isReadOnly && (
            <Button onClick={handleSave} className="bg-primary text-white font-black uppercase text-[10px] h-9 px-6 rounded-lg shadow-lg gap-2">
              <Save className="w-4 h-4" />COMMIT SNAPSHOT
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 pb-20">
          {indexedStocks.map((stock) => (
            <StockCard 
              key={stock.partNumber} 
              stock={stock} 
              index={stock.index} 
              isReadOnly={isReadOnly} 
              updateBinCount={updateBinCount} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StockPage() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <StockDataModule />
      </main>
    </div>
  );
}
