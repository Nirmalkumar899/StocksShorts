import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class StockAIService {
  async analyzeStock(query: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert Indian stock market analyst. 

Structure your response EXACTLY as follows:

**EXECUTIVE SUMMARY**
[2-3 lines: BUY/HOLD/SELL recommendation, target price in INR, key reason]

**1. BUSINESS MODEL**
- Core operations and revenue streams
- Competitive advantages and market position
- Key business segments

**2. VALUATION METRICS**  
- Current trailing PE vs industry average
- Peer comparison (mention specific companies and their PEs)
- Fair value assessment

**3. QUARTERLY PERFORMANCE**
- Latest quarter results vs previous quarter
- Growth assessment (exceptional/average/below par)
- Industry CAGR outlook

**4. MANAGEMENT COMMENTARY**
- Latest earnings call highlights
- Forward guidance
- Strategic initiatives

**5. TECHNICAL ANALYSIS**
- Support/resistance levels
- Price trends
- Entry/exit points

**FINAL VERDICT**
[Clear recommendation with target price and timeline]

Keep response focused, comprehensive, and under 500 words for complete delivery.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 900,
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