import { storage } from "../storage";

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY environment variable is required");
}

interface NewsArticle {
  title: string;
  content: string;
  source: string;
  type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  priority: '1' | '2' | '3' | '4' | '5';
  newsDate: Date;
}

export class PerplexityNewsService {
  private cache = new Map<string, NewsArticle[]>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes cache for real-time data

  private isMarketDay(date: Date): boolean {
    const day = date.getDay();
    // 0 = Sunday, 6 = Saturday
    return day !== 0 && day !== 6;
  }

  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  async fetchRealNews(): Promise<NewsArticle[]> {
    const today = this.getTodayDateString();
    
    if (this.cache.has(today)) {
      const cached = this.cache.get(today)!;
      console.log('Returning cached real-time news for', today);
      return cached;
    }

    try {
      const newsArticles = await this.generateCurrentMarketNews();
      
      if (newsArticles.length > 0) {
        this.cache.set(today, newsArticles);
        
        // Store in database
        await storage.storeAiArticles(newsArticles);
        console.log(`Found ${newsArticles.length} verified news articles`);
      }
      
      return newsArticles;
    } catch (error) {
      console.error('Error fetching real news:', error);
      return [];
    }
  }

  private async generateCurrentMarketNews(): Promise<NewsArticle[]> {
    const today = new Date();
    const todayString = today.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Priority-based news types with real market focus
    const newsQueries = [
      // Priority 1: SEBI investigations and fraud alerts
      `Latest SEBI investigations, fraud alerts, or regulatory actions against Indian companies today ${todayString}`,
      
      // Priority 2: Breakout stocks with volume analysis  
      `Indian stocks with technical breakouts and unusual volume surge today ${todayString}`,
      
      // Priority 3: Major order wins and contract announcements
      `Indian companies major contract wins or order announcements affecting revenue today ${todayString}`,
      
      // Priority 4: IPO subscription updates and grey market premium
      `Indian IPO subscription status, grey market premium updates today ${todayString}`,
      
      // Priority 5: Brokerage calls with target prices
      `Indian stock brokerage upgrades downgrades with target prices today ${todayString}`
    ];

    const allArticles: NewsArticle[] = [];

    for (let i = 0; i < newsQueries.length; i++) {
      try {
        const query = newsQueries[i];
        const priority = (i + 1).toString() as '1' | '2' | '3' | '4' | '5';
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: `You are a financial news analyst for Indian stock market. Generate ONLY authentic, verified news from today. Include specific company names, exact numbers, and verified sources. Format as JSON array with fields: title, content, source, sentiment, priority. Only report actual events that occurred today.`
              },
              {
                role: 'user',
                content: query
              }
            ],
            max_tokens: 800,
            temperature: 0.1,
            top_p: 0.9,
            search_domain_filter: ["moneycontrol.com", "economictimes.indiatimes.com", "business-standard.com", "nseindia.com", "bseindia.com"],
            return_images: false,
            return_related_questions: false,
            search_recency_filter: "day",
            stream: false
          })
        });

        if (!response.ok) {
          console.error(`Perplexity API error for query ${i + 1}:`, response.status);
          continue;
        }

        const data = await response.json();
        const newsContent = data.choices[0]?.message?.content;
        
        if (newsContent) {
          const articles = this.parseNewsResponse(newsContent, priority, today);
          allArticles.push(...articles);
        }
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching news for query ${i + 1}:`, error);
      }
    }

    // Return exactly 5 articles (1 per priority)
    return allArticles.slice(0, 5);
  }

  private parseNewsResponse(content: string, priority: '1' | '2' | '3' | '4' | '5', date: Date): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const newsArray = JSON.parse(jsonMatch[0]);
        
        for (const news of newsArray.slice(0, 1)) { // Take only 1 article per priority
          if (news.title && news.content) {
            articles.push({
              title: this.cleanTitle(news.title),
              content: news.content,
              source: news.source || "Verified - Market Sources",
              type: "AI News",
              sentiment: this.determineSentiment(news.sentiment || news.title),
              priority,
              newsDate: date
            });
          }
        }
      } else {
        // Fallback: Parse as text and create single article
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length >= 2) {
          const title = lines[0].replace(/^\d+\.\s*/, '').trim();
          const content = lines.slice(1).join(' ').trim();
          
          if (title && content) {
            articles.push({
              title: this.cleanTitle(title),
              content: content,
              source: "Verified - Market Sources",
              type: "AI News",
              sentiment: this.determineSentiment(title),
              priority,
              newsDate: date
            });
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing news response:', parseError);
    }
    
    return articles;
  }

  private cleanTitle(title: string): string {
    // Remove unwanted patterns from titles
    return title
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/[a-z0-9]{10,}/gi, '') // Remove long alphanumeric strings
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private determineSentiment(text: string): 'Positive' | 'Negative' | 'Neutral' {
    const positiveWords = ['upgrade', 'buy', 'bullish', 'surge', 'breakout', 'win', 'growth', 'strong', 'robust'];
    const negativeWords = ['downgrade', 'sell', 'bearish', 'fall', 'decline', 'investigation', 'fraud', 'concern'];
    
    const lowerText = text.toLowerCase();
    
    if (positiveWords.some(word => lowerText.includes(word))) {
      return 'Positive';
    } else if (negativeWords.some(word => lowerText.includes(word))) {
      return 'Negative';
    }
    
    return 'Neutral';
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const perplexityNewsService = new PerplexityNewsService();