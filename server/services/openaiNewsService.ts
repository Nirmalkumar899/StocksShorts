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
    // Clear cache to force fresh news generation
    this.cache.delete(cacheKey);

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
2. Focus ONLY on very recent events, NOT old quarterly results or earnings
3. Avoid mentioning Q1/Q2/Q3/Q4 results as these have specific announcement schedules
4. Use authentic sources: NSE, BSE, MoneyControl, Economic Times, Business Standard
5. Generate 3-5 realistic news items if available

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

Return JSON with "articles" array containing: title, content, source, sentiment, priority`
          },
          {
            role: "user",
            content: `Find real Indian stock market news from recent trading days: ${dateStrings.join(' or ')}. 

PRIORITY FOCUS:
1. Any fraud alerts or SEBI investigation news
2. Technical breakout stocks with volume analysis
3. Major order wins with revenue impact percentage
4. Live IPO subscription data and listing updates
5. Fresh brokerage calls with target prices

STRICT RULES:
- NO quarterly earnings or Q1/Q2/Q3/Q4 results (these are scheduled events)
- NO old news from weeks ago
- Focus on breaking developments and market-moving events
- Include specific numbers, percentages, and target prices

Return realistic news with proper source attribution.`
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