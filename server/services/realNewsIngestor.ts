import { Article } from '@shared/schema';
import axios from 'axios';

// Generate stable ID from article content (hash-based)
function generateStableId(title: string, sourceUrl: string | null): number {
  const input = (title + (sourceUrl || '')).toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure positive number in safe range
  return Math.abs(hash) % 900000000 + 100000000;
}

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

interface VerifiedArticle {
  id: number;
  title: string;
  content: string;
  type: string;
  time: Date | null;
  source: string;
  sentiment: string;
  priority: string;
  imageUrl: string | null;
  createdAt: Date;
  sourceUrl: string | null;
  primarySourceUrl: string | null;
  primarySourceTitle: string | null;
  primarySourcePublishedAt: Date | null;
  sources: string | null;
  contentType: string | null;
  provenanceScore: number;
}

export class RealNewsIngestor {
  private readonly RSS_FEEDS = [
    // Economic Times - Primary Source (Most Reliable)
    {
      url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      source: 'Economic Times',
      domain: 'economictimes.indiatimes.com'
    },
    {
      url: 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
      source: 'Economic Times Stocks',
      domain: 'economictimes.indiatimes.com'
    },
    {
      url: 'https://economictimes.indiatimes.com/markets/ipo/rssfeeds/67840.cms',
      source: 'Economic Times IPO',
      domain: 'economictimes.indiatimes.com'
    },
    {
      url: 'https://economictimes.indiatimes.com/markets/expert-view/rssfeeds/16416696.cms',
      source: 'ET Expert View',
      domain: 'economictimes.indiatimes.com'
    },
    {
      url: 'https://economictimes.indiatimes.com/markets/technical-charts/rssfeeds/12086858.cms',
      source: 'ET Technical Analysis',
      domain: 'economictimes.indiatimes.com'
    },
    // LiveMint
    {
      url: 'https://www.livemint.com/rss/markets',
      source: 'LiveMint',
      domain: 'livemint.com'
    },
    {
      url: 'https://www.livemint.com/rss/money',
      source: 'LiveMint Money',
      domain: 'livemint.com'
    },
    // Financial Express - India Markets
    {
      url: 'https://www.financialexpress.com/market/rss/',
      source: 'Financial Express',
      domain: 'financialexpress.com'
    },
    // The Hindu Business Line
    {
      url: 'https://www.thehindu.com/business/markets/?service=rss',
      source: 'The Hindu Business',
      domain: 'thehindu.com'
    },
    // Trade Brains - India-focused stock analysis
    {
      url: 'https://tradebrains.in/feed',
      source: 'Trade Brains',
      domain: 'tradebrains.in'
    },
    // Trendlyne - BSE Corporate Announcements (Order Wins, Financial Results)
    {
      url: 'https://trendlyne.com/feeds/bse-corporate-announcements/',
      source: 'BSE Announcements',
      domain: 'trendlyne.com'
    },
    // MoneyControl - Corporate News & Results
    {
      url: 'https://www.moneycontrol.com/rss/results.xml',
      source: 'MoneyControl Results',
      domain: 'moneycontrol.com'
    },
    {
      url: 'https://www.moneycontrol.com/rss/business.xml',
      source: 'MoneyControl Business',
      domain: 'moneycontrol.com'
    }
  ];

  private readonly MARKET_KEYWORDS = [
    'nifty', 'sensex', 'bse', 'nse', 'stock', 'stocks', 'market', 'share', 'shares',
    'ipo', 'listing', 'trading', 'investor', 'investment', 'mutual fund', 'sip',
    'earnings', 'results', 'quarterly', 'revenue', 'profit', 'loss', 'dividend',
    'rupee', 'forex', 'commodity', 'gold', 'crude', 'oil', 'inflation', 'rbi',
    'sebi', 'banking', 'finance', 'insurance', 'fii', 'dii', 'broker', 'analyst',
    'research', 'target price', 'buy rating', 'sell rating', 'hold', 'outperform',
    'underperform', 'brokerage', 'upgrade', 'downgrade', 'recommendation',
    'technical', 'breakout', 'resistance', 'support', 'momentum', 'rally',
    'bull', 'bear', 'correction', 'crash', 'surge', 'plunge', 'gain', 'fall',
    // Order wins and corporate announcements
    'order win', 'order wins', 'new order', 'contract win', 'bags order', 'receives order',
    'awarded contract', 'order book', 'order inflow', 'secures order', 'wins contract',
    'financial results', 'q1 results', 'q2 results', 'q3 results', 'q4 results',
    'annual results', 'net profit', 'ebitda', 'eps', 'pat', 'top line', 'bottom line',
    'board meeting', 'agm', 'egm', 'corporate announcement', 'filing', 'disclosure',
    // F&O and Circuit specific keywords
    'f&o', 'futures', 'options', 'call option', 'put option', 'expiry', 'open interest',
    'stop loss', 'upper circuit', 'lower circuit', 'circuit limit', 'locked circuit',
    'chart pattern', 'bullish breakout', 'bearish breakdown', 'trend line', 'moving average'
  ];

  // Keywords that indicate international/non-Indian news - filter these out
  private readonly EXCLUDE_KEYWORDS = [
    'wall street', 's&p 500', 'dow jones', 'nasdaq', 'nyse', 'us stocks', 'us market',
    'american', 'european shares', 'ftse', 'dax', 'cac', 'japan nikkei', 'nikkei',
    'hang seng', 'shanghai', 'china stocks', 'fed rate', 'federal reserve',
    'elon musk', 'tesla', 'apple inc', 'amazon', 'google', 'microsoft', 'meta',
    'bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'spacex', 'pfizer',
    'warren buffett', 'berkshire', 'coca-cola', 'walmart', 'boeing', 'nvidia'
  ];

  // Keywords that strongly indicate Indian market news
  private readonly INDIA_KEYWORDS = [
    'nifty', 'sensex', 'bse', 'nse', 'rbi', 'sebi', 'rupee', 'inr',
    'india', 'indian', 'mumbai', 'dalal street', 'nifty50', 'nifty 50',
    'bank nifty', 'midcap', 'smallcap', 'largecap', 'f&o', 'mcx',
    'tata', 'reliance', 'infosys', 'hdfc', 'icici', 'sbi', 'wipro',
    'adani', 'bajaj', 'mahindra', 'maruti', 'hul', 'itc', 'kotak',
    'axis bank', 'bharti', 'vedanta', 'jsw', 'hindalco', 'ongc',
    'ntpc', 'powergrid', 'coal india', 'bpcl', 'ioc', 'gail'
  ];

  public async ingestTodaysNews(): Promise<Article[]> {
    console.log('📰 Starting real news ingestion for today and yesterday...');
    
    const allArticles: Article[] = [];
    const todayIST = this.getTodayInIST();
    const yesterdayIST = new Date(todayIST);
    yesterdayIST.setDate(yesterdayIST.getDate() - 1);
    
    for (const feed of this.RSS_FEEDS) {
      try {
        console.log(`🔍 Fetching from ${feed.source}...`);
        const todaysArticles = await this.fetchRSSFeed(feed, todayIST);
        const yesterdaysArticles = await this.fetchRSSFeed(feed, yesterdayIST);
        allArticles.push(...todaysArticles, ...yesterdaysArticles);
        
        // Add delay between requests to be respectful
        await this.delay(1000);
      } catch (error: any) {
        console.error(`❌ Error fetching from ${feed.source}:`, error?.message || error);
      }
    }

    // Remove duplicates based on title similarity
    const uniqueArticles = this.removeDuplicates(allArticles);
    
    // Sort by published time (newest first) and take top 50
    const sortedArticles = uniqueArticles
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
      .slice(0, 50);

    console.log(`✅ Ingested ${sortedArticles.length} unique articles from today`);
    return sortedArticles;
  }

  private async fetchRSSFeed(feed: any, todayIST: Date): Promise<VerifiedArticle[]> {
    try {
      const response = await axios.get(feed.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'StocksShorts News Aggregator 1.0'
        }
      });

      const articles = this.parseRSSFeed(response.data, feed, todayIST);
      return articles;
    } catch (error: any) {
      console.error(`Failed to fetch RSS from ${feed.source}:`, error?.message || error);
      return [];
    }
  }

  private parseRSSFeed(xmlData: string, feed: any, todayIST: Date): VerifiedArticle[] {
    const articles: VerifiedArticle[] = [];
    
    try {
      // Simple XML parsing for RSS items
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      const items = xmlData.match(itemRegex) || [];
      
      for (const item of items) {
        const title = this.extractXMLContent(item, 'title');
        const link = this.extractXMLContent(item, 'link');
        const description = this.extractXMLContent(item, 'description');
        const pubDate = this.extractXMLContent(item, 'pubDate');
        
        if (!title || !link || !pubDate) continue;
        
        // Check if article is from today
        const articleDate = new Date(pubDate);
        if (!this.isFromToday(articleDate, todayIST)) continue;
        
        // Check if it's market-related
        if (!this.isMarketRelated(title, description)) continue;
        
        // Skip URL verification for now to avoid async issues in parsing
        // const isValidUrl = await this.verifyUrl(link);
        // if (!isValidUrl) continue;
        
        const verifiedArticle: Article = {
          id: generateStableId(title, link),
          title: this.cleanText(title),
          content: this.generateSummary(description),
          type: this.categorizeArticle(title, description),
          time: articleDate,
          source: feed.source,
          sentiment: this.analyzeSentiment(title, description),
          priority: this.assignPriority(title, description),
          imageUrl: this.getContextualImage(title, description, this.categorizeArticle(title, description), Date.now() + Math.random()) ?? null,
          createdAt: new Date(),
          sourceUrl: link,
          primarySourceUrl: link,
          primarySourceTitle: title,
          primarySourcePublishedAt: articleDate,
          sources: feed.source,
          contentType: 'original-report',
          provenanceScore: this.calculateProvenanceScore(feed.domain, articleDate)
        };
        
        articles.push(verifiedArticle);
      }
    } catch (error: any) {
      console.error(`Error parsing RSS feed from ${feed.source}:`, error?.message || error);
    }
    
    return articles;
  }

  private extractXMLContent(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
  }

  private getTodayInIST(): Date {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);
    istTime.setHours(0, 0, 0, 0); // Start of day in IST
    return istTime;
  }

  private isFromToday(articleDate: Date, todayIST: Date): boolean {
    const tomorrow = new Date(todayIST.getTime() + 24 * 60 * 60 * 1000);
    return articleDate >= todayIST && articleDate < tomorrow;
  }

  private isMarketRelated(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    
    // First, exclude international/US market news
    if (this.EXCLUDE_KEYWORDS.some(keyword => text.includes(keyword))) {
      return false;
    }
    
    // Prefer articles with Indian market indicators
    const hasIndiaKeyword = this.INDIA_KEYWORDS.some(keyword => text.includes(keyword));
    const hasMarketKeyword = this.MARKET_KEYWORDS.some(keyword => text.includes(keyword));
    
    // Include if it has India-specific keywords, or general market keywords without exclusions
    return hasIndiaKeyword || hasMarketKeyword;
  }

  private async verifyUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, { 
        timeout: 5000,
        maxRedirects: 2
      });
      return response.status === 200;
    } catch (error) {
      // Try GET if HEAD fails
      try {
        const response = await axios.get(url, { 
          timeout: 5000,
          maxRedirects: 2,
          maxContentLength: 1000 // Just check if accessible
        });
        return response.status === 200;
      } catch (getError) {
        return false;
      }
    }
  }

  private categorizeArticle(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    // Priority 1: TRUE Research Reports with Price Targets (brokerage reports)
    // Must have explicit target price or buy/sell recommendation
    const hasTargetPrice = /target\s*(price|of)?\s*₹?\s*\d+/i.test(text) || 
                           /₹\s*\d+\s*target/i.test(text) ||
                           text.includes('sets target') ||
                           text.includes('target at ₹') ||
                           text.includes('target rs') ||
                           text.includes('price target') ||
                           /target.*₹\s*\d+/i.test(text);
    const hasBrokerageCall = text.includes('initiates coverage') || 
                             text.includes('maintains buy') || 
                             text.includes('maintains sell') ||
                             text.includes('buy rating') || 
                             text.includes('sell rating') ||
                             text.includes('hold rating') ||
                             text.includes('upgrades to') ||
                             text.includes('downgrades to') ||
                             text.includes('reiterate buy') ||
                             text.includes('reiterate sell') ||
                             /\d+%\s*upside/i.test(text) ||
                             /\d+%\s*downside/i.test(text) ||
                             text.includes('brokerage') ||
                             text.includes('motilal oswal') ||
                             text.includes('icici securities') ||
                             text.includes('hdfc securities') ||
                             text.includes('kotak') ||
                             text.includes('jefferies') ||
                             text.includes('morgan stanley') ||
                             text.includes('goldman sachs') ||
                             text.includes('citi') ||
                             text.includes('ubs ') ||
                             text.includes('clsa') ||
                             text.includes('nomura') ||
                             text.includes('jp morgan') ||
                             text.includes('bofa') ||
                             text.includes('nuvama');
    
    if (hasTargetPrice || hasBrokerageCall) {
      return 'research-report';
    }
    
    // Priority 2: TRUE Chart Breakout Stocks (technical analysis with chart patterns)
    const hasBreakoutKeyword = text.includes('breakout') || text.includes('break out') || text.includes('breaks above');
    const hasTechnicalTerm = text.includes('candlestick') || text.includes('rsi') || text.includes('macd') ||
                             text.includes('chart pattern') || text.includes('cup and handle') ||
                             text.includes('head and shoulder') || text.includes('double bottom') ||
                             text.includes('double top') || text.includes('trendline') ||
                             text.includes('moving average') || text.includes('52-week high') ||
                             text.includes('52 week high') || text.includes('all-time high') ||
                             text.includes('resistance level') || text.includes('support level') ||
                             text.includes('volume surge') || text.includes('technical') ||
                             text.includes('bullish pattern') || text.includes('bearish pattern');
    
    if (hasBreakoutKeyword && hasTechnicalTerm) {
      return 'breakout-stocks';
    }
    
    // Priority 3: Order Wins (concrete order/contract wins with amounts)
    if (text.includes('order win') || text.includes('bags order') || text.includes('receives order') || 
        text.includes('secures order') || text.includes('contract win') ||
        text.includes('order worth') || text.includes('wins contract') ||
        /₹\s*\d+.*order/i.test(text) || /bags.*₹\s*\d+/i.test(text) ||
        /order.*₹\s*\d+\s*(cr|crore|lakh)/i.test(text)) {
      return 'order-win';
    }
    
    // Priority 4: F&O Analysis (derivatives/technical trading)
    if (text.includes('f&o') || text.includes('futures') || text.includes('options') || 
        text.includes('stop loss') || text.includes('call option') || text.includes('put option') ||
        text.includes('expiry') || text.includes('open interest') || text.includes('nifty target') ||
        text.includes('bank nifty') || text.includes('option chain')) {
      return 'fno-analysis';
    }
    
    // Upper/Lower Circuit
    if (text.includes('upper circuit') || text.includes('lower circuit') || text.includes('circuit limit') ||
        text.includes('hit circuit') || text.includes('locked in circuit') || text.includes('circuit breaker')) {
      return 'circuit-stocks';
    }
    
    // IPO news
    if (text.includes('ipo') || text.includes('listing') || text.includes('allotment')) return 'ipo';
    
    // US/Global markets
    if (text.includes('global') || text.includes('us market') || text.includes('wall street') ||
        text.includes('nasdaq') || text.includes('dow jones') || text.includes('s&p 500')) return 'us-market';
    
    // Default to trending (includes results, earnings, general news)
    return 'trending';
  }

  private analyzeSentiment(title: string, description: string): 'Positive' | 'Negative' | 'Neutral' {
    const text = (title + ' ' + description).toLowerCase();
    
    const positiveWords = ['rise', 'gain', 'up', 'surge', 'rally', 'bullish', 'positive', 'growth', 'profit', 'strong'];
    const negativeWords = ['fall', 'drop', 'down', 'crash', 'bearish', 'negative', 'loss', 'weak', 'decline'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'Positive';
    if (negativeCount > positiveCount) return 'Negative';
    return 'Neutral';
  }

  private assignPriority(title: string, description: string): 'High' | 'Medium' | 'Low' {
    const text = (title + ' ' + description).toLowerCase();
    
    // High priority for trader-focused content
    const traderFocusedWords = [
      'breakout', 'upper circuit', 'lower circuit', 'order win', 'bags order',
      'f&o', 'futures', 'options', 'support', 'resistance', 'target price',
      'stop loss', 'circuit', 'technical', 'chart pattern'
    ];
    
    const highPriorityWords = ['breaking', 'alert', 'nifty', 'sensex', 'rbi', 'sebi', 'major', 'significant'];
    
    const traderFocusedCount = traderFocusedWords.filter(word => text.includes(word)).length;
    const highPriorityCount = highPriorityWords.filter(word => text.includes(word)).length;
    
    // Trader-focused content gets highest priority
    if (traderFocusedCount >= 1) return 'High';
    if (highPriorityCount >= 2) return 'High';
    if (highPriorityCount >= 1) return 'Medium';
    return 'Low';
  }

  private generateSummary(description: string): string {
    // Clean HTML tags and create a concise summary
    const cleanDesc = description
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .trim();
    
    // Take first 350 characters to allow for 6-7 lines of content display
    return cleanDesc.length > 350 ? cleanDesc.substring(0, 347) + '...' : cleanDesc;
  }

  private calculateProvenanceScore(domain: string, publishedAt: Date): number {
    const domainScores: Record<string, number> = {
      'economictimes.indiatimes.com': 0.9,
      'moneycontrol.com': 0.85,
      'livemint.com': 0.8,
      'cnbctv18.com': 0.75,
      'financialexpress.com': 0.7
    };
    
    const domainScore = domainScores[domain] || 0.5;
    
    // Recency factor (newer articles get higher scores)
    const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - (hoursAgo / 24)); // Decreases over 24 hours
    
    return Math.round((domainScore * 0.7 + recencyScore * 0.3) * 100) / 100;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private removeDuplicates(articles: Article[]): Article[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getContextualImage(title: string, content: string, type: string, id: number): string {
    try {
      const combinedText = (title + ' ' + content).toLowerCase();
      console.log(`🖼️ DEBUG: Generating image for "${title.substring(0, 50)}..." with text: "${combinedText.substring(0, 100)}..."`);
      
      // Extract the main company being discussed
      const mainCompany = this.extractCompanyFromContent(combinedText);
      console.log(`🖼️ DEBUG: Extracted company: ${mainCompany}, type: ${type}`);
      
      // Use article ID to ensure different articles get different images (ensure integer 1-3)
      const imageVariant = (Math.abs(Math.floor(id)) % 3) + 1;
    
      // Generate images based on the main company being discussed
      if (mainCompany === 'reliance' || combinedText.includes('ril')) {
        const relianceImages = [
          'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop&auto=format&q=80', // Oil refinery
          'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Industrial
          'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&auto=format&q=80'  // Energy
        ];
        return relianceImages[imageVariant - 1];
      }
      
      if (mainCompany === 'tcs' || mainCompany === 'tata consultancy' || mainCompany === 'infosys') {
        const techImages = [
          'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&auto=format&q=80', // Office building
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80', // Business analytics
          'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80'  // Software dev
        ];
        return techImages[imageVariant - 1];
      }

      if (mainCompany === 'hdfc' || mainCompany === 'icici' || combinedText.includes('bank')) {
        const bankImages = [
          'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800&h=600&fit=crop&auto=format&q=80', // Banking
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format&q=80', // Finance
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&auto=format&q=80'  // Investment
        ];
        return bankImages[imageVariant - 1];
      }

      if (combinedText.includes('defence') || combinedText.includes('defense') || mainCompany === 'hal') {
        const defenceImages = [
          'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&auto=format&q=80', // Military/Defense
          'https://images.unsplash.com/photo-1552664688-cf412ec27db2?w=800&h=600&fit=crop&auto=format&q=80', // Aircraft
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80'  // Security
        ];
        return defenceImages[imageVariant - 1];
      }

      if (combinedText.includes('ipo') || combinedText.includes('listing')) {
        const ipoImages = [
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80', // Stock market
          'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80', // Trading
          'https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?w=800&h=600&fit=crop&auto=format&q=80'  // IPO/Listing
        ];
        return ipoImages[imageVariant - 1];
      }

      // Default fallback images based on sentiment
      if (combinedText.includes('profit') || combinedText.includes('gain') || combinedText.includes('rise')) {
        const positiveImages = [
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80', // Bull market
          'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80', // Growth
          'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=600&fit=crop&auto=format&q=80'  // Success
        ];
        return positiveImages[imageVariant - 1];
      }

      // Generic market images as final fallback
      const defaultImages = [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80', // Stock market
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80', // Financial charts
        'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=600&fit=crop&auto=format&q=80'  // Business
      ];
      const selectedImage = defaultImages[imageVariant - 1];
      console.log(`🖼️ DEBUG: Using default image (variant ${imageVariant}, type: integer=${Number.isInteger(imageVariant)}): ${selectedImage}`);
      return selectedImage;
      
    } catch (error) {
      console.error('Error generating contextual image:', error);
      return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80';
    }
  }

  private extractCompanyFromContent(text: string): string | null {
    // Major Indian companies - extract the most prominent one mentioned
    const companies = [
      'reliance', 'tcs', 'tata consultancy', 'infosys', 'hdfc', 'icici', 'adani', 'bajaj',
      'maruti', 'suzuki', 'asian paints', 'wipro', 'hcl', 'titan', 'ultratech', 'grse',
      'cochin shipyard', 'coal india', 'ongc', 'ntpc', 'trent', 'indusind', 'blue star',
      'zensar', 'kaynes', 'kp green', 'nbcc', 'bharti airtel', 'hindalco', 'jsw steel',
      'mahindra', 'hero motocorp', 'kotak mahindra', 'axis bank', 'sun pharma', 'dr reddy',
      'cipla', 'lupin', 'biocon', 'divis', 'aurobindo pharma', 'vedanta', 'hindalco',
      'tata steel', 'jio', 'airtel', 'vodafone idea', 'bpcl', 'ioc', 'gail', 'power grid',
      'sail', 'bhel', 'hal', 'irctc', 'irfc', 'rvnl', 'pfc', 'rec', 'sjvn', 'nhpc'
    ];
    
    // Find the first company mentioned (most likely the main subject)
    for (const company of companies) {
      if (text.includes(company)) {
        return company;
      }
    }
    
    return null;
  }
}

export const realNewsIngestor = new RealNewsIngestor();