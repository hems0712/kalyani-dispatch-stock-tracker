'use client';

import { useApp, type PartStock } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Lock, Unlock, Box, Loader2, History, QrCode, ScanLine } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BIN_MULTIPLIERS } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

function StockCard({ 
  stock, 
  index, 
  isReadOnly, 
  updateBinCount,
  onShowHistory
}: { 
  stock: PartStock; 
  index: number; 
  isReadOnly: boolean; 
  updateBinCount: (partNumber: string, binCount: number) => void;
  onShowHistory: (partNumber: string) => void;
}) {
  const [localBinCount, setLocalBinCount] = useState<string>(stock.binCount?.toString() || "0");
  const isFocusedRef = useRef(false);
  const multiplier = BIN_MULTIPLIERS[stock.partNumber] || 1;
  const hasPlan = (stock.plannedDispatch || 0) > 0;
  
  const projectedStock = (Number(stock.pdiStock) || 0) + ((Number(stock.binCount) || 0) * multiplier);
  const isShort = hasPlan && projectedStock < stock.plannedDispatch;

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalBinCount(stock.binCount?.toString() || "0");
    }
  }, [stock.binCount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const val = e.target.value;
    const numericVal = val === "" ? 0 : parseInt(val);
    
    if (!isNaN(numericVal)) {
      const validatedVal = Math.max(0, numericVal);
      setLocalBinCount(validatedVal.toString());
      updateBinCount(stock.partNumber, validatedVal);
    } else if (val === "") {
      setLocalBinCount("");
      updateBinCount(stock.partNumber, 0);
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
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onShowHistory(stock.partNumber)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
            >
              <History className="w-3.5 h-3.5" />
            </Button>
            {hasPlan ? (
              <Badge className={cn("text-[8px] px-2 py-0.5 rounded-md font-black tracking-widest", isShort ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
                {isShort ? "SHORT" : "OK"}
              </Badge>
            ) : (
              <Badge className="bg-muted text-muted-foreground text-[8px] px-2 py-0.5 rounded-md font-black tracking-widest border border-border">
                STANDBY
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none">NO. OF BINS</p>
            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">x{multiplier} / BIN</span>
          </div>
          <div className="relative">
            <Box className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isReadOnly ? "text-slate-700" : "text-slate-300")} />
            <Input 
              type="number" 
              placeholder="0"
              min={0}
              value={localBinCount} 
              disabled={isReadOnly}
              onFocus={() => { isFocusedRef.current = true; }}
              onBlur={() => { isFocusedRef.current = false; }}
              onChange={handleChange}
              className="h-12 pl-4 pr-4 text-3xl font-black text-center bg-black/60 font-headline border-white/10 rounded-xl focus-visible:ring-primary text-white disabled:!text-white disabled:opacity-100"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-dashed border-border">
          <div className="flex justify-between items-center px-1">
             <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">TOTAL RFD STOCK</span>
             <span className="text-2xl font-black font-headline text-emerald-500 leading-none">{projectedStock}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
             <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">TARGET: {stock.plannedDispatch || 0}</span>
             {hasPlan && (
               <span className={cn("text-[10px] font-black font-headline", isShort ? "text-red-500" : "text-emerald-500/60")}>
                {projectedStock - stock.plannedDispatch >= 0 ? '+' : ''}{projectedStock - stock.plannedDispatch}
               </span>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StockDataModule() {
  const { stocks, updateBinCount, saveStockData, isReadOnly, isLoading } = useApp();
  const [selectedPartNumber, setSelectedPartNumber] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const handleScanInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().trim();
    setScanValue(val);

    const matchingPart = stocks.find(s => s.partNumber === val);
    if (matchingPart) {
      updateBinCount(matchingPart.partNumber, (Number(matchingPart.binCount) || 0) + 1);
      setScanValue("");
      toast({
        title: "Part Scanned",
        description: `Part ${matchingPart.partNumber}: +1 Bin entry.`,
      });
    }
  };

  const selectedPart = stocks.find(s => s.partNumber === selectedPartNumber);

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 overflow-hidden">
      <header className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border shadow-2xl shrink-0 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1 min-w-[200px]">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-headline font-black text-foreground uppercase tracking-[0.4em]">STOCK DATA</h1>
              {isReadOnly ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">AUDIT PHYSICAL RFD QUANTITIES BY BIN COUNT</p>
          </div>

          {!isReadOnly && (
            <div className="flex-1 max-w-md bg-slate-100 dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-2 space-y-1 shadow-sm ring-1 ring-primary/5">
              <div className="flex items-center justify-between px-2">
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  <ScanLine className="w-2.5 h-2.5 animate-pulse" />
                  Scanner Active
                </span>
                <QrCode className="w-3 h-3 text-primary/40" />
              </div>
              <div className="relative">
                <Input 
                  ref={scanInputRef}
                  type="text"
                  placeholder="SCAN PART QR (AUTO +1 BIN)"
                  value={scanValue}
                  onChange={handleScanInput}
                  className="h-9 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-lg font-black text-center text-primary placeholder:text-muted-foreground/60 placeholder:text-[9px] rounded-lg focus-visible:ring-primary focus-visible:border-primary font-headline uppercase"
                />
              </div>
            </div>
          )}

          {!isReadOnly && (
            <Button onClick={() => saveStockData()} className="bg-primary text-white font-black uppercase text-[10px] h-9 px-6 rounded-lg shadow-lg gap-2 shrink-0">
              <Save className="w-4 h-4" />SAVE DATA
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 pb-20">
          {stocks.map((stock, index) => (
            <StockCard 
              key={stock.partNumber} 
              stock={stock} 
              index={index} 
              isReadOnly={isReadOnly} 
              updateBinCount={updateBinCount} 
              onShowHistory={setSelectedPartNumber}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!selectedPartNumber} onOpenChange={(open) => !open && setSelectedPartNumber(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-black text-2xl uppercase tracking-tighter flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Stock Entry Log: {selectedPartNumber}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedPart?.stockHistory && selectedPart.stockHistory.length > 0 ? (
                <div className="space-y-2">
                  {selectedPart.stockHistory.slice().reverse().map((rev, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{rev.timestamp}</span>
                        <span className="text-[9px] font-black uppercase text-emerald-500/70 tracking-tighter">
                          Bin Count: {rev.binCount}
                        </span>
                      </div>
                      <span className="text-xl font-black font-headline text-emerald-500">{rev.pdiStock} Units</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-30">
                  <History className="w-8 h-8 text-muted-foreground" />
                  <p className="text-center text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                    No records found.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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