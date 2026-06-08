'use server';
/**
 * @fileOverview An AI agent that predicts potential stock shortages 48 hours in advance for a given part.
 *
 * - intelligentShortageForecast - A function that predicts stock shortages based on current PDI stock and planned dispatches.
 * - IntelligentShortageForecastInput - The input type for the intelligentShortageForecast function.
 * - IntelligentShortageForecastOutput - The return type for the intelligentShortageForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentShortageForecastInputSchema = z.object({
  partNumber: z.string().describe('The part number to forecast for.'),
  currentPdiStock: z.number().int().min(0).describe('The current PDI available stock for the part.'),
  plannedDispatchNext48Hours: z.number().int().min(0).describe('The total planned dispatch quantity for this part over the next 48 hours.'),
  averageDailyDispatchLast7Days: z.number().int().min(0).optional().describe('Optional: The average daily dispatch quantity of this part over the last 7 days.'),
});
export type IntelligentShortageForecastInput = z.infer<typeof IntelligentShortageForecastInputSchema>;

const IntelligentShortageForecastOutputSchema = z.object({
  partNumber: z.string().describe('The part number for which the prediction is made.'),
  predictedShortage48Hours: z.boolean().describe('True if a stock shortage is predicted for the next 48 hours, false otherwise.'),
  shortageQuantity: z.number().int().min(0).describe('The predicted quantity of shortage. This is calculated as Planned Dispatch - Current PDI Stock.'),
  availableStockAtPredictionTime: z.number().int().min(0).describe('The PDI stock available at the time of prediction.'),
  requiredStockFor48Hours: z.number().int().min(0).describe('The total stock required for the next 48 hours based on the planned dispatch.'),
  recommendation: z.string().describe('A proactive recommendation based on the prediction to prevent or mitigate shortages.'),
});
export type IntelligentShortageForecastOutput = z.infer<typeof IntelligentShortageForecastOutputSchema>;

const shortageForecastPrompt = ai.definePrompt({
  name: 'shortageForecastPrompt',
  input: { schema: IntelligentShortageForecastInputSchema },
  output: { schema: IntelligentShortageForecastOutputSchema },
  prompt: `You are an expert supply chain analyst specialized in predicting stock shortages for manufacturing parts. Your goal is to provide a precise prediction for part "{{partNumber}}" regarding potential stock shortages over the next 48 hours.

Here is the data:
- Part Number: {{partNumber}}
- Current PDI Stock: {{currentPdiStock}}
- Total Planned Dispatch for the next 48 hours: {{plannedDispatchNext48Hours}}
{{#if averageDailyDispatchLast7Days}}
- Average Daily Dispatch over the last 7 days: {{averageDailyDispatchLast7Days}}
{{/if}}

Perform the following steps:
1. Determine 'requiredStockFor48Hours': This is the 'Total Planned Dispatch for the next 48 hours'.
2. Compare 'currentPdiStock' with 'requiredStockFor48Hours'.
3. Set 'predictedShortage48Hours': True if 'currentPdiStock' is less than 'requiredStockFor48Hours', otherwise False.
4. Calculate 'shortageQuantity': If 'predictedShortage48Hours' is True, then 'shortageQuantity' is 'requiredStockFor48Hours' minus 'currentPdiStock'. Otherwise, 'shortageQuantity' is 0.
5. Provide 'availableStockAtPredictionTime': This is the 'currentPdiStock'.
6. Generate a 'recommendation':
   - If a shortage is predicted, recommend actions like "Increase production priority," "Review alternative suppliers," or "Adjust dispatch schedule."
   - If no shortage is predicted, but 'currentPdiStock' is very close to 'requiredStockFor48Hours' (e.g., within 5%), suggest "Monitor closely due to tight stock levels."
   - Mention any unusually high demand if 'plannedDispatchNext48Hours' is significantly higher than historical averages.

Ensure your output strictly adheres to the JSON schema.`,
});

const intelligentShortageForecastFlow = ai.defineFlow(
  {
    name: 'intelligentShortageForecastFlow',
    inputSchema: IntelligentShortageForecastInputSchema,
    outputSchema: IntelligentShortageForecastOutputSchema,
  },
  async (input) => {
    const { output } = await shortageForecastPrompt(input);

    if (!output) {
      throw new Error("No output received from the AI model for shortage forecast.");
    }

    return output;
  }
);

export async function intelligentShortageForecast(input: IntelligentShortageForecastInput): Promise<IntelligentShortageForecastOutput> {
  return intelligentShortageForecastFlow(input);
}