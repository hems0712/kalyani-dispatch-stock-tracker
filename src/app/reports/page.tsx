'use client';

import { useApp, calculatePartMetrics } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Printer, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function ReportsModule() {
  const { stocks } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["SL", "Part Number", "PDI Stock", "Dispatch Plan", "V1 Shipped", "V2 Shipped", "V3 Shipped", "V4 Shipped", "Total Dispatched", "Pending", "Shortage", "Status"];
    const rows = stocks.map((s, index) => {
      const m = calculatePartMetrics(s);
      return [
        index + 1,
        s.partNumber,
        s.pdiStock,
        s.plannedDispatch,
        s.v1Shipped,
        s.v2Shipped,
        s.v3Shipped,
        s.v4Shipped,
        s.shippedQuantity,
        m.pending,
        m.shortageQuantity,
        m.statusText
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dispatch_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Daily Dispatch CSV report has been generated.",
    });
  };

  return (
    <div className="space-y-4 w-full p-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 px-1">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-headline font-black text-foreground uppercase tracking-tighter">INSIGHT REPORTS</h1>
          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">FACTORY PERFORMANCE & STOCK HEALTH AUDIT</p>
        </div>
        <div className="flex gap-2 flex-wrap print:hidden">
          <Button variant="outline" size="sm" className="gap-1.5 border-border text-[8px] font-black uppercase h-8 px-4 rounded-md bg-accent hover:bg-accent/80 text-foreground">
            <Filter className="w-3 h-3" />
            FILTER
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 border-border text-[8px] font-black uppercase h-8 px-4 rounded-md bg-accent hover:bg-accent/80 text-foreground"
          >
            <FileDown className="w-3 h-3" />
            CSV
          </Button>
          <Button 
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 h-8 px-6 text-[8px] font-black uppercase rounded-md bg-primary text-primary-foreground shadow-lg shadow-primary/10"
          >
            <Printer className="w-3 h-3" />
            PRINT
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="bg-card border-border shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-accent/30 py-2 px-4">
            <CardTitle className="font-headline font-black text-base flex items-center justify-between uppercase text-foreground">
              SHORTAGE AUDIT
              <Badge variant="destructive" className="font-black text-[7px] uppercase tracking-widest py-0.5 px-2 rounded-sm">CRITICAL</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="table-fixed">
              <TableHeader className="bg-accent/20">
                <TableRow className="border-b border-border hover:bg-transparent h-8">
                  <TableHead className="font-black text-[8px] uppercase text-center w-[30px] text-muted-foreground p-0">SL</TableHead>
                  <TableHead className="font-black text-[8px] uppercase px-4 text-muted-foreground p-0">PART NO</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-center text-metric-plan p-0">REQ.</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-center text-metric-pdi p-0">AVAIL.</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-right px-4 text-metric-pending p-0">DEFICIT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((s, index) => {
                  const m = calculatePartMetrics(s);
                  if (m.shortageQuantity === 0) return null;
                  return (
                    <TableRow key={s.partNumber} className="border-b border-border hover:bg-red-500/5 h-10">
                      <TableCell className="text-center text-[10px] font-black text-muted-foreground font-headline p-0">{index + 1}</TableCell>
                      <TableCell className="font-black font-headline text-xl px-4 text-metric-pdi leading-none p-0">{s.partNumber}</TableCell>
                      <TableCell className="text-center font-headline font-black text-base text-metric-plan p-0">{s.plannedDispatch}</TableCell>
                      <TableCell className="text-center font-headline font-black text-base text-metric-pdi p-0">{m.availableStock}</TableCell>
                      <TableCell className="text-right text-metric-pending font-headline font-black text-xl px-4 p-0">-{m.shortageQuantity}</TableCell>
                    </TableRow>
                  );
                })}
                {stocks.every(s => calculatePartMetrics(s).shortageQuantity === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-[10px] font-black uppercase text-emerald-500 tracking-widest">Zero Shortages Detected</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="border-b border-border bg-accent/30 py-2 px-4">
            <CardTitle className="font-headline font-black text-base flex items-center justify-between uppercase text-foreground">
              DISPATCH STATS
              <Badge className="bg-metric-disp text-white font-black text-[7px] uppercase tracking-widest py-0.5 px-2 rounded-sm">SHIPPED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <Table className="table-fixed">
              <TableHeader className="bg-accent/20">
                <TableRow className="border-b border-border hover:bg-transparent h-8">
                  <TableHead className="font-black text-[8px] uppercase text-center w-[30px] text-muted-foreground p-0">SL</TableHead>
                  <TableHead className="font-black text-[8px] uppercase px-4 text-muted-foreground p-0">PART NO</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-center text-metric-v1 p-0">V1</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-center text-metric-v2 p-0">V2</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-center text-metric-v3 p-0">V3</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-center text-metric-v4 p-0">V4</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-center text-muted-foreground p-0">STATUS</TableHead>
                  <TableHead className="font-black text-[8px] uppercase text-right px-4 text-metric-disp p-0">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((s, index) => {
                  const m = calculatePartMetrics(s);
                  return (
                    <TableRow key={s.partNumber} className="border-b border-border hover:bg-accent/10 h-10">
                      <TableCell className="text-center text-[10px] font-black text-muted-foreground font-headline p-0">{index + 1}</TableCell>
                      <TableCell className="font-black font-headline text-xl px-4 text-metric-pdi leading-none p-0">{s.partNumber}</TableCell>
                      <TableCell className="text-center font-headline font-black text-base text-metric-v1 p-0">{s.v1Shipped}</TableCell>
                      <TableCell className="text-center font-headline font-black text-base text-metric-v2 p-0">{s.v2Shipped}</TableCell>
                      <TableCell className="text-center font-headline font-black text-base text-metric-v3 p-0">{s.v3Shipped}</TableCell>
                      <TableCell className="text-center font-headline font-black text-base text-metric-v4 p-0">{s.v4Shipped}</TableCell>
                      <TableCell className="text-center p-0">
                        <div className={cn(
                          "text-[7px] font-black uppercase px-1.5 py-0.5 rounded border leading-none tracking-widest inline-flex items-center gap-1.5 border-2",
                          m.status === 'red' ? "bg-red-500/10 text-red-500 border-red-500/30" :
                          m.status === 'yellow' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" :
                          "bg-green-500/10 text-green-500 border-green-500/30"
                        )}>
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            m.status === 'red' ? "bg-red-500" :
                            m.status === 'yellow' ? "bg-yellow-500" : "bg-green-500"
                          )} />
                          {m.statusText}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-headline font-black text-xl text-metric-disp px-4 p-0">
                        {s.shippedQuantity}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full overflow-hidden">
        <ReportsModule />
      </main>
    </div>
  );
}
