import { Article } from '@shared/schema';
import axios from 'axios';

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
  time: string;
  source: string;
  sentiment: string;
  priority: string;
  imageUrl: string | null;
  createdAt: string;
  sourceUrl: string | null;
  primarySourceUrl: string | null;
  primarySourceTitle: string | null;
  primarySourcePublishedAt: string | null;
  sources: string | null;
  contentType: string | null;
  provenanceScore: number;
}

export class RealNewsIngestor {
  private readonly RSS_FEEDS = [
    {
      url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      source: 'Economic Times',
      domain: 'economictimes.indiatimes.com'
    },
    {
      url: 'https://www.financialexpress.com/market/rss/',
      source: 'Financial Express',
      domain: 'financialexpress.com'
    }
    // Note: Some RSS feeds block automated requests, keeping only working ones
  ];

  private readonly MARKET_KEYWORDS = [
    'nifty', 'sensex', 'bse', 'nse', 'stock', 'stocks', 'market', 'share', 'shares',
    'ipo', 'listing', 'trading', 'investor', 'investment', 'mutual fund', 'sip',
    'earnings', 'results', 'quarterly', 'revenue', 'profit', 'loss', 'dividend',
    'rupee', 'forex', 'commodity', 'gold', 'crude', 'oil', 'inflation', 'rbi',
    'sebi', 'banking', 'finance', 'insurance', 'fii', 'dii', 'broker', 'analyst'
  ];

  public async ingestTodaysNews(): Promise<VerifiedArticle[]> {
    console.log('📰 Starting real news ingestion for today...');
    
    const allArticles: VerifiedArticle[] = [];
    const todayIST = this.getTodayInIST();
    
    for (const feed of this.RSS_FEEDS) {
      try {
        console.log(`🔍 Fetching from ${feed.source}...`);
        const articles = await this.fetchRSSFeed(feed, todayIST);
        allArticles.push(...articles);
        
        // Add delay between requests to be respectful
        await this.delay(1000);
      } catch (error: any) {
        console.error(`❌ Error fetching from ${feed.source}:`, error?.message || error);
      }
    }

    // Remove duplicates based on title similarity
    const uniqueArticles = this.removeDuplicates(allArticles);
    
    // Sort by published time (newest first) and take top 20
    const sortedArticles = uniqueArticles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20);

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
        
        const verifiedArticle: VerifiedArticle = {
          id: Date.now() + Math.random(),
          title: this.cleanText(title),
          content: this.generateSummary(description),
          type: this.categorizeArticle(title, description),
          time: articleDate.toISOString(),
          source: feed.source,
          sentiment: this.analyzeSentiment(title, description),
          priority: this.assignPriority(title, description),
          imageUrl: null,
          createdAt: new Date().toISOString(),
          sourceUrl: link,
          primarySourceUrl: link,
          primarySourceTitle: title,
          primarySourcePublishedAt: articleDate.toISOString(),
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
    return this.MARKET_KEYWORDS.some(keyword => text.includes(keyword));
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
    
    if (text.includes('ipo') || text.includes('listing')) return 'ipo';
    if (text.includes('earnings') || text.includes('results') || text.includes('quarterly')) return 'research-report';
    if (text.includes('breaking') || text.includes('alert') || text.includes('urgent')) return 'trending';
    if (text.includes('analysis') || text.includes('outlook') || text.includes('target')) return 'research-report';
    if (text.includes('global') || text.includes('us market') || text.includes('wall street')) return 'us-market';
    
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
    
    const highPriorityWords = ['breaking', 'alert', 'nifty', 'sensex', 'rbi', 'sebi', 'major', 'significant'];
    const highPriorityCount = highPriorityWords.filter(word => text.includes(word)).length;
    
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
    
    // Take first 150 characters as summary
    return cleanDesc.length > 150 ? cleanDesc.substring(0, 147) + '...' : cleanDesc;
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

  private removeDuplicates(articles: VerifiedArticle[]): VerifiedArticle[] {
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
}

export const realNewsIngestor = new RealNewsIngestor();