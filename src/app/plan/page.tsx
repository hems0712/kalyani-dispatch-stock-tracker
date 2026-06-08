
'use client';

import { useApp, calculatePartMetrics, type PartStock } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Save, CheckCircle2, Lock, History, Loader2 } from 'lucide-react';
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

 const handleVehicleUpdate = (partNumber: string, vehicleKey: 'v1Plan' | 'v2Plan' | 'v3Plan', value: number) => {
  if (isReadOnly) return;
  const validValue = Math.max(0, value);
  const stock = stocks.find(s => s.partNumber === partNumber);
  if (!stock) return;
  const newValues = { ...stock, [vehicleKey]: validValue };
    const newTotal = (Number(newValues.v1Plan) || 0) + (Number(newValues.v2Plan) || 0) + (Number(newValues.v3Plan) || 0);
    updateStock(partNumber, { ...newValues, plannedDispatch: newTotal });
  };

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 overflow-hidden">
      {/* STRICT FROZEN SUMMARY PANEL */}
      <div className="shrink-0 bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center shadow-2xl backdrop-blur-md sticky top-0 z-30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-headline font-black text-white uppercase tracking-[0.4em]">
              TODAY'S DISPATCH PLAN
            </h2>
            {isReadOnly && <Lock className="w-3 h-3 text-amber-500" />}
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary ml-1" />}
          </div>
          <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
            <span>TOTAL PLAN: <span className="text-metric-purple text-lg ml-1 font-black font-headline">{totals.plan}</span></span>
            <div className="w-[1px] h-4 bg-white/10" />
            <span>DISPATCHED: <span className="text-emerald-500 text-lg ml-1 font-black font-headline">{totals.dispatched}</span></span>
            <div className="w-[1px] h-4 bg-white/10" />
            <span>DISPATCH PENDING: <span className="text-red-500 text-lg ml-1 font-black font-headline">{totals.pending}</span></span>
          </div>
        </div>
        {!isReadOnly && (
          <Button 
            onClick={handleSave} 
            className="bg-metric-purple hover:bg-metric-purple/90 text-white font-black uppercase tracking-widest text-[10px] px-8 h-10 rounded-xl shadow-lg gap-2"
          >
            <Save className="w-4 h-4" />
            SAVE PLAN
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-[#0a0f1c] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <Table className="table-fixed min-w-[1000px]">
            {/* STRICT FROZEN TABLE HEADER */}
            <TableHeader className="bg-black/60 sticky top-0 z-20 border-b border-white/5 shadow-md">
              <TableRow className="hover:bg-transparent h-12">
                <TableHead className="font-black uppercase text-[9px] text-slate-500 text-center w-[60px] p-0">SL NO</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-slate-500 px-6 w-[200px] p-0">PART IDENTIFICATION</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-slate-500 text-center p-0">V1 ALLOC</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-slate-500 text-center p-0">V2 ALLOC</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-slate-500 text-center p-0">V3 ALLOC</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-metric-purple text-center p-0">TARGET</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-emerald-400 text-center p-0">SHIPPED</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-red-400 text-center p-0">PENDING</TableHead>
                <TableHead className="font-black uppercase text-[9px] text-slate-500 text-right px-6 p-0">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock, index) => {
                const m = calculatePartMetrics(stock);
                return (
                  <TableRow key={stock.partNumber} className="hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors h-14">
                    <TableCell className="text-center text-[10px] font-black text-slate-700 font-headline p-0">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-6 font-headline font-black text-xl text-[#3b82f6] leading-none p-0">
                      {stock.partNumber}
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Input 
                        type="number" 
                        min={0}
                        value={stock.v1Plan || ""} 
                        disabled={isReadOnly}
                        onChange={(e) => handleVehicleUpdate(stock.partNumber, 'v1Plan', parseInt(e.target.value) || 0)}
                        className="h-10 w-20 mx-auto text-xl font-black text-center bg-black/40 border-white/10 rounded-lg focus-visible:ring-primary text-white font-headline"
                      />
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Input 
                        type="number" 
                        min={0}
                        value={stock.v2Plan || ""} 
                        disabled={isReadOnly}
                        onChange={(e) => handleVehicleUpdate(stock.partNumber, 'v2Plan', parseInt(e.target.value) || 0)}
                        className="h-10 w-20 mx-auto text-xl font-black text-center bg-black/40 border-white/10 rounded-lg focus-visible:ring-primary text-white font-headline"
                      />
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <Input 
                        type="number" 
                        min={0}
                        value={stock.v3Plan || ""} 
                        disabled={isReadOnly}
                        onChange={(e) => handleVehicleUpdate(stock.partNumber, 'v3Plan', parseInt(e.target.value) || 0)}
                        className="h-10 w-20 mx-auto text-xl font-black text-center bg-black/40 border-white/10 rounded-lg focus-visible:ring-primary text-white font-headline"
                      />
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <span className="text-2xl font-black font-headline text-metric-purple leading-none">
                        {stock.plannedDispatch}
                      </span>
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <span className="text-2xl font-black font-headline text-emerald-400 leading-none">
                        {m.shipped}
                      </span>
                    </TableCell>
                    <TableCell className="text-center p-0">
                      <span className="text-2xl font-black font-headline text-red-400 leading-none">
                        {m.pending}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-6 p-0">
                      <div className="flex items-center justify-end gap-2">
                         <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => setSelectedPartForHistory(stock)}
                          className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg"
                         >
                           <History className="w-5 h-5" />
                         </Button>
                         <div className="flex items-center gap-2 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          AUTH.
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
        <DialogContent className="bg-[#0a0f1c] border-white/10 text-white max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline font-black text-2xl uppercase tracking-tighter">
              Revision History: {selectedPartForHistory?.partNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedPartForHistory?.planHistory && selectedPartForHistory.planHistory.length > 0 ? (
              <div className="space-y-2">
                {selectedPartForHistory.planHistory.slice().reverse().map((rev, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rev.timestamp}</span>
                    <span className="text-xl font-black text-metric-purple font-headline">{rev.quantity} Units</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-500 font-black uppercase tracking-widest text-[11px]">No revisions recorded today.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PlanPage() {
  return (
    <div className="h-screen bg-[#030712] flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <PlanModule />
      </main>
    </div>
  );
}
