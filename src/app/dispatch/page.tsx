'use client';

import { useApp, calculatePartMetrics, type PartStock } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Trash2, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect, KeyboardEvent } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type VehicleKey = 'v1Load' | 'v2Load' | 'v3Load' | 'v4Load';

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
  loadKey: VehicleKey;
  stocks: PartStock[];
  status?: { isDispatched: boolean; dispatchedAt: string | null };
  isReadOnly: boolean;
  loadPartToVehicle: (partNumber: string, vehicleKey: VehicleKey, qty: number) => boolean;
  clearVehicle: (vehicleKey: VehicleKey) => void;
  dispatchVehicle: (vehicleKey: VehicleKey) => void;
  recallVehicle: (vehicleKey: VehicleKey) => void;
}) {
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [qty, setQty] = useState<number>(0);

  const isDispatched = status?.isDispatched ?? false;
  const dispatchedAt = status?.dispatchedAt ?? null;
  const shippedKey = loadKey.replace('Load', 'Shipped') as 'v1Shipped' | 'v2Shipped' | 'v3Shipped' | 'v4Shipped';

  const currentLoadParts = stocks.filter(s => (Number(s[loadKey]) || 0) > 0);
  const shippedParts = stocks.filter(s => (Number(s[shippedKey]) || 0) > 0);
  
  const displayParts = isDispatched ? shippedParts : currentLoadParts;
  const displayKey = isDispatched ? shippedKey : loadKey;

  const vehicleColorClass = 
    vehicleNum === 1 ? 'text-metric-v1' :
    vehicleNum === 2 ? 'text-metric-v2' :
    vehicleNum === 3 ? 'text-metric-v3' : 'text-metric-v4';

  const handleAdd = () => {
    if (isReadOnly) return;
    if (!selectedPart || qty <= 0) {
      toast({ variant: "destructive", title: "Missing Payload", description: "Select part and quantity." });
      return;
    }
    const success = loadPartToVehicle(selectedPart, loadKey, qty);
    if (success) {
      setQty(0);
      toast({ title: "Loaded", description: `${qty} units added to VEHICLE ${vehicleNum}.` });
    } else {
      toast({ variant: "destructive", title: "Shortage", description: "Insufficient stock in PDI Area." });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <Card className={cn(
      "overflow-hidden bg-card border-border shadow-2xl transition-all rounded-xl flex flex-col border h-[210px]",
      isDispatched ? "border-emerald-500/30 ring-1 ring-emerald-500/5" : "border-border"
    )}>
      <CardHeader className="p-2 border-b border-border bg-accent/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Truck className={cn("w-3 h-3", vehicleColorClass)} />
              <h3 className={cn("font-headline font-black uppercase text-[10px] tracking-[0.15em] leading-none", vehicleColorClass)}>Vehicle {vehicleNum}</h3>
            </div>
            {isDispatched && (
              <span className="text-[6px] text-emerald-500 font-black flex items-center gap-1 uppercase tracking-widest mt-0.5">
                <CheckCircle2 className="w-1.5 h-1.5" /> SHIPPED @ {dispatchedAt}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {!isReadOnly && (
              <>
                {isDispatched ? (
                  <Button 
                    size="sm" variant="outline" onClick={() => recallVehicle(loadKey)}
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 text-[7px] font-black uppercase h-5 px-1.5 rounded-md"
                  >
                    RECALL
                  </Button>
                ) : (
                  <Button 
                    size="sm" onClick={() => currentLoadParts.length > 0 ? dispatchVehicle(loadKey) : toast({ variant: "destructive", title: "Empty Payload", description: "Add parts before dispatching." })}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-[7px] font-black uppercase h-5 px-2 rounded-md shadow-lg"
                  >
                    DISPATCH
                  </Button>
                )}
                <Button size="icon" variant="outline" onClick={() => clearVehicle(loadKey)} disabled={isDispatched}
                  className="h-5 w-5 rounded-md border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 space-y-1.5 flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 bg-muted/30 rounded-lg p-1.5 border border-border shadow-inner overflow-y-auto custom-scrollbar">
          {displayParts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {displayParts.map(p => (
                <div key={p.partNumber} className="flex items-center gap-1 py-0.5 border-b border-border/50 last:border-0 hover:bg-accent px-1 rounded transition-colors">
                  <span className="font-headline font-black text-xs text-metric-pdi leading-none uppercase whitespace-nowrap">
                    {p.partNumber}:
                  </span>
                  <span className="font-headline font-black text-xs text-emerald-500 leading-none whitespace-nowrap">
                    {p[displayKey]} Qty.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center italic text-[7px] text-muted-foreground uppercase font-black tracking-widest opacity-30">
              Empty
            </div>
          )}
        </div>

        {!isDispatched && !isReadOnly && (
          <div className="pt-1.5 border-t border-border flex gap-1.5 shrink-0 items-center">
            <div className="flex-1 flex gap-1 min-w-0">
              <Select onValueChange={setSelectedPart} value={selectedPart}>
                <SelectTrigger className="w-[60%] h-7 text-[9px] font-black bg-muted border-border text-foreground rounded-md px-2 uppercase font-headline">
                  <SelectValue placeholder="PART" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {stocks.map(s => (
                    <SelectItem key={s.partNumber} value={s.partNumber} className="text-[10px] font-black">
                      {s.partNumber} ({s.pdiStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                type="number" 
                placeholder="QTY" 
                value={qty || ""} 
                onChange={(e) => setQty(parseInt(e.target.value) || 0)} 
                onKeyDown={handleKeyDown}
                className="w-[40%] h-7 text-center text-[9px] font-black bg-muted border-border text-foreground rounded-md focus-visible:ring-primary font-headline"
              />
            </div>
            <Button size="icon" onClick={handleAdd} className="h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shrink-0">
              <Plus className="w-3.5 h-3.5" />
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-3 gap-3 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 sticky top-0 z-30 bg-background pb-1">
        <VehicleCard vehicleNum={1} loadKey="v1Load" stocks={stocks} status={vehicleStatuses?.v1Load} isReadOnly={isReadOnly}
          loadPartToVehicle={loadPartToVehicle} clearVehicle={clearVehicle} dispatchVehicle={dispatchVehicle} recallVehicle={recallVehicle} />
        <VehicleCard vehicleNum={2} loadKey="v2Load" stocks={stocks} status={vehicleStatuses?.v2Load} isReadOnly={isReadOnly}
          loadPartToVehicle={loadPartToVehicle} clearVehicle={clearVehicle} dispatchVehicle={dispatchVehicle} recallVehicle={recallVehicle} />
        <VehicleCard vehicleNum={3} loadKey="v3Load" stocks={stocks} status={vehicleStatuses?.v3Load} isReadOnly={isReadOnly}
          loadPartToVehicle={loadPartToVehicle} clearVehicle={clearVehicle} dispatchVehicle={dispatchVehicle} recallVehicle={recallVehicle} />
        <VehicleCard vehicleNum={4} loadKey="v4Load" stocks={stocks} status={vehicleStatuses?.v4Load} isReadOnly={isReadOnly}
          loadPartToVehicle={loadPartToVehicle} clearVehicle={clearVehicle} dispatchVehicle={dispatchVehicle} recallVehicle={recallVehicle} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-1">
        <div className="flex justify-between items-end px-1 shrink-0">
          <h2 className="font-headline font-black uppercase text-sm tracking-tighter text-foreground">DISPATCH ACHIEVEMENT</h2>
          <div className="flex gap-4 text-[7px] font-black uppercase tracking-widest text-muted-foreground">
            <span className={cn(vehicleStatuses?.v1Load?.isDispatched ? "text-emerald-500" : "text-metric-v1")}>V1: {vehicleStatuses?.v1Load?.isDispatched ? `SHIPPED` : 'AT DOCK'}</span>
            <span className={cn(vehicleStatuses?.v2Load?.isDispatched ? "text-emerald-500" : "text-metric-v2")}>V2: {vehicleStatuses?.v2Load?.isDispatched ? `SHIPPED` : 'AT DOCK'}</span>
            <span className={cn(vehicleStatuses?.v3Load?.isDispatched ? "text-emerald-500" : "text-metric-v3")}>V3: {vehicleStatuses?.v3Load?.isDispatched ? `SHIPPED` : 'AT DOCK'}</span>
            <span className={cn(vehicleStatuses?.v4Load?.isDispatched ? "text-emerald-500" : "text-metric-v4")}>V4: {vehicleStatuses?.v4Load?.isDispatched ? `SHIPPED` : 'AT DOCK'}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-border bg-card shadow-2xl flex flex-col">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <Table className="table-fixed">
              <TableHeader className="bg-muted sticky top-0 z-10 border-b border-border shadow-md">
                <TableRow className="hover:bg-transparent h-8">
                  <TableHead className="font-black text-[8px] text-muted-foreground uppercase text-center w-[40px] p-0">SL</TableHead>
                  <TableHead className="font-black text-[8px] text-muted-foreground uppercase px-4 p-0">PART IDENTIFICATION</TableHead>
                  <TableHead className="font-black text-[8px] text-metric-plan uppercase text-center p-0">PLAN</TableHead>
                  <TableHead className="font-black text-[8px] text-metric-v1 uppercase text-center p-0">V1</TableHead>
                  <TableHead className="font-black text-[8px] text-metric-v2 uppercase text-center p-0">V2</TableHead>
                  <TableHead className="font-black text-[8px] text-metric-v3 uppercase text-center p-0">V3</TableHead>
                  <TableHead className="font-black text-[8px] text-metric-v4 uppercase text-center p-0">V4</TableHead>
                  <TableHead className="font-black text-[8px] text-metric-disp uppercase text-center p-0">TOTAL</TableHead>
                  <TableHead className="font-black text-[8px] text-metric-pending uppercase text-right px-4 p-0">PENDING</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock, index) => {
                  const m = calculatePartMetrics(stock);
                  const v1Val = (Number(stock.v1Load) || 0) + (Number(stock.v1Shipped) || 0);
                  const v2Val = (Number(stock.v2Load) || 0) + (Number(stock.v2Shipped) || 0);
                  const v3Val = (Number(stock.v3Load) || 0) + (Number(stock.v3Shipped) || 0);
                  const v4Val = (Number(stock.v4Load) || 0) + (Number(stock.v4Shipped) || 0);
                  const totalDisp = (Number(stock.shippedQuantity) || 0) + (Number(stock.v1Load) || 0) + (Number(stock.v2Load) || 0) + (Number(stock.v3Load) || 0) + (Number(stock.v4Load) || 0);

                  return (
                    <TableRow key={stock.partNumber} className="border-b border-border hover:bg-accent/30 h-[38px] transition-colors">
                      <TableCell className="text-center text-[10px] font-black text-muted-foreground font-headline p-0">{index + 1}</TableCell>
                      <TableCell className="font-headline font-black text-lg px-4 text-metric-pdi leading-none p-0">{stock.partNumber}</TableCell>
                      <TableCell className="text-center font-black text-lg text-metric-plan font-headline p-0">{m.planned || '—'}</TableCell>
                      <TableCell className="text-center font-black text-base text-metric-v1 font-headline p-0">
                        {v1Val > 0 ? <span className="flex items-center justify-center gap-1">{v1Val} {vehicleStatuses?.v1Load?.isDispatched && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-center font-black text-base text-metric-v2 font-headline p-0">
                        {v2Val > 0 ? <span className="flex items-center justify-center gap-1">{v2Val} {vehicleStatuses?.v2Load?.isDispatched && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-center font-black text-base text-metric-v3 font-headline p-0">
                        {v3Val > 0 ? <span className="flex items-center justify-center gap-1">{v3Val} {vehicleStatuses?.v3Load?.isDispatched && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-center font-black text-base text-metric-v4 font-headline p-0">
                        {v4Val > 0 ? <span className="flex items-center justify-center gap-1">{v4Val} {vehicleStatuses?.v4Load?.isDispatched && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-center font-black text-lg text-metric-disp font-headline p-0">{totalDisp || '—'}</TableCell>
                      <TableCell className="text-right px-4 font-black text-lg text-metric-pending font-headline p-0">{m.pending || '—'}</TableCell>
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <DispatchModule />
      </main>
    </div>
  );
}
