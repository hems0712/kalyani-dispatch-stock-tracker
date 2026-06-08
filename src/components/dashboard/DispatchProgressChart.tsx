"use client";

import { useApp, calculatePartMetrics } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function DispatchProgressChart() {
  const { stocks } = useApp();

  // Prepare data for the top 5 parts by target quantity
  const data = stocks
    .map(stock => {
      const metrics = calculatePartMetrics(stock);
      return {
        name: stock.partNumber,
        target: metrics.planned,
        actual: metrics.shipped,
      };
    })
    .sort((a, b) => b.target - a.target)
    .slice(0, 5);

  if (data.length === 0) return null;

  return (
    <Card className="flex-1 bg-[#0a0f1c]/50 border-white/5 shadow-2xl rounded-xl overflow-hidden flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/5">
        <CardTitle className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          DISPATCH ACHIEVEMENT (TOP 5 PARTS)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingBottom: '10px' }}
            />
            <Bar dataKey="target" fill="#a855f7" radius={[4, 4, 0, 0]} name="TARGET" barSize={12} />
            <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="ACTUAL" barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
