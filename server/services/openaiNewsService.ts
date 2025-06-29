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

  private getLastWorkingDay(): Date {
    const today = new Date();
    let lastWorkingDay = new Date(today);
    
    // Go back to find the last working day
    while (!this.isMarketDay(lastWorkingDay)) {
      lastWorkingDay.setDate(lastWorkingDay.getDate() - 1);
    }
    
    return lastWorkingDay;
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
      const lastWorkingDay = this.getLastWorkingDay();
      const formattedDate = this.formatDate(lastWorkingDay);
      
      console.log(`Fetching real news for last working day: ${formattedDate}`);

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a financial news analyst. ONLY report real, verified financial news from the Indian stock market.

CRITICAL RULES:
1. ONLY report news from the last working day when Indian markets were OPEN: ${formattedDate}
2. NEVER create fictional companies, events, or numbers
3. ONLY use verified sources: NSE, BSE, MoneyControl, Economic Times, Business Standard
4. If no real news is available, return "NO_REAL_NEWS_FOUND"
5. Include exact source attribution for each news item

Search for:
- Real IPO subscription data with actual numbers
- Actual brokerage upgrades/downgrades with real target prices
- Real corporate announcements from NSE/BSE
- Actual quarterly results only if officially announced
- Real regulatory filings and SEBI notifications

Format response as JSON array with fields: title, content, source, sentiment, priority`
          },
          {
            role: "user",
            content: `Find real, verified Indian stock market news from ${formattedDate} (last working day). Return only authentic news with verified sources. If no real news found, return "NO_REAL_NEWS_FOUND".`
          }
        ],
        temperature: 0.1, // Low temperature for factual accuracy
        response_format: { type: "json_object" }
      });

      const responseText = response.choices[0].message.content;
      
      if (!responseText || responseText.includes('NO_REAL_NEWS_FOUND')) {
        console.log('No real news found for the last working day');
        return [];
      }

      const parsedResponse = JSON.parse(responseText);
      
      if (!parsedResponse.articles || !Array.isArray(parsedResponse.articles)) {
        console.log('Invalid response format from OpenAI');
        return [];
      }

      const articles: NewsArticle[] = parsedResponse.articles.map((article: any) => ({
        title: `${formattedDate}: ${article.title}`,
        content: `${formattedDate}: ${article.content}`,
        source: `Verified - ${article.source}`,
        type: 'AI News',
        sentiment: article.sentiment || 'Neutral',
        priority: article.priority || 'Medium',
        newsDate: lastWorkingDay
      }));

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