'use client';

import { useState } from 'react';
import { useApp, calculatePartMetrics } from '@/lib/store';
import { intelligentShortageForecast, type IntelligentShortageForecastOutput } from '@/ai/flows/intelligent-shortage-forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Loader2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIForecastPanel() {
  const { stocks } = useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<Record<string, IntelligentShortageForecastOutput>>({});

  const handleRunForecast = async (partNumber: string) => {
    const stock = stocks.find(s => s.partNumber === partNumber);
    if (!stock) return;

    setLoading(partNumber);
    try {
      const result = await intelligentShortageForecast({
        partNumber: stock.partNumber,
        currentPdiStock: stock.pdiStock,
        plannedDispatchNext48Hours: stock.plannedDispatch * 2, // Predictive assumption for 48h
        averageDailyDispatchLast7Days: stock.plannedDispatch, // Using current plan as proxy
      });
      setForecasts(prev => ({ ...prev, [partNumber]: result }));
    } catch (error) {
      console.error("Forecast failed:", error);
    } finally {
      setLoading(null);
    }
  };

  // Only show for parts that have a plan today
  const activeParts = stocks.filter(s => (s.plannedDispatch || 0) > 0);

  if (activeParts.length === 0) return null;

  return (
    <div className="space-y-3 shrink-0">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-primary animate-pulse" />
          <h2 className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white">AI SHORTAGE PREDICTIONS (48H)</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeParts.slice(0, 4).map((stock) => {
          const forecast = forecasts[stock.partNumber];
          const isProcessing = loading === stock.partNumber;

          return (
            <Card key={stock.partNumber} className="bg-[#071628] border-white/5 shadow-2xl rounded-xl overflow-hidden transition-all hover:border-primary/20">
              <CardHeader className="p-3 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                <CardTitle className="font-headline font-black text-sm text-[#3b82f6] tracking-widest uppercase">
                  PART {stock.partNumber}
                </CardTitle>
                {!forecast && !isProcessing && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRunForecast(stock.partNumber)}
                    className="h-6 w-6 rounded-md hover:bg-primary/20 text-primary"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-3">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center py-4 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Analyzing Trends...</span>
                  </div>
                ) : forecast ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-slate-500 uppercase">RISK LEVEL</span>
                      {forecast.predictedShortage48Hours ? (
                        <div className="flex items-center gap-1 text-red-500">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase">HIGH</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase">SAFE</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                      <p className="text-[9px] text-slate-400 font-medium leading-tight">
                        {forecast.recommendation}
                      </p>
                    </div>

                    {forecast.predictedShortage48Hours && (
                      <div className="flex justify-between items-end pt-1">
                        <span className="text-[8px] font-black text-red-500 uppercase">DEFICIT</span>
                        <span className="text-xl font-black font-headline text-red-500 leading-none">-{forecast.shortageQuantity}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Awaiting Analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
