
"use client";

import { useApp, calculatePartMetrics } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function KPICards() {
  const { stocks } = useApp();

  const metrics = stocks.reduce((acc, stock) => {
    const m = calculatePartMetrics(stock);
    acc.pdi += m.pdi;
    acc.plan += m.planned;
    acc.dispatched += m.shipped;
    acc.pending += m.pending;
    if (m.shortageQuantity > 0) acc.shortage += m.shortageQuantity;
    return acc;
  }, { pdi: 0, plan: 0, dispatched: 0, pending: 0, shortage: 0 });

  const cards = [
    { label: "TOTAL PLAN", value: metrics.plan, color: 'text-metric-plan', border: 'border-t-metric-plan' },
    { label: 'DISPATCH', value: metrics.dispatched, color: 'text-metric-disp', border: 'border-t-metric-disp' },
    { label: 'PENDING', value: metrics.pending, color: 'text-metric-pending', border: 'border-t-metric-pending' },
    { label: "RFD STOCK", value: metrics.pdi, color: 'text-metric-pdi', border: 'border-t-metric-pdi' },
    { label: 'SHORTAGE', value: metrics.shortage > 0 ? metrics.shortage : 0, color: 'text-metric-pending', border: 'border-t-metric-pending' },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 shrink-0 px-1">
      {cards.map((card, i) => (
        <Card key={i} className={cn(
          "border-0 border-t-[4px] bg-card shadow-xl rounded-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-2xl dark:bg-card/90", 
          card.border
        )}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <span className={cn("text-4xl font-black font-headline leading-none tracking-tight drop-shadow-md", card.color)}>
              {card.value.toLocaleString()}
            </span>
            <p className="text-[10px] font-black font-headline uppercase tracking-[0.25em] text-muted-foreground mt-3">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
