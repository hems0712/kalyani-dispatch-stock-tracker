
'use client';

import { useApp, calculatePartMetrics, type PartStock } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Save, CheckCircle2, Lock, Unlock, History, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function PlanModule() {
  const { stocks, updateStock, isReadOnly, isLoading } = useApp();
  const [selectedPartForHistory, setSelectedPartForHistory] = useState<PartStock | null>(null);
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

  const totals = stocks.reduce((acc, stock) => {
    const m = calculatePartMetrics(stock);
    acc.plan += m.planned;
    acc.dispatched += m.shipped;
    acc.pending += m.pending;
    return acc;
  }, { plan: 0, dispatched: 0, pending: 0 });

  const handleSave = () => {
    if (isReadOnly) return;
    toast({
      title: "Plan Synchronized",
      description: "Dispatch targets updated across all terminals.",
    });
  };

  const handleVehicleUpdate = (partNumber: string, vehicleKey: 'v1Plan' | 'v2Plan' | 'v3Plan' | 'v4Plan', value: number) => {
    if (isReadOnly) return;
    const validValue = Math.max(0, value);
    const stock = stocks.find(s => s.partNumber === partNumber);
    if (!stock) return;
    
    const newValues = { ...stock, [vehicleKey]: validValue };
    const newTotal = (Number(newValues.v1Plan) || 0) + 
                    (Number(newValues.v2Plan) || 0) + 
                    (Number(newValues.v3Plan) || 0) + 
                    (Number(newValues.v4Plan) || 0);
                    
    updateStock(partNumber, { ...newValues, plannedDispatch: newTotal });
  };

  return (
    <div className="flex flex-col h-full w-full p-3 gap-3 overflow-hidden">
      <div className="shrink-0 bg-card border border-border rounded-xl p-3 flex justify-between items-center shadow-2xl backdrop-blur-md sticky top-0 z-30">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-headline font-black text-foreground uppercase tracking-[0.3em]">
              TODAY'S DISPATCH PLAN
            </h2>
            {isReadOnly ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
          </div>
          <div className="flex items-center gap-4 text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <span>TOTAL PLAN: <span className="text-metric-plan text-base ml-1 font-black font-headline">{totals.plan}</span></span>
            <div className="w-[1px] h-3 bg-border" />
            <span>DISPATCHED: <span className="text-metric-disp text-base ml-1 font-black font-headline">{totals.dispatched}</span></span>
            <div className="w-[1px] h-3 bg-border" />
            <span>PENDING: <span className="text-metric-pending text-base ml-1 font-black font-headline">{totals.pending}</span></span>
          </div>
        </div>
        {!isReadOnly && (
          <Button 
            onClick={handleSave} 
            className="bg-metric-plan hover:bg-metric-plan/90 text-white font-black uppercase tracking-widest text-[9px] px-6 h-8 rounded-lg shadow-lg gap-2"
          >
            <History className="w-3.5 h-3.5" />
            SAVE PLAN
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <Table className="table-fixed min-w-[1000px]">
            <TableHeader className="bg-muted sticky top-0 z-20 border-b border-border shadow-md">
              <TableRow className="hover:bg-transparent h-10">
                <TableHead className="font-black uppercase text-[8px] text-muted-foreground text-center w-[40px] p-0">SL</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-muted-foreground px-4 w-[160px] p-0">PART IDENTIFICATION</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-metric-v1 text-center p-0">Vehicle-1</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-metric-v2 text-center p-0">Vehicle-2</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-metric-v3 text-center p-0">Vehicle-3</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-metric-v4 text-center p-0">Vehicle-4</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-metric-plan text-center p-0">TARGET</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-metric-disp text-center p-0">SHIPPED</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-metric-pending text-center p-0">PENDING</TableHead>
                <TableHead className="font-black uppercase text-[8px] text-muted-foreground text-right px-4 p-0">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock, index) => {
                const m = calculatePartMetrics(stock);
                return (
                  <TableRow key={stock.partNumber} className="hover:bg-accent border-b border-border last:border-0 transition-colors h-[38px]">
                    <TableCell className="text-center text-[10px] font-black text-slate-700 font-headline p-0">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 font-headline font-black text-lg text-metric-pdi leading-none p-0">
                      {stock.partNumber}
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Input 
                        type="number" 
                        min={0}
                        value={stock.v1Plan ?? ""} 
                        disabled={isReadOnly}
                        onChange={(e) => handleVehicleUpdate(stock.partNumber, 'v1Plan', parseInt(e.target.value) || 0)}
                        className="h-7 w-16 mx-auto text-base font-black text-center bg-muted border-border rounded-md focus-visible:ring-primary text-foreground font-headline disabled:!text-foreground disabled:opacity-100"
                      />
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Input 
                        type="number" 
                        min={0}
                        value={stock.v2Plan ?? ""} 
                        disabled={isReadOnly}
                        onChange={(e) => handleVehicleUpdate(stock.partNumber, 'v2Plan', parseInt(e.target.value) || 0)}
                        className="h-7 w-16 mx-auto text-base font-black text-center bg-muted border-border rounded-md focus-visible:ring-primary text-foreground font-headline disabled:!text-foreground disabled:opacity-100"
                      />
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Input 
                        type="number" 
                        min={0}
                        value={stock.v3Plan ?? ""} 
                        disabled={isReadOnly}
                        onChange={(e) => handleVehicleUpdate(stock.partNumber, 'v3Plan', parseInt(e.target.value) || 0)}
                        className="h-7 w-16 mx-auto text-base font-black text-center bg-muted border-border rounded-md focus-visible:ring-primary text-foreground font-headline disabled:!text-foreground disabled:opacity-100"
                      />
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Input 
                        type="number" 
                        min={0}
                        value={stock.v4Plan ?? ""} 
                        disabled={isReadOnly}
                        onChange={(e) => handleVehicleUpdate(stock.partNumber, 'v4Plan', parseInt(e.target.value) || 0)}
                        className="h-7 w-16 mx-auto text-base font-black text-center bg-muted border-border rounded-md focus-visible:ring-primary text-foreground font-headline disabled:!text-foreground disabled:opacity-100"
                      />
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <span className="text-lg font-black font-headline text-metric-plan leading-none">
                        {stock.plannedDispatch}
                      </span>
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <span className="text-lg font-black font-headline text-metric-disp leading-none">
                        {m.shipped}
                      </span>
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <span className="text-lg font-black font-headline text-metric-pending leading-none">
                        {m.pending}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-4 p-0">
                      <div className="flex items-center justify-end gap-1.5">
                         <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => setSelectedPartForHistory(stock)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                         >
                           <History className="w-4 h-4" />
                         </Button>
                         <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-700 uppercase tracking-widest">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          AUTH
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedPartForHistory} onOpenChange={(open) => !open && setSelectedPartForHistory(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-black text-2xl uppercase tracking-tighter">
              Revision History: {selectedPartForHistory?.partNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedPartForHistory?.planHistory && selectedPartForHistory.planHistory.length > 0 ? (
              <div className="space-y-2">
                {selectedPartForHistory.planHistory.slice().reverse().map((rev, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-accent border border-border">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{rev.timestamp}</span>
                    <span className="text-xl font-black text-metric-plan font-headline">{rev.quantity} Units</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground font-black uppercase tracking-widest text-[11px]">No revisions recorded today.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PlanPage() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <PlanModule />
      </main>
    </div>
  );
}
