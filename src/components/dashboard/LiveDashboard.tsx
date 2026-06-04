"use client";

import { useApp, calculatePartMetrics } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function LiveDashboard() {
  const { stocks } = useApp();

  const totals = stocks.reduce((acc, stock) => {
    const m = calculatePartMetrics(stock);
    acc.plan += m.planned;
    acc.v1 += Number(stock.v1Shipped) || 0;
    acc.v2 += Number(stock.v2Shipped) || 0;
    acc.v3 += Number(stock.v3Shipped) || 0;
    acc.shipped += m.shipped;
    acc.pdi += m.pdi;
    acc.pending += m.pending;
    return acc;
  }, { plan: 0, v1: 0, v2: 0, v3: 0, shipped: 0, pdi: 0, pending: 0 });

  const colWidths = {
    sl: "w-[40px]",
    partNo: "w-[120px]",
    plan: "w-[80px]",
    v1: "w-[60px]",
    v2: "w-[60px]",
    v3: "w-[60px]",
    totalDisp: "w-[100px]",
    pdi: "w-[100px]",
    pending: "w-[100px]",
    status: "w-[120px]"
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-2 overflow-hidden">
      <div className="flex justify-between items-center px-2 shrink-0">
        <h2 className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-[#3b82f6]">PART-WISE STOCK STATUS</h2>
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">{stocks.length} ACTIVE PARTS</span>
      </div>

      <div className="flex-1 bg-[#0a0f1c] border border-[#1e293b] rounded-xl flex flex-col shadow-2xl overflow-hidden min-h-0">
        <div className="overflow-y-auto flex-1 custom-scrollbar min-h-0">
          <Table className="border-collapse min-w-[800px] table-fixed">
            <TableHeader className="bg-[#111827] sticky top-0 z-20 border-b border-[#1e293b]">
              <TableRow className="hover:bg-transparent h-10">
                <TableHead className={cn(colWidths.sl, "font-black text-[9px] text-slate-500 uppercase text-center p-0")}>SL</TableHead>
                <TableHead className={cn(colWidths.partNo, "font-black text-[9px] text-slate-500 uppercase px-4 p-0")}>PART NO.</TableHead>
                <TableHead className={cn(colWidths.plan, "font-black text-[9px] text-metric-purple uppercase text-center p-0")}>PLAN</TableHead>
                <TableHead className={cn(colWidths.v1, "font-black text-[9px] text-cyan-400 uppercase text-center p-0")}>V1</TableHead>
                <TableHead className={cn(colWidths.v2, "font-black text-[9px] text-yellow-400 uppercase text-center p-0")}>V2</TableHead>
                <TableHead className={cn(colWidths.v3, "font-black text-[9px] text-orange-400 uppercase text-center p-0")}>V3</TableHead>
                <TableHead className={cn(colWidths.totalDisp, "font-black text-[9px] text-metric-green uppercase text-center p-0")}>TOTAL DISP.</TableHead>
                <TableHead className={cn(colWidths.pdi, "font-black text-[9px] text-metric-blue uppercase text-center p-0")}>PDI AREA</TableHead>
                <TableHead className={cn(colWidths.pending, "font-black text-[9px] text-metric-red uppercase text-center p-0")}>PENDING</TableHead>
                <TableHead className={cn(colWidths.status, "font-black text-[9px] text-slate-500 uppercase text-center p-0")}>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock, index) => {
                const m = calculatePartMetrics(stock);
                return (
                  <TableRow key={stock.partNumber} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/40 transition-colors h-9">
                    <TableCell className={cn(colWidths.sl, "text-center text-[10px] font-black text-slate-700 font-headline p-0")}>{index + 1}</TableCell>
                    <TableCell className={cn(colWidths.partNo, "font-black font-headline text-lg text-[#3b82f6] px-4 leading-none p-0")}>{stock.partNumber}</TableCell>
                    <TableCell className={cn(colWidths.plan, "text-center font-black text-lg text-metric-purple font-headline p-0")}>{m.planned}</TableCell>
                    <TableCell className={cn(colWidths.v1, "text-center font-black text-base text-cyan-400 font-headline p-0")}>{stock.v1Shipped || '—'}</TableCell>
                    <TableCell className={cn(colWidths.v2, "text-center font-black text-base text-yellow-400 font-headline p-0")}>{stock.v2Shipped || '—'}</TableCell>
                    <TableCell className={cn(colWidths.v3, "text-center font-black text-base text-orange-400 font-headline p-0")}>{stock.v3Shipped || '—'}</TableCell>
                    <TableCell className={cn(colWidths.totalDisp, "text-center font-black text-lg text-metric-green font-headline p-0")}>{m.shipped}</TableCell>
                    <TableCell className={cn(colWidths.pdi, "text-center font-black text-lg text-metric-blue font-headline p-0")}>{m.pdi}</TableCell>
                    <TableCell className={cn(colWidths.pending, "text-center font-black text-lg text-metric-red font-headline p-0")}>{m.pending}</TableCell>
                    <TableCell className={cn(colWidths.status, "text-center p-0")}>
                      <div className={cn("text-[7px] font-black uppercase px-2 py-0.5 rounded border leading-none tracking-widest inline-block", m.status === 'red' ? "bg-red-500/10 text-red-500 border-red-500/30" : (m.status === 'yellow' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" : "bg-green-500/10 text-green-500 border-green-500/30"))}>
                        {m.statusText}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="bg-[#111827] border-t border-[#1e293b] shrink-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
          <Table className="border-collapse min-w-[800px] table-fixed">
            <TableBody>
              <TableRow className="hover:bg-transparent border-none h-12">
                <TableCell className={cn(colWidths.sl, "p-0")}></TableCell>
                <TableCell className={cn(colWidths.partNo, "font-black text-[10px] text-slate-500 uppercase px-4 p-0")}>TOTALS</TableCell>
                <TableCell className={cn(colWidths.plan, "text-center font-black text-xl text-metric-purple font-headline p-0")}>{totals.plan}</TableCell>
                <TableCell className={cn(colWidths.v1, "text-center font-black text-lg text-cyan-400 font-headline p-0")}>{totals.v1}</TableCell>
                <TableCell className={cn(colWidths.v2, "text-center font-black text-lg text-yellow-400 font-headline p-0")}>{totals.v2}</TableCell>
                <TableCell className={cn(colWidths.v3, "text-center font-black text-lg text-orange-400 font-headline p-0")}>{totals.v3}</TableCell>
                <TableCell className={cn(colWidths.totalDisp, "text-center font-black text-xl text-metric-green font-headline p-0")}>{totals.shipped}</TableCell>
                <TableCell className={cn(colWidths.pdi, "text-center font-black text-xl text-metric-blue font-headline p-0")}>{totals.pdi}</TableCell>
                <TableCell className={cn(colWidths.pending, "text-center font-black text-xl text-metric-red font-headline p-0")}>{totals.pending}</TableCell>
                <TableCell className={cn(colWidths.status, "p-0")}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}