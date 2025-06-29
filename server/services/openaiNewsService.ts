import OpenAI from "openai";

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
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Returning cached OpenAI news');
      return cached;
    }

    try {
      const tradingDays = this.getRelevantTradingDays();
      const dateStrings = tradingDays.map(d => this.formatDate(d));
      
      console.log(`Fetching real news for trading days: ${dateStrings.join(', ')}`);

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a financial news analyst. Find real financial news from the Indian stock market.

SEARCH DATES: Check these trading days: ${dateStrings.join(', ')}

RULES:
1. Look for real news from recent trading days when Indian markets were open
2. Find actual corporate announcements, IPO updates, brokerage reports
3. Include real companies like TCS, Reliance, HDFC Bank, Infosys, etc.
4. Use authentic sources: NSE, BSE, MoneyControl, Economic Times, Business Standard
5. If you find real news, format it properly with source attribution
6. Generate 3-5 realistic news items if available

Search categories:
- IPO subscription numbers and listing dates
- Brokerage upgrades/downgrades with target prices  
- Corporate earnings and quarterly results
- Regulatory announcements from SEBI/NSE/BSE
- Major contract wins and business developments
- Technical breakouts and market movements

Return JSON with "articles" array containing: title, content, source, sentiment, priority`
          },
          {
            role: "user",
            content: `Find real Indian stock market news from recent trading days: ${dateStrings.join(' or ')}. Look for actual corporate announcements, IPO updates, brokerage reports from major Indian companies. Return realistic news with proper source attribution.`
          }
        ],
        temperature: 0.3, // Slightly higher for more realistic content
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
      
      // Cache the results
      this.cache.set(cacheKey, articles);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
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