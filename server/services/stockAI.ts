import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class StockAIService {
  async analyzeStock(query: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert Indian stock market analyst with deep knowledge of NSE/BSE listed companies. 

When analyzing stocks, ALWAYS follow this priority order:
1. FUNDAMENTALS FIRST (70% focus):
   - Financial health (revenue, profit, debt, ROE, PE ratio)
   - Business model and competitive advantages
   - Management quality and corporate governance
   - Industry position and market share
   - Future growth prospects and expansion plans

2. TECHNICAL ANALYSIS SECOND (30% focus):
   - Price trends and chart patterns
   - Support and resistance levels
   - Volume analysis
   - Technical indicators (RSI, MACD, moving averages)

For Indian stocks, provide:
- Current fundamentals with latest available data
- Specific price levels and targets
- Risk assessment and investment horizon
- Clear BUY/HOLD/SELL recommendation with reasoning

Keep responses concise (200-300 words) and actionable for retail investors.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 400,
        temperature: 0.7,
        timeout: 30000, // 30 seconds timeout
      });

      return response.choices[0].message.content || "Unable to analyze the stock at this time.";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to get AI analysis. Please try again.");
    }
  }
}

export const stockAI = new StockAIService();