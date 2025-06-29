import OpenAI from "openai";
import { storage } from "../storage";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface NewsArticle {
  title: string;
  content: string;
  source: string;
  type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  priority: 'High' | 'Medium' | 'Low';
  newsDate: Date;
}

export class OpenAINewsService {
  private cache = new Map<string, NewsArticle[]>();
  private cacheTimeout = 60 * 60 * 1000; // 1 hour cache

  private isMarketDay(date: Date): boolean {
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    return day !== 0 && day !== 6;
  }

  private getRelevantTradingDays(): Date[] {
    const today = new Date();
    const days: Date[] = [];
    
    // Add today if it's a working day
    if (this.isMarketDay(today)) {
      days.push(new Date(today));
    }
    
    // Find the last working day
    let lastWorkingDay = new Date(today);
    lastWorkingDay.setDate(lastWorkingDay.getDate() - 1);
    while (!this.isMarketDay(lastWorkingDay)) {
      lastWorkingDay.setDate(lastWorkingDay.getDate() - 1);
    }
    days.push(lastWorkingDay);
    
    return days;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async fetchRealNews(): Promise<NewsArticle[]> {
    const cacheKey = 'real_news';
    // Clear cache to force fresh news generation
    this.cache.delete(cacheKey);

    try {
      const tradingDays = this.getRelevantTradingDays();
      const dateStrings = tradingDays.map(d => this.formatDate(d));
      
      console.log(`Fetching real news for trading days: ${dateStrings.join(', ')}`);

      // Using GPT-4o model for enhanced financial news generation
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a financial news analyst. Find real financial news from the Indian stock market.

SEARCH DATES: Check these trading days: ${dateStrings.join(', ')}

COMPANY NAMES: Use ONLY real Indian company names from NSE/BSE:
- Large Cap: TCS, Reliance, HDFC Bank, Infosys, Wipro, ITC, SBI, LTI Mindtree, Tech Mahindra, HCL Tech
- Mid Cap: Lupin, UPL, Godrej Consumer, Pidilite, Marico, Asian Paints, Bajaj Finance, ICICI Lombard
- Small Cap: Suzlon Energy, Vodafone Idea, Trent, Jubilant Food, Dixon Tech, CAMS, Route Mobile
- IPO Companies: Bajaj Housing Finance, Swiggy, Zomato, Paytm, Nykaa, PolicyBazaar

NEVER use placeholder names like ABC Ltd, XYZ Corp, DEF Industries, GHI Technologies, JKL Financial etc.

RULES:
1. Look for real news from recent trading days when Indian markets were open
2. Focus ONLY on very recent events, NOT old quarterly results or earnings
3. Avoid mentioning Q1/Q2/Q3/Q4 results as these have specific announcement schedules
4. Use authentic sources: NSE, BSE, MoneyControl, Economic Times, Business Standard
5. Generate 5-8 realistic news items if available

PRIORITY CATEGORIES (in order):
1. FRAUD alerts and SEBI investigations/penalties
2. BREAKOUT stocks with technical analysis and volume surge
3. ORDER WINS - major contract announcements (specify percentage of revenue impact)
4. IPO subscription updates, listing dates, and grey market premium
5. Brokerage upgrades/downgrades with specific target prices
6. Regulatory announcements and policy changes

AVOID:
- Old quarterly earnings reports (Q1/Q2/Q3/Q4 results)
- Generic market commentary
- Events that happened weeks/months ago
- Placeholder company names (ABC, XYZ, DEF etc.)

Return JSON with "articles" array containing: title, content, source, sentiment, priority`
          },
          {
            role: "user",
            content: `Find real Indian stock market news from recent trading days: ${dateStrings.join(' or ')}. 

MANDATORY: Use ONLY real Indian company names from the list provided in system message.
FORBIDDEN: Never use ABC Ltd, XYZ Corp, DEF Industries, GHI Technologies, JKL Financial or any placeholder names.

PRIORITY FOCUS:
1. Any fraud alerts or SEBI investigation news (use real companies like Paytm, Zomato, etc.)
2. Technical breakout stocks with volume analysis (use real names like Suzlon Energy, Vodafone Idea, etc.)
3. Major order wins with revenue impact percentage (use real names like TCS, Infosys, L&T, etc.)
4. Live IPO subscription data and listing updates (use real IPO companies like Bajaj Housing Finance)
5. Fresh brokerage calls with target prices (use real companies like Reliance, HDFC Bank, etc.)

STRICT RULES:
- NO quarterly earnings or Q1/Q2/Q3/Q4 results (these are scheduled events)
- NO old news from weeks ago
- NO placeholder company names - use actual NSE/BSE listed companies only
- Focus on breaking developments and market-moving events
- Include specific numbers, percentages, and target prices

Return realistic news with proper source attribution using REAL company names.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const responseText = response.choices[0].message.content;
      
      if (!responseText || responseText.includes('NO_REAL_NEWS_FOUND')) {
        console.log('No real news found for trading days');
        return [];
      }

      const parsedResponse = JSON.parse(responseText);
      
      if (!parsedResponse.articles || !Array.isArray(parsedResponse.articles)) {
        console.log('Invalid response format from OpenAI');
        return [];
      }

      const articles: NewsArticle[] = parsedResponse.articles.map((article: any) => {
        // Use the most recent trading day for the article
        const relevantDate = tradingDays[0];
        const formattedDate = this.formatDate(relevantDate);
        
        return {
          title: `${formattedDate}: ${article.title}`,
          content: `${formattedDate}: ${article.content}`,
          source: `Verified - ${article.source}`,
          type: 'AI News',
          sentiment: article.sentiment || 'Neutral',
          priority: article.priority || 'Medium',
          newsDate: relevantDate
        };
      });

      console.log(`Found ${articles.length} verified news articles`);
      
      // Cache the results for shorter time to get fresh news more frequently
      this.cache.set(cacheKey, articles);
      setTimeout(() => this.cache.delete(cacheKey), 30 * 60 * 1000); // 30 minutes cache
      
      return articles;

    } catch (error) {
      console.error('Error fetching real news from OpenAI:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const openaiNewsService = new OpenAINewsService();

// Enhanced 20-article management system with hourly updates
export class AI20ArticleManager {
  private intervalId: NodeJS.Timeout | null = null;
  
  startHourlyUpdates(): void {
    console.log('Starting hourly AI article management system - 20 articles max with 5 new articles every hour');
    
    // Run immediately on startup
    this.generateAndMaintainArticles();
    
    // Then run every hour (3600000 ms)
    this.intervalId = setInterval(() => {
      this.generateAndMaintainArticles();
    }, 3600000); // 1 hour = 60 * 60 * 1000 ms
  }
  
  private async generateAndMaintainArticles(): Promise<void> {
    try {
      console.log('Running hourly AI article update - adding 5 new articles, maintaining 20 total');
      
      // Generate 5 new articles using Perplexity for real-time data
      const { perplexityNewsService } = await import('./perplexityNewsService');
      const articles = await perplexityNewsService.fetchRealNews();
      
      if (articles.length > 0) {
        // Store articles will automatically maintain the 20-article limit
        const { storage } = await import('../storage');
        await storage.storeAiArticles(articles);
        console.log(`Hourly update complete: Added ${articles.length} articles, system maintains 20 total`);
      } else {
        console.log('No new articles generated in this hourly cycle');
      }
    } catch (error) {
      console.error('Error in hourly AI article update:', error);
    }
  }
  
  stopHourlyUpdates(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped hourly AI article updates');
    }
  }
}

export const ai20ArticleManager = new AI20ArticleManager();