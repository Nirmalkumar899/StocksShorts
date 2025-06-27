import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class StockAIService {
  async analyzeStock(query: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert Indian stock market analyst with deep knowledge of NSE/BSE listed companies. 

When analyzing stocks, ALWAYS follow this EXACT analysis structure:

1. BUSINESS MODEL ANALYSIS (25%):
   - Core business operations and revenue streams
   - Competitive moats and market positioning
   - Key business segments and their contributions

2. VALUATION METRICS (25%):
   - Current trailing PE ratio vs industry average PE
   - Compare with sector peers' PE ratios
   - Assess if fairly valued, undervalued, or overvalued

3. QUARTERLY PERFORMANCE (25%):
   - Latest quarter results vs previous quarter
   - Revenue and profit growth rates
   - Assess if growth was average, below par, or exceptional
   - Industry CAGR outlook and company's position

4. MANAGEMENT ASSESSMENT (15%):
   - Management commentary from latest earnings call
   - Forward guidance provided by management
   - Strategic initiatives and expansion plans

5. TECHNICAL ANALYSIS (10%):
   - Key support and resistance levels
   - Price trends and momentum
   - Entry/exit points

FINAL VERDICT: Based on above analysis, provide clear BUY/HOLD/SELL recommendation with target price and timeline.

Focus on Indian market context, use INR pricing, and reference NSE/BSE data. Keep response structured and actionable for retail investors (250-350 words).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      return response.choices[0].message.content || "Unable to analyze the stock at this time.";
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to get AI analysis. Please try again.");
    }
  }
}

export const stockAI = new StockAIService();