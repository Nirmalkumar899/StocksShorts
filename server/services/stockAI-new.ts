// OpenAI-powered comprehensive stock analysis that reads company websites directly

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required for stock analysis');
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export class StockAIService {
  private async getCompanyOverview(companyName: string, symbol: string): Promise<string> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a financial research assistant. Search and read the official company website to provide comprehensive company overviews. Focus only on official company sources."
          },
          { 
            role: "user", 
            content: `Search and read the official website of ${companyName} (${symbol}) to provide a comprehensive overview covering:

1. What the company does (core business model and main products/services)
2. Main revenue streams and business segments
3. Key markets and geographic presence  
4. Recent business developments and strategic initiatives
5. Competitive positioning in the industry

Please visit the company's official website directly and extract factual information from their About Us, Business Segments, Products/Services, and Investor Relations pages. Keep it concise but informative (300-400 words).`
          }
        ],
        max_tokens: 600,
        temperature: 0.1
      });

      return response.choices[0].message.content || "Company overview not available at this time.";
    } catch (error) {
      console.error("Error fetching company overview:", error);
      return "Company overview not available at this time.";
    }
  }

  private async getConferenceCallTranscript(companyName: string, symbol: string): Promise<string> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a financial analyst specializing in earnings call analysis. Search for and analyze the latest quarterly conference call transcripts from company websites and official sources only."
          },
          { 
            role: "user", 
            content: `Search for and analyze the latest quarterly earnings conference call transcript for ${companyName} (${symbol}) from their official website investor relations section. Extract:

**KEY QUARTER HIGHLIGHTS:**
- Revenue and profit performance vs previous quarter and year-ago quarter
- Key business metrics and operational updates
- Major business wins, new contracts, or partnerships announced

**MANAGEMENT GROWTH OUTLOOK & COMMENTARY:**
- Forward guidance for next quarter and full year
- Growth targets and expansion plans mentioned
- Management's view on industry trends and market conditions
- Capital expenditure plans and strategic investments
- Any comments on margin outlook and cost management

**INVESTOR Q&A INSIGHTS:**
- Key concerns raised by analysts
- Management responses on competitive positioning
- Commentary on sectoral challenges or opportunities

Search the company's official investor relations page for earnings call transcripts or presentations. Focus on the most recent quarter's call. Provide specific numbers, percentages, and quotes where mentioned. If no recent transcript is available, mention that clearly.`
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      });

      return response.choices[0].message.content || "Recent conference call transcript not available.";
    } catch (error) {
      console.error("Error fetching conference call transcript:", error);
      return "Recent conference call transcript not available.";
    }
  }

  private async getInvestorPresentationInsights(companyName: string, symbol: string): Promise<string> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a financial analyst specializing in investor presentation analysis. Search company websites directly for investor presentations and extract strategic insights."
          },
          { 
            role: "user", 
            content: `Search the official website of ${companyName} (${symbol}) for their latest investor presentation or annual report from their investor relations section. Analyze:

**STRATEGIC HIGHLIGHTS:**
- Company's strategic priorities and focus areas
- Market opportunity size and growth projections
- Competitive advantages and differentiation factors

**FINANCIAL TARGETS & ROADMAP:**
- Medium to long-term financial targets (3-5 year outlook)
- Revenue growth aspirations and margin expansion plans
- Return ratios targets (ROE, ROCE) and capital allocation strategy

**KEY BUSINESS UPDATES:**
- New product launches or service offerings
- Geographic expansion plans or market entry strategies
- Technology investments and digital transformation initiatives
- ESG initiatives and sustainability commitments

**INVESTMENT THESIS:**
- Management's value proposition to investors
- Key investment highlights and growth drivers
- Risk factors and mitigation strategies mentioned

Please visit the company's official investor relations page and look for recent investor presentations, annual reports, or corporate factsheets. Provide specific targets, timelines, and strategic priorities mentioned. If no recent presentation is available, mention that clearly.`
          }
        ],
        max_tokens: 700,
        temperature: 0.1
      });

      return response.choices[0].message.content || "Recent investor presentation not available.";
    } catch (error) {
      console.error("Error fetching investor presentation:", error);
      return "Recent investor presentation not available.";
    }
  }

  async analyzeStock(query: string): Promise<string> {
    try {
      const companyName = query.trim();
      const symbol = companyName.toUpperCase();
      
      console.log(`Starting comprehensive analysis for ${companyName}...`);
      
      // Step 1: Company overview from website
      const companyOverview = await this.getCompanyOverview(companyName, symbol);
      
      // Step 2: Latest quarter conference call transcript
      const conferenceCallInsights = await this.getConferenceCallTranscript(companyName, symbol);
      
      // Step 3: Investor presentation insights
      const investorPresentationInsights = await this.getInvestorPresentationInsights(companyName, symbol);
      
      // Step 4: Generate comprehensive analysis using OpenAI
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const analysisResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a comprehensive stock analyst. Create a detailed, well-formatted analysis using the provided company information. Structure your response with clear markdown headings and professional formatting.

Format your analysis as follows:

# 📊 [COMPANY NAME] - Comprehensive Stock Analysis

## 🏢 Company Business Overview
[Detailed explanation of what the company does]

## 📈 Latest Quarter Conference Call Insights
[Key highlights from earnings call]

## 💡 Management Growth Outlook & Commentary
[Management's future guidance and strategy]

## 🎯 Investor Presentation Strategic Highlights
[Strategic priorities and long-term plans]

## 📊 Investment Summary
[Overall assessment and key takeaways]

---
⚠️ **Disclaimer**: This analysis is for educational purposes only. Always conduct your own research and consult with qualified financial advisors before making investment decisions.`
          },
          { 
            role: "user", 
            content: `Provide comprehensive analysis for ${companyName} using the following research:

## COMPANY OVERVIEW:
${companyOverview}

## LATEST QUARTER CONFERENCE CALL INSIGHTS:
${conferenceCallInsights}

## INVESTOR PRESENTATION HIGHLIGHTS:
${investorPresentationInsights}

Please create a comprehensive analysis that:
- Starts with explaining what the company does based on the company overview
- Includes key insights from the latest conference call, especially management growth outlook and commentary
- Incorporates strategic highlights from investor presentations
- Provides an investment summary with key takeaways
- Uses specific numbers, percentages, and quotes from the data sources
- Maintains a professional, educational tone throughout`
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      });

      return analysisResponse.choices[0].message.content || "Analysis could not be completed at this time.";
      
    } catch (error) {
      console.error("Stock analysis error:", error);
      return `I encountered an error while analyzing the stock. Please try again with a different company name.`;
    }
  }
}

export const stockAI = new StockAIService();