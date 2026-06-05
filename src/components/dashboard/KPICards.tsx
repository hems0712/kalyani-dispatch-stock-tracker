
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
    acc.balance += m.balance;
    if (m.status === 'red') acc.shortageCount += 1;
    return acc;
  }, { pdi: 0, plan: 0, dispatched: 0, pending: 0, balance: 0, shortageCount: 0 });

  const cards = [
    { label: "TOTAL PLAN", value: metrics.plan, color: 'text-metric-purple', border: 'border-t-metric-purple' },
    { label: 'DISPATCH', value: metrics.dispatched, color: 'text-metric-green', border: 'border-t-metric-green' },
    { label: 'PENDING', value: metrics.pending, color: 'text-metric-red', border: 'border-t-metric-red' },
    { label: "TOTAL PDI STOCK", value: metrics.pdi, color: 'text-metric-blue', border: 'border-t-metric-blue' },
    { label: 'SHORTAGE', value: metrics.shortageCount, color: 'text-metric-red', border: 'border-t-metric-red' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 shrink-0">
      {cards.map((card, i) => (
        <Card key={i} className={cn("border-0 border-t-2 bg-[#071628] shadow-2xl rounded-xl overflow-hidden", card.border)}>
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <span className={cn("text-2xl font-black font-headline leading-none tracking-[0.2em]", card.color)}>
              {card.value}
            </span>
            <p className="text-[11px] font-black font-headline uppercase tracking-[0.2em] text-slate-400 mt-1.5">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
