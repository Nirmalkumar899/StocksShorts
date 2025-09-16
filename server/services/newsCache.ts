import { Article } from '../../shared/schema';
import { realNewsIngestor } from './realNewsIngestor';

interface CachedNews {
  articles: Article[];
  lastRefresh: Date;
  isRefreshing: boolean;
}

export class NewsCache {
  private cache: CachedNews = {
    articles: [],
    lastRefresh: new Date(0), // Start with old date to force initial refresh
    isRefreshing: false
  };

  private readonly REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes for fresher content
  private readonly MAX_ARTICLES = 120; // Keep 120 articles, show latest 100
  private readonly MAX_DAYS_OLD = 2; // Only keep articles from last 2 days + today
  private refreshTimer?: NodeJS.Timeout;

  constructor() {
    // Start automatic refresh cycle
    this.startRefreshCycle();
    // Generate initial articles immediately to avoid empty state
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      console.log('🚀 Initializing news cache...');
      
      // Fetch real news from RSS feeds
      const realNews = await realNewsIngestor.ingestTodaysNews();
      
      if (realNews.length > 0) {
        // Ensure imageUrl is always present (normalize undefined to null)
      this.cache.articles = realNews.map(article => ({
        ...article,
        imageUrl: article.imageUrl ?? null
      }));
        this.cache.lastRefresh = new Date();
        this.cache.isRefreshing = false;
        console.log(`✅ Cache initialized with ${realNews.length} real news articles`);
      } else {
        console.log('⚠️ No real news found, cache remains empty');
        this.cache.isRefreshing = false;
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize cache:', error);
      // Use emergency fallback if real news ingestion fails
      this.cache.articles = this.generateEmergencyFallback();
      this.cache.lastRefresh = new Date();
      this.cache.isRefreshing = false;
      console.log('🚨 Using emergency fallback articles');
    }
  }

  private generateEmergencyFallback(): Article[] {
    const now = new Date();
    return [
      {
        id: Date.now() + 1,
        title: "Indian Stock Markets Show Strong Performance Today",
        content: "Indian equity markets displayed robust performance with both Nifty and Sensex posting gains. Banking and IT sectors led the rally supported by positive global cues.",
        type: "trending",
        time: now,
        source: "Market Update",
        sentiment: "Positive",
        priority: "High",
        imageUrl: null,
        sourceUrl: "https://economictimes.indiatimes.com/markets",
        primarySourceUrl: "https://economictimes.indiatimes.com/markets",
        primarySourceTitle: "Indian Stock Markets Show Strong Performance Today",
        primarySourcePublishedAt: now,
        sources: "Market Data",
        contentType: "summary",
        provenanceScore: 0.7,
        createdAt: now
      }
    ];
  }

  private startRefreshCycle() {
    // Refresh articles every 10 minutes
    this.refreshTimer = setInterval(() => {
      this.refreshArticles();
    }, this.REFRESH_INTERVAL);

    console.log('📰 News refresh cycle started - refreshing every 15 minutes');
  }

  private async refreshArticles() {
    if (this.cache.isRefreshing) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }

    try {
      this.cache.isRefreshing = true;
      console.log('🔄 Starting news refresh...');

      const newArticles = await realNewsIngestor.ingestTodaysNews();
      
      // Filter articles to only include those from last 2 days + today (strict current date filtering)
      const now = new Date();
      const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - this.MAX_DAYS_OLD);
      cutoffDate.setHours(0, 0, 0, 0); // Start of day 2 days ago from TODAY
      
      const filteredNewArticles = newArticles.filter(article => {
        const articleDate = article.time ? new Date(article.time) : new Date();
        return articleDate >= cutoffDate;
      });
      
      const filteredExistingArticles = this.cache.articles.filter(article => {
        const articleDate = article.time ? new Date(article.time) : new Date();
        return articleDate >= cutoffDate;
      });
      
      // Merge filtered articles
      const allArticles = [...filteredNewArticles, ...filteredExistingArticles];
      
      // Sort by priority (enhanced categories), randomize IPO, then by time
      const sortedArticles = allArticles
        .sort((a, b) => {
          // Priority categories: breakout-stocks, research-report, order-win, multibagger, block-deal, high-volume
          const isPriorityA = ['breakout-stocks', 'research-report', 'order-win', 'multibagger', 'block-deal', 'high-volume'].includes(a.type);
          const isPriorityB = ['breakout-stocks', 'research-report', 'order-win', 'multibagger', 'block-deal', 'high-volume'].includes(b.type);
          
          // If one is priority and other isn't, priority comes first
          if (isPriorityA && !isPriorityB) return -1;
          if (!isPriorityA && isPriorityB) return 1;
          
          // For IPO articles, randomize order instead of chronological
          if (a.type === 'ipo' && b.type === 'ipo') {
            return Math.random() - 0.5; // Random order for IPO articles
          }
          
          // If both are same priority level, sort by time (newest first)
          const timeA = a.time ? new Date(a.time).getTime() : 0;
          const timeB = b.time ? new Date(b.time).getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, this.MAX_ARTICLES);

      // Remove duplicates based on title similarity
      const uniqueArticles = this.removeDuplicates(sortedArticles);

      // Ensure imageUrl is always present (normalize undefined to null)
      this.cache.articles = uniqueArticles.map(article => ({
        ...article,
        imageUrl: article.imageUrl ?? null
      }));
      this.cache.lastRefresh = new Date();
      
      console.log(`✅ News refreshed: ${uniqueArticles.length} articles in cache (last ${this.MAX_DAYS_OLD} days + today)`);
      console.log(`📊 Article categories: ${this.getCategoryCounts()}`);
      console.log(`🔍 Sample article dates: ${uniqueArticles.slice(0, 3).map(a => new Date(a.time || new Date()).toISOString()).join(', ')}`);

    } catch (error) {
      console.error('❌ Error refreshing news:', error);
    } finally {
      this.cache.isRefreshing = false;
    }
  }

  private removeDuplicates(articles: Article[]): Article[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      // Create a simple key from first 50 characters of title
      const key = article.title.substring(0, 50).toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getCategoryCounts(): string {
    const counts: { [key: string]: number } = {};
    this.cache.articles.forEach(article => {
      counts[article.type] = (counts[article.type] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([type, count]) => `${type}:${count}`)
      .join(', ');
  }

  public async getArticles(category?: string): Promise<Article[]> {
    // If cache is empty, wait for initialization to complete
    if (this.cache.articles.length === 0 && !this.cache.isRefreshing) {
      console.log('📊 Cache empty, awaiting initialization...');
      this.cache.isRefreshing = true;
      await this.initializeCache();
      console.log(`📊 Cache initialized with ${this.cache.articles.length} articles`);
    }
    
    // If cache is still empty after initialization, wait for ongoing refresh
    if (this.cache.articles.length === 0 && this.cache.isRefreshing) {
      console.log('📊 Waiting for ongoing cache refresh...');
      // Wait up to 15 seconds for cache to populate
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (this.cache.articles.length > 0) break;
      }
    }
    
    // Check if we need to refresh (if cache is old)
    if (Date.now() - this.cache.lastRefresh.getTime() > this.REFRESH_INTERVAL * 2) {
      // Start background refresh without blocking current request
      this.refreshArticles();
    }

    // Always filter articles to last 2 days + today (strict current date filtering)
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - this.MAX_DAYS_OLD);
    cutoffDate.setHours(0, 0, 0, 0); // Start of day 2 days ago from TODAY

    console.log(`🔍 Requested category: ${category}`);
    console.log(`📊 Returning ${this.cache.articles.length} cached articles`);

    let articles = this.cache.articles.filter(article => {
      const articleDate = article.time ? new Date(article.time) : new Date();
      return articleDate >= cutoffDate;
    });

    // Filter by category if specified
    if (category && category !== 'all') {
      articles = articles.filter(article => 
        article.type === category || 
        (category === 'trending' && ['trending', 'stocksshorts-special'].includes(article.type))
      );
    }

    // Return latest 100 articles for display
    return articles.slice(0, 100);
  }

  public async forceRefresh(): Promise<Article[]> {
    await this.refreshArticles();
    
    // Apply date filter when returning articles
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MAX_DAYS_OLD);
    cutoffDate.setHours(0, 0, 0, 0);

    const filteredArticles = this.cache.articles.filter(article => {
      const articleDate = article.time ? new Date(article.time) : new Date();
      return articleDate >= cutoffDate;
    });

    return filteredArticles.slice(0, 100);
  }

  public getCacheStatus() {
    return {
      articleCount: this.cache.articles.length,
      lastRefresh: this.cache.lastRefresh,
      isRefreshing: this.cache.isRefreshing,
      nextRefresh: new Date(this.cache.lastRefresh.getTime() + this.REFRESH_INTERVAL)
    };
  }

  public destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}

// Export singleton instance
export const newsCache = new NewsCache();