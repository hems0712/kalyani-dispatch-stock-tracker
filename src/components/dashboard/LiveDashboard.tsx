"use client";

import { useApp, calculatePartMetrics } from '@/lib/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function LiveDashboard() {
  const { stocks } = useApp();

  const totals = stocks.reduce((acc, stock) => {
    const m = calculatePartMetrics(stock);
    acc.plan += m.planned;
    acc.v1 += (Number(stock.v1Load) || 0) + (Number(stock.v1Shipped) || 0);
    acc.v2 += (Number(stock.v2Load) || 0) + (Number(stock.v2Shipped) || 0);
    acc.v3 += (Number(stock.v3Load) || 0) + (Number(stock.v3Shipped) || 0);
    acc.v4 += (Number(stock.v4Load) || 0) + (Number(stock.v4Shipped) || 0);
    acc.shipped += m.shipped;
    acc.pdi += m.pdi;
    acc.pending += m.pending;
    return acc;
  }, { plan: 0, v1: 0, v2: 0, v3: 0, v4: 0, shipped: 0, pdi: 0, pending: 0 });

  const colWidths = {
    sl: "w-[40px]",
    partNo: "w-[160px]",
    plan: "w-[100px]",
    v1: "w-[80px]",
    v2: "w-[80px]",
    v3: "w-[80px]",
    v4: "w-[80px]",
    totalDisp: "w-[120px]",
    pdi: "w-[120px]",
    pending: "w-[120px]",
    status: "w-[140px]"
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-1 overflow-hidden">
      <div className="flex justify-between items-center px-1 shrink-0">
        <h2 className="font-headline text-[9px] font-black uppercase tracking-[0.25em] text-primary">PART-WISE STOCK STATUS</h2>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em]">{stocks.length} ACTIVE PARTS</span>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl flex flex-col shadow-lg overflow-hidden min-h-0">
        <div className="overflow-y-auto flex-1 custom-scrollbar min-h-0">
          <Table className="border-collapse min-w-[1100px] table-fixed">
            <TableHeader className="bg-muted sticky top-0 z-20 border-b border-border">
              <TableRow className="hover:bg-transparent h-8">
                <TableHead className={cn(colWidths.sl, "font-black text-[8px] text-muted-foreground uppercase text-center p-0")}>SL</TableHead>
                <TableHead className={cn(colWidths.partNo, "font-black text-[8px] text-muted-foreground uppercase px-4 p-0")}>PART NO.</TableHead>
                <TableHead className={cn(colWidths.plan, "font-black text-[8px] text-metric-plan uppercase text-center p-0")}>PLAN</TableHead>
                <TableHead className={cn(colWidths.v1, "font-black text-[8px] text-metric-v1 uppercase text-center p-0")}>V1</TableHead>
                <TableHead className={cn(colWidths.v2, "font-black text-[8px] text-metric-v2 uppercase text-center p-0")}>V2</TableHead>
                <TableHead className={cn(colWidths.v3, "font-black text-[8px] text-metric-v3 uppercase text-center p-0")}>V3</TableHead>
                <TableHead className={cn(colWidths.v4, "font-black text-[8px] text-metric-v4 uppercase text-center p-0")}>V4</TableHead>
                <TableHead className={cn(colWidths.totalDisp, "font-black text-[8px] text-metric-disp uppercase text-center p-0")}>TOTAL DISP.</TableHead>
                <TableHead className={cn(colWidths.pdi, "font-black text-[8px] text-metric-pdi uppercase text-center p-0")}>PDI AREA</TableHead>
                <TableHead className={cn(colWidths.pending, "font-black text-[8px] text-metric-pending uppercase text-center p-0")}>PENDING</TableHead>
                <TableHead className={cn(colWidths.status, "font-black text-[8px] text-muted-foreground uppercase text-center p-0")}>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock, index) => {
                const m = calculatePartMetrics(stock);
                const v1 = (Number(stock.v1Load) || 0) + (Number(stock.v1Shipped) || 0);
                const v2 = (Number(stock.v2Load) || 0) + (Number(stock.v2Shipped) || 0);
                const v3 = (Number(stock.v3Load) || 0) + (Number(stock.v3Shipped) || 0);
                const v4 = (Number(stock.v4Load) || 0) + (Number(stock.v4Shipped) || 0);

                return (
                  <TableRow key={stock.partNumber} className="border-b border-border hover:bg-muted/50 transition-colors h-[38px]">
                    <TableCell className={cn(colWidths.sl, "text-center text-[10px] font-black text-muted-foreground font-headline p-0")}>{index + 1}</TableCell>
                    <TableCell className={cn(colWidths.partNo, "font-black font-headline text-lg text-metric-pdi px-4 leading-none p-0")}>{stock.partNumber}</TableCell>
                    <TableCell className={cn(colWidths.plan, "text-center font-black text-lg text-metric-plan font-headline p-0")}>{m.planned || 0}</TableCell>
                    <TableCell className={cn(colWidths.v1, "text-center font-black text-base text-metric-v1 font-headline p-0")}>{v1 || '—'}</TableCell>
                    <TableCell className={cn(colWidths.v2, "text-center font-black text-lg text-metric-v2 font-headline p-0")}>{v2 || '—'}</TableCell>
                    <TableCell className={cn(colWidths.v3, "text-center font-black text-lg text-metric-v3 font-headline p-0")}>{v3 || '—'}</TableCell>
                    <TableCell className={cn(colWidths.v4, "text-center font-black text-lg text-metric-v4 font-headline p-0")}>{v4 || '—'}</TableCell>
                    <TableCell className={cn(colWidths.totalDisp, "text-center font-black text-lg text-metric-disp font-headline p-0")}>{m.shipped || 0}</TableCell>
                    <TableCell className={cn(colWidths.pdi, "text-center font-black text-lg text-metric-pdi font-headline p-0")}>{m.pdi || 0}</TableCell>
                    <TableCell className={cn(colWidths.pending, "text-center font-black text-lg text-metric-pending font-headline p-0")}>{m.pending || 0}</TableCell>
                    <TableCell className={cn(colWidths.status, "text-center p-0")}>
                      <div className={cn(
                        "text-[7px] font-black uppercase px-2 py-0.5 rounded border leading-none tracking-widest inline-block", 
                        m.status === 'red' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                        (m.status === 'yellow' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
                        "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")
                      )}>
                        {m.statusText}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="bg-muted border-t border-border shrink-0 z-20">
          <Table className="border-collapse min-w-[1100px] table-fixed">
            <TableBody>
              <TableRow className="hover:bg-transparent border-none h-10">
                <TableCell className={cn(colWidths.sl, "p-0")}></TableCell>
                <TableCell className={cn(colWidths.partNo, "font-black text-[9px] text-muted-foreground uppercase px-4 p-0")}>SHIFT TOTALS</TableCell>
                <TableCell className={cn(colWidths.plan, "text-center font-black text-xl text-metric-plan font-headline p-0")}>{totals.plan}</TableCell>
                <TableCell className={cn(colWidths.v1, "text-center font-black text-lg text-metric-v1 font-headline p-0")}>{totals.v1}</TableCell>
                <TableCell className={cn(colWidths.v2, "text-center font-black text-lg text-metric-v2 font-headline p-0")}>{totals.v2}</TableCell>
                <TableCell className={cn(colWidths.v3, "text-center font-black text-lg text-metric-v3 font-headline p-0")}>{totals.v3}</TableCell>
                <TableCell className={cn(colWidths.v4, "text-center font-black text-lg text-metric-v4 font-headline p-0")}>{totals.v4}</TableCell>
                <TableCell className={cn(colWidths.totalDisp, "text-center font-black text-xl text-metric-disp font-headline p-0")}>{totals.shipped}</TableCell>
                <TableCell className={cn(colWidths.pdi, "text-center font-black text-xl text-metric-pdi font-headline p-0")}>{totals.pdi}</TableCell>
                <TableCell className={cn(colWidths.pending, "text-center font-black text-xl text-metric-pending font-headline p-0")}>{totals.pending}</TableCell>
                <TableCell className={cn(colWidths.status, "p-0")}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}