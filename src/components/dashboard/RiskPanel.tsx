"use client";

import { useApp, calculatePartMetrics } from '@/lib/store';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function RiskPanel() {
  const { stocks } = useApp();
  
  const riskParts = stocks
    .map((s, index) => ({ ...s, m: calculatePartMetrics(s), index }))
    .filter(s => s.m.status === 'red');

  const completedPartsCount = stocks
    .map(s => ({ ...s, m: calculatePartMetrics(s) }))
    .filter(s => s.m.completionPercentage >= 100).length;

  if (riskParts.length === 0 && completedPartsCount === 0) return null;

  return (
    <div className="space-y-1 shrink-0">
      {completedPartsCount > 0 && (
        <div className="flex items-center gap-2 p-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-100">
           <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
           <span className="font-black uppercase tracking-widest text-[6px]">
             Dispatch Plan Completed for {completedPartsCount} Parts
           </span>
        </div>
      )}

      {riskParts.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-red-500/30 bg-red-500/5 shadow-2xl">
          <div className="flex items-center gap-1.5 p-1 px-2 bg-red-500/20 text-red-100">
            <AlertTriangle className="w-2.5 h-2.5 animate-pulse text-red-500" />
            <h2 className="font-headline text-[7px] font-black uppercase tracking-[0.1em]">Today's Dispatch Risk Parts (Stock Shortage)</h2>
          </div>
          <Table className="table-fixed">
            <TableHeader className="bg-red-500/10">
              <TableRow className="border-red-500/10 hover:bg-transparent h-5">
                <TableHead className="text-[6px] font-black text-red-300 uppercase text-center w-[20px] p-0">SL</TableHead>
                <TableHead className="text-[6px] font-black text-red-300 uppercase px-3 p-0">Part No.</TableHead>
                <TableHead className="text-[6px] font-black text-red-300 uppercase text-center p-0">Avail.</TableHead>
                <TableHead className="text-[6px] font-black text-red-300 uppercase text-center p-0">Plan</TableHead>
                <TableHead className="text-[6px] font-black text-red-300 uppercase text-right px-3 p-0">Shortage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskParts.map((part) => (
                <TableRow key={part.partNumber} className="border-red-500/5 bg-red-500/5 hover:bg-red-500/10 h-7">
                  <TableCell className="p-0 text-center font-black text-[8px] text-red-300/50 font-headline">{part.index + 1}</TableCell>
                  <TableCell className="p-0 px-3 font-black font-headline text-base text-red-400">{part.partNumber}</TableCell>
                  <TableCell className="p-0 text-center font-black text-sm text-red-200 font-headline">{part.m.availableStock}</TableCell>
                  <TableCell className="p-0 text-center font-black text-sm text-red-200 font-headline">{part.m.planned}</TableCell>
                  <TableCell className="p-0 text-right font-black text-lg text-red-500 px-3 font-headline">-{part.m.shortageQuantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
