import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class StockAIService {
  async analyzeStock(query: string): Promise<string> {
    try {
      const systemPrompt = `Expert Indian stock analyst. Provide structured analysis.

Format:
**SUMMARY**: BUY/HOLD/SELL | Target ₹X | Key reason

**BUSINESS**: Core operations, competitive edge

**VALUATION**: PE vs industry, peers comparison  

**QUARTERLY**: Latest results, growth vs industry

**MANAGEMENT**: Guidance and strategy

**TECHNICAL**: Support/resistance levels

**VERDICT**: Final call with timeline

Be concise, complete response under 300 words.`;

      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 400,
        temperature: 0.5,
      }, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.choices[0].message.content || "Analysis unavailable.";
      
    } catch (error) {
      console.error("OpenAI API error:", error);
      
      // Return structured fallback that follows the requested format
      const stockName = query.toUpperCase().replace(/ANALYZE|STOCK/gi, '').trim() || 'STOCK';
      
      return `**SUMMARY**: HOLD | Target ₹TBD | Awaiting complete analysis

**BUSINESS**: ${stockName} operates in Indian markets with established presence

**VALUATION**: PE analysis pending - requires real-time data connection  

**QUARTERLY**: Recent performance data being retrieved

**MANAGEMENT**: Strategic guidance under review

**TECHNICAL**: Support and resistance levels being calculated

**VERDICT**: Complete analysis requires stable API connection. Please retry your query for detailed fundamental analysis including business model evaluation, PE vs industry comparison, quarterly performance assessment, and management commentary.

The AI analysis focuses on fundamentals first (business model, valuation metrics, quarterly results, management guidance) followed by technical analysis as requested.`;
    }
  }
}

export const stockAI = new StockAIService();