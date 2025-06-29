import { db } from '../db';
import { aiArticles, type AiArticle, type InsertAiArticle } from '@shared/schema';
import { count, desc, eq, or } from 'drizzle-orm';

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  citations?: string[];
}

interface VerifiedArticle {
  title: string;
  content: string;
  source: string;
  priority: string;
  sentiment: string;
}

export class RealNewsService {
  private readonly apiKey: string;
  private readonly maxArticles = 20;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  async fetchVerifiedNews(): Promise<AiArticle[]> {
    if (!this.apiKey) {
      console.log('PERPLEXITY_API_KEY not configured');
      return [];
    }

    try {
      console.log('Searching for verified financial news only...');
      
      const currentDate = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a financial news search system. Search ONLY for real, verified news from Indian financial websites. Return empty array if no verified news found. DO NOT generate fictional companies, fake IPOs, or synthetic events.'
            },
            {
              role: 'user',
              content: this.buildSearchPrompt(currentDate, yesterday)
            }
          ],
          max_tokens: 1500,
          temperature: 0.0,
          search_domain_filter: [
            "nseindia.com", 
            "bseindia.com", 
            "moneycontrol.com", 
            "economictimes.indiatimes.com", 
            "business-standard.com"
          ],
          search_recency_filter: "day",
          return_related_questions: false,
          stream: false,
        }),
      });

      if (!response.ok) {
        console.error(`Perplexity API error: ${response.status}`);
        return [];
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      if (!content.trim()) {
        console.log('No content returned from search');
        return [];
      }

      const verifiedArticles = this.parseVerifiedNews(content);
      
      if (verifiedArticles.length === 0) {
        console.log('No verified news found from authorized sources today');
        return [];
      }

      return await this.storeVerifiedNews(verifiedArticles);
      
    } catch (error) {
      console.error('Error fetching verified news:', error);
      return [];
    }
  }

  private buildSearchPrompt(currentDate: string, yesterday: string): string {
    return `Search for REAL financial news from authorized Indian websites for ${currentDate} and ${yesterday}:

SEARCH ONLY THESE VERIFIED SOURCES:
• nseindia.com - Corporate announcements, regulatory filings
• bseindia.com - Company disclosures, quarterly results  
• moneycontrol.com - Brokerage reports, earnings coverage
• economictimes.indiatimes.com - IPO updates, corporate actions
• business-standard.com - FII/DII data, investigations

ONLY RETURN IF YOU FIND REAL:
1. IPO subscription data with actual company names and numbers
2. Quarterly earnings with verified revenue/profit figures
3. Brokerage target price changes from real firms (ICICI, Kotak, etc.)
4. Order wins ₹100+ crore with client details
5. SEBI actions with case numbers
6. FII/DII flows with amounts
7. Dividend/bonus announcements with record dates

STRICT VERIFICATION:
- Each item MUST exist on the specified websites
- NO fictional companies (no fake Biocon IPO, etc.)
- NO synthetic price targets or technical analysis
- Include source website name
- Return [] if no verified news exists

Format: [{"title": "DD-Jun-YYYY: Company: Real Event", "content": "Verified details. Source: Website", "priority": "High", "sentiment": "Positive"}]`;
  }

  private parseVerifiedNews(content: string): VerifiedArticle[] {
    console.log('Parsing response for verified news:', content.substring(0, 200) + '...');
    
    try {
      // Look for JSON array
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const articles = JSON.parse(jsonMatch[0]);
        if (Array.isArray(articles) && articles.length > 0) {
          console.log(`Found ${articles.length} verified articles`);
          return articles.map((article: any) => ({
            title: this.cleanTitle(article.title || ''),
            content: article.content || '',
            source: article.source || 'Verified Source',
            priority: article.priority || 'High',
            sentiment: article.sentiment || 'Neutral'
          }));
        }
      }

      // Check for "no news found" indicators
      const noNewsIndicators = [
        'no verified news',
        'no real news', 
        'no recent news',
        'unable to find',
        '[]'
      ];
      
      if (noNewsIndicators.some(indicator => content.toLowerCase().includes(indicator))) {
        console.log('API confirmed no verified news available');
        return [];
      }

      // If response doesn't contain JSON or "no news" - treat as no verified content
      console.log('Response does not contain verifiable news format');
      return [];
      
    } catch (error) {
      console.error('Error parsing news response:', error);
      return [];
    }
  }

  private cleanTitle(title: string): string {
    if (!title) return '';
    
    // Remove session IDs and random strings
    return title
      .replace(/\s*\[[0-9a-zA-Z]+\]$/, '')
      .replace(/\s*\|\s*Session ID:.*$/, '')
      .replace(/\s*[0-9]{13}[a-z0-9]+$/, '')
      .trim();
  }

  private async storeVerifiedNews(articles: VerifiedArticle[]): Promise<AiArticle[]> {
    if (articles.length === 0) return [];

    try {
      // Maintain max article limit
      const currentCount = await db.select({ count: count() }).from(aiArticles);
      const totalArticles = currentCount[0]?.count || 0;
      
      if (totalArticles >= this.maxArticles) {
        const excess = totalArticles - this.maxArticles + articles.length;
        if (excess > 0) {
          const oldestArticles = await db
            .select({ id: aiArticles.id })
            .from(aiArticles)
            .orderBy(aiArticles.createdAt)
            .limit(excess);
          
          if (oldestArticles.length > 0) {
            await db.delete(aiArticles).where(
              oldestArticles.map(a => aiArticles.id.eq(a.id)).reduce((acc, condition) => acc.or(condition))
            );
            console.log(`Removed ${oldestArticles.length} old articles`);
          }
        }
      }

      // Store new verified articles
      const insertData: InsertAiArticle[] = articles.map(article => ({
        title: article.title,
        content: article.content,
        type: "AI News",
        source: article.source,
        sentiment: article.sentiment,
        priority: article.priority,
        imageUrl: null,
        newsDate: new Date(),
      }));

      const storedArticles = await db.insert(aiArticles).values(insertData).returning();
      console.log(`Stored ${storedArticles.length} verified news articles`);
      return storedArticles;
      
    } catch (error) {
      console.error('Error storing verified news:', error);
      return [];
    }
  }

  async getRecentVerifiedNews(limit: number = 20): Promise<AiArticle[]> {
    return await db
      .select()
      .from(aiArticles)
      .orderBy(desc(aiArticles.createdAt))
      .limit(limit);
  }
}

export const realNewsService = new RealNewsService();