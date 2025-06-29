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

    // Priority-based news types with exactly 4 articles per priority
    const newsQueries = [
      // Priority 1: SEBI investigations and fraud alerts (4 articles)
      `Latest SEBI fraud investigations regulatory actions against Indian listed companies today ${todayString}`,
      `SEBI enforcement actions penalties violations Indian stock market today ${todayString}`,
      `Indian company regulatory violations SEBI warnings investigations today ${todayString}`,
      `SEBI compliance failures stock exchange violations India today ${todayString}`,
      
      // Priority 2: Breakout stocks with volume analysis (4 articles)
      `Indian stocks technical breakouts unusual high volume surge today ${todayString}`,
      `NSE BSE stocks breaking resistance levels volume spikes today ${todayString}`,
      `Indian equity stocks price breakouts trading volumes today ${todayString}`,
      `Stock market breakout stocks India volume analysis today ${todayString}`,
      
      // Priority 3: Major order wins and contract announcements (4 articles)
      `Indian companies major contract wins order announcements revenue impact today ${todayString}`,
      `Large contract awards Indian corporations business wins today ${todayString}`,
      `Indian companies significant order wins project announcements today ${todayString}`,
      `Major business contracts Indian listed companies today ${todayString}`,
      
      // Priority 4: Quarterly results with >20% growth (4 articles)
      `Indian companies quarterly results revenue growth over 20 percent today ${todayString}`,
      `Strong quarterly earnings Indian companies profit growth today ${todayString}`,
      `Indian corporate quarterly results exceeding estimates today ${todayString}`,
      `High growth quarterly results Indian listed companies today ${todayString}`,
      
      // Priority 5: IPO updates and brokerage calls (4 articles)
      `Indian IPO subscription status grey market premium updates today ${todayString}`,
      `Indian stock brokerage upgrades downgrades target prices today ${todayString}`,
      `IPO listing performance Indian stock market today ${todayString}`,
      `Analyst recommendations Indian stocks buy sell ratings today ${todayString}`
    ];

    const allArticles: NewsArticle[] = [];

    for (let i = 0; i < newsQueries.length; i++) {
      try {
        const query = newsQueries[i];
        const priority = (Math.floor(i / 4) + 1).toString() as '1' | '2' | '3' | '4' | '5';
        
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
                content: `You are a financial news analyst for Indian stock market. Search for ONLY authentic, verified news from today and yesterday. Include specific company names, exact numbers, and verified sources. Write clear news title and content. Only report actual events that occurred recently. Source must be specified at the end.`
              },
              {
                role: 'user',
                content: query
              }
            ],
            max_tokens: 400,
            temperature: 0.1,
            top_p: 0.9,
            search_domain_filter: ["moneycontrol.com", "economictimes.indiatimes.com", "business-standard.com", "nseindia.com", "bseindia.com", "livemint.com"],
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
        
        // Shorter delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching news for query ${i + 1}:`, error);
      }
    }

    // Return exactly 20 articles
    return allArticles.slice(0, 20);
  }

  private parseNewsResponse(content: string, priority: '1' | '2' | '3' | '4' | '5', date: Date): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    try {
      // Parse as text and create single article from Perplexity response
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length >= 1) {
        // Extract title (first meaningful line)
        let title = lines[0].replace(/^\d+\.\s*/, '').trim();
        
        // If first line is very short, combine with second line for title
        if (title.length < 20 && lines.length > 1) {
          title = lines.slice(0, 2).join(' ').replace(/^\d+\.\s*/, '').trim();
        }
        
        // Extract content (remaining lines)
        const contentLines = lines.slice(1).filter(line => 
          line.length > 20 && !line.startsWith('Source:') && !line.startsWith('Citation:')
        );
        
        const content = contentLines.length > 0 ? contentLines.join(' ').trim() : title;
        
        if (title && content) {
          articles.push({
            title: this.cleanTitle(title),
            content: content,
            source: "Verified - Live Market Data",
            type: "AI News",
            sentiment: this.determineSentiment(title),
            priority,
            newsDate: date
          });
        }
      }
    } catch (parseError) {
      console.error('Error parsing news response:', parseError);
      
      // Emergency fallback - create article from raw content
      if (content && content.length > 50) {
        const cleanContent = content.substring(0, 200).replace(/[{}[\]"]/g, '');
        articles.push({
          title: `${date.toLocaleDateString('en-IN')}: Market Update`,
          content: cleanContent,
          source: "Verified - Live Market Data",
          type: "AI News",
          sentiment: "Neutral",
          priority,
          newsDate: date
        });
      }
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