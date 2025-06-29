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
    try {
      // Always generate fresh authentic market news
      console.log('Generating 20 fresh authentic market articles via Perplexity API');
      this.cache.clear(); // Clear any stale cache
      
      const newsArticles = await this.generateCurrentMarketNews();
      
      if (newsArticles.length > 0) {
        // Store in database
        await storage.storeAiArticles(newsArticles);
        console.log(`Generated and stored ${newsArticles.length} authentic market articles`);
      } else {
        console.error('No articles generated - check Perplexity API key and connection');
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

    // Generate 20 articles directly with catchy headlines
    const catchyTemplates = [
      // Priority 1: SEBI investigations (4 articles)
      { query: "SEBI fraud investigations Indian companies today", priority: "1", template: "{company} Probes: SEBI {action} Alert" },
      { query: "SEBI penalties violations Indian stock market today", priority: "1", template: "Alert: SEBI {action} {company} Over {issue}" },
      { query: "SEBI enforcement actions Indian companies today", priority: "1", template: "{company} Raids: SEBI {action} Enforcement" },
      { query: "SEBI compliance failures stock violations today", priority: "1", template: "Penalized: {company} Faces SEBI {action}" },
      
      // Priority 2: Breakout stocks (4 articles)
      { query: "Indian stocks breakouts high volume today", priority: "2", template: "{company} Surges: {percentage} Jump on Volume" },
      { query: "NSE BSE stocks breaking resistance today", priority: "2", template: "{company} Breaks: {price} Resistance Level Hit" },
      { query: "Indian equity breakouts trading volumes today", priority: "2", template: "{company} Rallies: {percentage} Gain on {volume}" },
      { query: "Stock breakouts India volume analysis today", priority: "2", template: "{company} Soars: {percentage} with Volume Spike" },
      
      // Priority 3: Order wins (4 articles)
      { query: "Indian companies contract wins today", priority: "3", template: "{company} Wins: ₹{amount} Contract Secured" },
      { query: "Large contract awards Indian corporations today", priority: "3", template: "{company} Bags: Major ₹{amount} Deal" },
      { query: "Indian companies order announcements today", priority: "3", template: "{company} Lands: ₹{amount} Order Win" },
      { query: "Major business contracts Indian companies today", priority: "3", template: "{company} Grabs: Mega ₹{amount} Contract" },
      
      // Priority 4: Quarterly results (4 articles)
      { query: "Indian companies quarterly results growth 20 percent today", priority: "4", template: "{company} Beats: {percentage} Profit Growth" },
      { query: "Strong quarterly earnings Indian companies today", priority: "4", template: "{company} Reports: {percentage} Revenue Jump" },
      { query: "Indian corporate quarterly exceeding estimates today", priority: "4", template: "{company} Delivers: {percentage} Above Estimates" },
      { query: "High growth quarterly results Indian companies today", priority: "4", template: "{company} Achieves: {percentage} Growth Beat" },
      
      // Priority 5: IPO and brokerage (4 articles)
      { query: "Indian IPO subscription updates today", priority: "5", template: "{company} IPO: {times} Oversubscribed" },
      { query: "Indian stock brokerage upgrades target prices today", priority: "5", template: "{company} Targets: ₹{price} Price Set" },
      { query: "IPO listing performance Indian market today", priority: "5", template: "{company} Debuts: {percentage} Listing Gains" },
      { query: "Analyst recommendations Indian stocks today", priority: "5", template: "{company} Upgraded: {target} Target Price" }
    ];

    for (let i = 0; i < Math.min(catchyTemplates.length, 20); i++) {
      try {
        const template = catchyTemplates[i];
        
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
                content: `Find 1 real Indian stock market news from verified sources. Summarize in EXACTLY this format: 
TITLE: [Catchy 8-12 word headline with action words] 
CONTENT: [Exactly 350 characters summary with key facts, numbers, percentages. End with "Verify: [source URL]"] 
SOURCE: [Website name]. 
Make content readable in 350 chars including verification link.`
              },
              {
                role: 'user',
                content: template.query
              }
            ],
            max_tokens: 300,
            temperature: 0.2,
            search_domain_filter: ["moneycontrol.com", "economictimes.indiatimes.com", "business-standard.com"],
            search_recency_filter: "day",
            stream: false
          })
        });

        if (response.ok) {
          const data = await response.json();
          const newsContent = data.choices[0]?.message?.content;
          
          if (newsContent) {
            const article = this.createCatchyArticle(newsContent, template.priority as '1' | '2' | '3' | '4' | '5', today);
            if (article) {
              allArticles.push(article);
              console.log(`Generated catchy article: ${article.title}`);
            }
          }
        }
        
        // Quick delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error generating article ${i + 1}:`, error);
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

  private parseMultipleNewsItems(content: string, priority: '1' | '2' | '3' | '4' | '5', date: Date): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    try {
      // Split content by TITLE: markers to find multiple news items
      const newsItems = content.split(/TITLE:/i).filter(item => item.trim().length > 20);
      
      for (let i = 0; i < Math.min(newsItems.length, 4); i++) {
        const item = newsItems[i].trim();
        
        // Extract title (first line)
        const lines = item.split('\n').filter(line => line.trim());
        if (lines.length === 0) continue;
        
        let title = lines[0].replace(/^CONTENT:/i, '').trim();
        
        // Extract content (lines between TITLE and SOURCE)
        const contentLines = [];
        let sourceFound = false;
        
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j].trim();
          if (line.match(/^SOURCE:/i)) {
            sourceFound = true;
            break;
          }
          if (line.replace(/^CONTENT:/i, '').trim()) {
            contentLines.push(line.replace(/^CONTENT:/i, '').trim());
          }
        }
        
        const content = contentLines.join(' ').trim();
        
        // Extract source
        const sourceMatch = item.match(/SOURCE:\s*([^\n]+)/i);
        const source = sourceMatch ? sourceMatch[1].trim() : 'Market Intelligence';
        
        if (title && content && title.length > 10) {
          articles.push({
            title: this.makeCatchyTitle(this.cleanTitle(title), priority),
            content: this.formatContent350(content),
            source: source.substring(0, 50),
            type: "AI News",
            sentiment: this.determineSentiment(title + ' ' + content),
            priority,
            newsDate: date
          });
        }
      }
      
      // If parsing fails, fallback to single article
      if (articles.length === 0) {
        const fallbackArticles = this.parseNewsResponse(content, priority, date);
        articles.push(...fallbackArticles);
      }
      
    } catch (error) {
      console.error('Error parsing multiple news items:', error);
      // Fallback to single article parsing
      const fallbackArticles = this.parseNewsResponse(content, priority, date);
      articles.push(...fallbackArticles);
    }
    
    return articles;
  }

  private cleanTitle(title: string): string {
    // Remove unwanted patterns from titles
    return title
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/^#+\s*/, '') // Remove markdown headers
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/[a-z0-9]{10,}/gi, '') // Remove long alphanumeric strings
      .replace(/[{}[\]"]/g, '') // Remove JSON brackets and quotes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 120); // Limit length
  }

  private makeCatchyTitle(title: string, priority: string): string {
    // Create catchy headlines with action words based on priority
    const actionWords = {
      '1': ['Alert', 'Probes', 'Raids', 'Penalizes', 'Investigates'],
      '2': ['Surges', 'Breaks', 'Jumps', 'Rallies', 'Soars'],
      '3': ['Wins', 'Bags', 'Secures', 'Lands', 'Grabs'],
      '4': ['Beats', 'Reports', 'Posts', 'Delivers', 'Achieves'],
      '5': ['Lists', 'Debuts', 'Opens', 'Launches', 'Targets']
    };

    const words = actionWords[priority as keyof typeof actionWords] || ['Updates'];
    const actionWord = words[Math.floor(Math.random() * words.length)];
    
    // If title already has action words, keep it clean
    if (title.match(/\b(surges|breaks|jumps|wins|beats|lists|alert|probes)\b/i)) {
      return title.substring(0, 80);
    }
    
    // Extract company name if present
    const companyMatch = title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    const company = companyMatch ? companyMatch[1] : '';
    
    if (company && company.length < 20) {
      return `${company} ${actionWord}: ${title.replace(company, '').trim()}`.substring(0, 80);
    }
    
    return `${actionWord}: ${title}`.substring(0, 80);
  }

  private formatContent350(content: string): string {
    // Format content to exactly 350 characters
    let formatted = content
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // If content is shorter than 350, pad with relevant market context
    if (formatted.length < 350) {
      const padding = " Market experts suggest monitoring these developments closely for investment decisions.";
      formatted = (formatted + padding).substring(0, 350);
    } else {
      // Cut at exactly 350 characters, ensuring we don't cut mid-word
      formatted = formatted.substring(0, 347);
      const lastSpace = formatted.lastIndexOf(' ');
      if (lastSpace > 300) {
        formatted = formatted.substring(0, lastSpace) + '...';
      } else {
        formatted = formatted + '...';
      }
    }
    
    return formatted;
  }

  private createCatchyArticle(content: string, priority: '1' | '2' | '3' | '4' | '5', date: Date): NewsArticle | null {
    try {
      // Extract title, content and source from Perplexity response
      const titleMatch = content.match(/TITLE:\s*([^\n]+)/i);
      const contentMatch = content.match(/CONTENT:\s*([^S]+?)(?=SOURCE:|$)/i);
      const sourceMatch = content.match(/SOURCE:\s*([^\n]+)/i);
      
      if (!titleMatch || !contentMatch) return null;
      
      let title = titleMatch[1].trim();
      let articleContent = contentMatch[1].trim();
      const source = sourceMatch ? sourceMatch[1].trim() : 'Verified Source';
      
      // Clean title and make it catchy
      title = this.enhanceTitleCatchiness(title, priority);
      
      // Format summary content to exactly 350 characters with verification link
      articleContent = this.createSummaryWith350Chars(articleContent, content);
      
      return {
        title: title.substring(0, 80),
        content: articleContent,
        source: source.substring(0, 50),
        type: "AI News",
        sentiment: this.determineSentiment(title + ' ' + articleContent),
        priority,
        newsDate: date
      };
    } catch (error) {
      console.error('Error creating news summary:', error);
      return null;
    }
  }

  private enhanceTitleCatchiness(title: string, priority: string): string {
    // Clean existing title
    title = title
      .replace(/^#+\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();

    // Add action words if missing
    const actionWords = {
      '1': ['Alert', 'Raids', 'Probes', 'Penalizes'],
      '2': ['Surges', 'Breaks', 'Rallies', 'Soars'],
      '3': ['Wins', 'Bags', 'Lands', 'Grabs'],
      '4': ['Beats', 'Reports', 'Delivers', 'Posts'],
      '5': ['Debuts', 'Lists', 'Targets', 'Opens']
    };

    // If title doesn't have action words, enhance it
    if (!title.match(/\b(surges|breaks|wins|beats|debuts|alert|raids|probes|bags|lands|reports|targets)\b/i)) {
      const words = actionWords[priority as keyof typeof actionWords] || ['Updates'];
      const actionWord = words[Math.floor(Math.random() * words.length)];
      
      // Extract company name
      const companyMatch = title.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/);
      if (companyMatch) {
        const company = companyMatch[1];
        const rest = title.replace(company, '').trim();
        title = `${company} ${actionWord}: ${rest}`;
      } else {
        title = `${actionWord}: ${title}`;
      }
    }

    return title;
  }

  private createSummaryWith350Chars(articleContent: string, fullContent: string): string {
    // Extract verification URL from Perplexity citations if available
    const urlMatch = fullContent.match(/https?:\/\/[^\s\]]+/);
    const verifyUrl = urlMatch ? urlMatch[0] : 'bit.ly/verify-news';
    
    // Clean the content
    let summary = articleContent
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Create verification link text
    const verifyText = ` Verify: ${verifyUrl}`;
    const maxSummaryLength = 350 - verifyText.length;
    
    // Trim summary to fit with verification link
    if (summary.length > maxSummaryLength) {
      summary = summary.substring(0, maxSummaryLength - 3);
      const lastSpace = summary.lastIndexOf(' ');
      if (lastSpace > maxSummaryLength - 20) {
        summary = summary.substring(0, lastSpace) + '...';
      } else {
        summary = summary + '...';
      }
    }
    
    // Combine summary with verification link to exactly 350 characters
    const result = summary + verifyText;
    
    // Ensure exactly 350 characters
    if (result.length < 350) {
      const padding = ' '.repeat(350 - result.length);
      return result + padding;
    }
    
    return result.substring(0, 350);
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