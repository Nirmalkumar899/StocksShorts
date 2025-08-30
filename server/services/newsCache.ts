import { Article } from '../../shared/schema';
import { aiNewsGenerator } from './aiNewsGenerator';

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

  private readonly REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes like Inshorts
  private readonly MAX_ARTICLES = 120; // Keep 120 articles, show latest 100
  private readonly MAX_DAYS_OLD = 2; // Only keep articles from last 2 days + today
  private refreshTimer?: NodeJS.Timeout;

  constructor() {
    // Start automatic refresh cycle
    this.startRefreshCycle();
    // Generate initial articles
    this.refreshArticles();
  }

  private startRefreshCycle() {
    // Refresh articles every 10 minutes
    this.refreshTimer = setInterval(() => {
      this.refreshArticles();
    }, this.REFRESH_INTERVAL);

    console.log('📰 News refresh cycle started - refreshing every 10 minutes');
  }

  private async refreshArticles() {
    if (this.cache.isRefreshing) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }

    try {
      this.cache.isRefreshing = true;
      console.log('🔄 Starting news refresh...');

      const newArticles = await aiNewsGenerator.generateAllNews();
      
      // Filter articles to only include those from last 2 days + today
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.MAX_DAYS_OLD);
      cutoffDate.setHours(0, 0, 0, 0); // Start of day 2 days ago
      
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
      
      // Sort by time (newest first) and keep only MAX_ARTICLES
      const sortedArticles = allArticles
        .sort((a, b) => {
          const timeA = a.time ? new Date(a.time).getTime() : 0;
          const timeB = b.time ? new Date(b.time).getTime() : 0;
          return timeB - timeA;
        })
        .slice(0, this.MAX_ARTICLES);

      // Remove duplicates based on title similarity
      const uniqueArticles = this.removeDuplicates(sortedArticles);

      this.cache.articles = uniqueArticles;
      this.cache.lastRefresh = new Date();
      
      console.log(`✅ News refreshed: ${uniqueArticles.length} articles in cache (last ${this.MAX_DAYS_OLD} days + today)`);
      console.log(`📊 Article categories: ${this.getCategoryCounts()}`);

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
    // If cache is empty or very old, refresh immediately
    if (this.cache.articles.length === 0 || 
        Date.now() - this.cache.lastRefresh.getTime() > this.REFRESH_INTERVAL * 2) {
      await this.refreshArticles();
    }

    // Always filter articles to last 2 days + today
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MAX_DAYS_OLD);
    cutoffDate.setHours(0, 0, 0, 0);

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