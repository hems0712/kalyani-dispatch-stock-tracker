'use client';

import { useApp, calculatePartMetrics, type PartStock } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Trash2, Plus, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { useState, useEffect, KeyboardEvent } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function VehicleCard({ 
  vehicleNum, 
  loadKey, 
  stocks, 
  status,
  isReadOnly,
  loadPartToVehicle, 
  clearVehicle,
  dispatchVehicle,
  recallVehicle
}: { 
  vehicleNum: number; 
  loadKey: 'v1Load' | 'v2Load' | 'v3Load';
  stocks: PartStock[];
  status?: { isDispatched: boolean; dispatchedAt: string | null };
  isReadOnly: boolean;
  loadPartToVehicle: (partNumber: string, vehicleKey: 'v1Load' | 'v2Load' | 'v3Load', qty: number) => boolean;
  clearVehicle: (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => void;
  dispatchVehicle: (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => void;
  recallVehicle: (vehicleKey: 'v1Load' | 'v2Load' | 'v3Load') => void;
}) {
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [qty, setQty] = useState<number>(0);

  const isDispatched = status?.isDispatched ?? false;
  const dispatchedAt = status?.dispatchedAt ?? null;
  const shippedKey = loadKey.replace('Load', 'Shipped') as 'v1Shipped' | 'v2Shipped' | 'v3Shipped';

  const currentLoadParts = stocks.filter(s => (Number(s[loadKey]) || 0) > 0);
  const shippedParts = stocks.filter(s => (Number(s[shippedKey]) || 0) > 0);
  
  const displayParts = isDispatched ? shippedParts : currentLoadParts;
  const displayKey = isDispatched ? shippedKey : loadKey;

  const handleAdd = () => {
    if (isReadOnly) return;
    if (!selectedPart || qty <= 0) {
      toast({ variant: "destructive", title: "Missing Payload", description: "Select part and quantity." });
      return;
    }
    const success = loadPartToVehicle(selectedPart, loadKey, qty);
    if (success) {
      setQty(0);
      toast({ title: "Loaded", description: `${qty} units added to V${vehicleNum}.` });
    } else {
      toast({ variant: "destructive", title: "Shortage", description: "Insufficient stock in PDI Area." });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <Card className={cn(
      "overflow-hidden bg-[#0a0f1c] border-white/10 shadow-2xl transition-all rounded-xl flex flex-col border-2 h-[280px]",
      isDispatched ? "border-emerald-500/50 ring-1 ring-emerald-500/5" : "border-white/5"
    )}>
      <CardHeader className="p-3 border-b border-white/5 bg-white/5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Truck className={cn("w-4 h-4", isDispatched ? "text-emerald-500" : "text-primary")} />
              <h3 className="font-headline font-black uppercase text-sm text-white tracking-[0.3em] leading-none">Vehicle {vehicleNum}</h3>
              {isReadOnly && <Lock className="w-3 h-3 text-amber-500" />}
            </div>
            {isDispatched && (
              <span className="text-[8px] text-emerald-400 font-black flex items-center gap-1 uppercase tracking-widest mt-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Dispatched @ {dispatchedAt}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {!isReadOnly && (
              <>
                {isDispatched ? (
                  <Button 
                    size="sm" variant="outline" onClick={() => recallVehicle(loadKey)}
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 text-[8px] font-black uppercase h-7 px-2 rounded-lg"
                  >
                    RECALL
                  </Button>
                ) : (
                  <Button 
                    size="sm" onClick={() => currentLoadParts.length > 0 ? dispatchVehicle(loadKey) : toast({ variant: "destructive", title: "Empty Payload", description: "Add parts before dispatching." })}
                    className="bg-primary text-white hover:bg-primary/90 text-[8px] font-black uppercase h-7 px-3 rounded-lg shadow-lg"
                  >
                    DISPATCH
                  </Button>
                )}
                <Button size="icon" variant="outline" onClick={() => clearVehicle(loadKey)} disabled={isDispatched}
                  className="h-7 w-7 rounded-lg border-white/10 text-slate-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 space-y-3 flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 space-y-1 bg-black/40 rounded-xl p-2 border border-white/5 shadow-inner overflow-y-auto custom-scrollbar">
          {displayParts.length > 0 ? (
            displayParts.map(p => (
              <div key={p.partNumber} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                <div className="font-headline font-black text-sm leading-none flex items-center gap-1.5">
                  <span className="text-metric-blue">{p.partNumber}</span>
                  <span className="text-emerald-400">: {p[displayKey]} Qty</span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center italic text-[9px] text-slate-600 uppercase font-black tracking-widest opacity-40">
              Payload Empty
            </div>
          )}
        </div>

        {!isDispatched && !isReadOnly && (
          <div className="pt-2 border-t border-dashed border-white/10 flex gap-2 shrink-0">
            <Select onValueChange={setSelectedPart} value={selectedPart}>
              <SelectTrigger className="flex-1 text-[10px] h-9 font-black bg-black/40 border-white/10 text-white rounded-lg px-2">
                <SelectValue placeholder="SELECT PART" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0f1c] border-white/10 text-white">
                {stocks.map(s => (
                  <SelectItem key={s.partNumber} value={s.partNumber} className="text-[11px] font-black">
                    {s.partNumber} (Avail: {s.pdiStock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="QTY" value={qty || ""} onChange={(e) => setQty(parseInt(e.target.value) || 0)} onKeyDown={handleKeyDown}
              className="h-9 w-16 text-center text-sm font-black bg-black/40 border-white/10 text-white rounded-lg focus-visible:ring-primary font-headline"
            />
            <Button size="icon" onClick={handleAdd} className="h-9 w-9 bg-primary text-white hover:bg-primary/90 rounded-lg">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DispatchModule() {
  const { stocks, vehicleStatuses, loadPartToVehicle, clearVehicle, dispatchVehicle, recallVehicle, isReadOnly, isLoading } = useApp();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || (isLoading && stocks.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Dock Status...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 sticky top-0 z-30 bg-[#030712] pb-2">
        <VehicleCard vehicleNum={1} loadKey="v1Load" stocks={stocks} status={vehicleStatuses?.v1Load} isReadOnly={isReadOnly}
          loadPartToVehicle={loadPartToVehicle} clearVehicle={clearVehicle} dispatchVehicle={dispatchVehicle} recallVehicle={recallVehicle} />
        <VehicleCard vehicleNum={2} loadKey="v2Load" stocks={stocks} status={vehicleStatuses?.v2Load} isReadOnly={isReadOnly}
          loadPartToVehicle={loadPartToVehicle} clearVehicle={clearVehicle} dispatchVehicle={dispatchVehicle} recallVehicle={recallVehicle} />
        <VehicleCard vehicleNum={3} loadKey="v3Load" stocks={stocks} status={vehicleStatuses?.v3Load} isReadOnly={isReadOnly}
          loadPartToVehicle={loadPartToVehicle} clearVehicle={clearVehicle} dispatchVehicle={dispatchVehicle} recallVehicle={recallVehicle} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-2">
        <div className="flex justify-between items-end px-2 shrink-0">
          <h2 className="font-headline font-black uppercase text-lg tracking-tighter text-white">DISPATCH ACHIEVEMENT SUMMARY</h2>
          <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <span className={cn(vehicleStatuses?.v1Load?.isDispatched ? "text-emerald-400" : "")}>V1: {vehicleStatuses?.v1Load?.isDispatched ? `SHIPPED` : 'AT DOCK'}</span>
            <span className={cn(vehicleStatuses?.v2Load?.isDispatched ? "text-emerald-400" : "")}>V2: {vehicleStatuses?.v2Load?.isDispatched ? `SHIPPED` : 'AT DOCK'}</span>
            <span className={cn(vehicleStatuses?.v3Load?.isDispatched ? "text-emerald-400" : "")}>V3: {vehicleStatuses?.v3Load?.isDispatched ? `SHIPPED` : 'AT DOCK'}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 bg-[#0a0f1c] shadow-2xl flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <Table className="table-fixed">
              <TableHeader className="bg-black/60 sticky top-0 z-10 border-b border-white/5 shadow-md">
                <TableRow className="hover:bg-transparent h-10">
                  <TableHead className="font-black text-[9px] text-slate-500 uppercase text-center w-[60px] p-0">SL NO</TableHead>
                  <TableHead className="font-black text-[9px] text-slate-500 uppercase px-4 p-0">PART IDENTIFICATION</TableHead>
                  <TableHead className="font-black text-[9px] text-metric-purple uppercase text-center p-0">PLAN</TableHead>
                  <TableHead className="font-black text-[9px] text-cyan-400 uppercase text-center p-0">V1</TableHead>
                  <TableHead className="font-black text-[9px] text-yellow-400 uppercase text-center p-0">V2</TableHead>
                  <TableHead className="font-black text-[9px] text-red-400 uppercase text-center p-0">V3</TableHead>
                  <TableHead className="font-black text-[9px] text-emerald-400 uppercase text-center p-0">TOTAL</TableHead>
                  <TableHead className="font-black text-[9px] text-destructive uppercase text-right px-4 p-0">PENDING</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock, index) => {
                  const m = calculatePartMetrics(stock);
                  const v1Val = (Number(stock.v1Load) || 0) + (Number(stock.v1Shipped) || 0);
                  const v2Val = (Number(stock.v2Load) || 0) + (Number(stock.v2Shipped) || 0);
                  const v3Val = (Number(stock.v3Load) || 0) + (Number(stock.v3Shipped) || 0);
                  const totalDisp = (Number(stock.shippedQuantity) || 0) + (Number(stock.v1Load) || 0) + (Number(stock.v2Load) || 0) + (Number(stock.v3Load) || 0);

                  return (
                    <TableRow key={stock.partNumber} className="border-b border-white/5 hover:bg-white/5 h-10 transition-colors">
                      <TableCell className="text-center text-[10px] font-black text-slate-700 font-headline p-0">{index + 1}</TableCell>
                      <TableCell className="font-headline font-black text-xl px-4 text-[#3b82f6] leading-none p-0">{stock.partNumber}</TableCell>
                      <TableCell className="text-center font-black text-lg text-metric-purple font-headline p-0">{m.planned || '—'}</TableCell>
                      <TableCell className="text-center font-black text-base text-cyan-400 font-headline p-0">
                        {v1Val > 0 ? <span className="flex items-center justify-center gap-1.5">{v1Val} {vehicleStatuses?.v1Load?.isDispatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-center font-black text-base text-yellow-400 font-headline p-0">
                        {v2Val > 0 ? <span className="flex items-center justify-center gap-1.5">{v2Val} {vehicleStatuses?.v2Load?.isDispatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-center font-black text-base text-red-400 font-headline p-0">
                        {v3Val > 0 ? <span className="flex items-center justify-center gap-1.5">{v3Val} {vehicleStatuses?.v3Load?.isDispatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-center font-black text-lg text-emerald-400 font-headline p-0">{totalDisp || '—'}</TableCell>
                      <TableCell className="text-right px-4 font-black text-lg text-red-500 font-headline p-0">{m.pending || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DispatchPage() {
  return (
    <div className="h-screen bg-[#030712] flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <DispatchModule />
      </main>
    </div>
  );
}
