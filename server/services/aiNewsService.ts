import { db } from "../db";
import { aiArticles, type InsertAiArticle, type AiArticle } from "@shared/schema";
import { desc, count, inArray } from "drizzle-orm";

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  citations?: string[];
}

interface ParsedArticle {
  title: string;
  content: string;
  sentiment: string;
  priority: string;
}

export class AINewsService {
  private readonly maxArticles = 100;
  private readonly articlesPerBatch = 5;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  async fetchLatestNews(): Promise<AiArticle[]> {
    if (!this.apiKey) {
      console.log('PERPLEXITY_API_KEY not configured, skipping AI news fetch');
      return [];
    }

    try {
      const prompt = `You are a stock analyst generating actionable investment alerts for Indian markets. Generate exactly 5 alerts, each focusing on a DIFFERENT specific stock with clear buy/sell recommendations and price targets.

MANDATORY FORMAT - Each alert must follow this exact structure:

Alert 1 - STOCK UPGRADE/DOWNGRADE:
Title: "[Stock Name]: [Broker] upgrades to [BUY/SELL] with ₹[X] target"
Content: "[Broker name] upgraded [Stock] from [old rating] to [new rating] with target price of ₹[X], citing [specific reason like earnings growth/new orders/expansion]. Current price ₹[Y]. Potential upside [Z]%. Investors should [BUY/SELL/HOLD] given [rationale]."

Alert 2 - EARNINGS BEAT/MISS:
Title: "[Stock Name]: Q[X] earnings [beat/miss] estimates by [Y]%"
Content: "[Company] reported Q[X] results with revenue of ₹[X] crore vs estimate of ₹[Y] crore, [beating/missing] by [Z]%. Management raised/cut guidance to [specific numbers]. Stock likely to [rise/fall] [X]% to ₹[target]. Recommend [BUY/SELL] on [rationale]."

Alert 3 - CONTRACT/ORDER WIN:
Title: "[Stock Name]: Wins ₹[X] crore order, stock target raised"
Content: "[Company] secured major ₹[X] crore contract from [client name], boosting FY[XX] revenue outlook by [Y]%. This adds [Z]% to order book. Analysts raise target to ₹[price] from ₹[old price]. Strong BUY recommendation given execution capabilities."

Alert 4 - TECHNICAL BREAKOUT:
Title: "[Stock Name]: Breaks above ₹[X] resistance, targets ₹[Y]"
Content: "[Stock] closed at ₹[current price], breaking above key resistance of ₹[resistance level] on high volume. Next targets are ₹[target1] and ₹[target2]. Stop loss at ₹[SL level]. Technical indicators suggest [bullish/bearish] momentum. BUY for [timeframe] with [risk level]."

Alert 5 - INSIDER/BLOCK DEAL:
Title: "[Stock Name]: Promoters [buy/sell] ₹[X] crore stake"
Content: "Promoters of [Company] [bought/sold] [X]% additional stake worth ₹[amount] crore at ₹[price] per share, indicating [confidence/concern]. This [increases/decreases] promoter holding to [Y]%. Stock may [rally/decline] to ₹[target]. [BUY/SELL] recommendation based on insider sentiment."

Use these specific Indian stocks: Reliance Industries, TCS, Infosys, HDFC Bank, ICICI Bank, Bajaj Finance, Asian Paints, Maruti Suzuki, Hindustan Unilever, ITC

Return only valid JSON array with no extra text.`;

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
              content: 'You are a financial news analyst. Provide accurate, concise Indian stock market news.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
          search_domain_filter: ['economictimes.com', 'livemint.com', 'moneycontrol.com', 'business-standard.com', 'reuters.com', 'bloomberg.com'],
          return_related_questions: false,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from Perplexity API');
      }

      // Parse JSON response
      const articles = this.parseArticlesFromResponse(content);
      
      // Store articles in database
      const storedArticles = await this.storeArticles(articles);
      
      // Clean up old articles if needed
      await this.cleanupOldArticles();
      
      console.log(`Successfully fetched and stored ${storedArticles.length} AI news articles`);
      return storedArticles;

    } catch (error) {
      console.error('Error fetching AI news:', error);
      return [];
    }
  }

  private parseArticlesFromResponse(content: string): ParsedArticle[] {
    try {
      // Clean up the response to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const articles: ParsedArticle[] = JSON.parse(jsonMatch[0]);
      
      return articles.slice(0, this.articlesPerBatch)
        .filter(article => article && article.title && article.content)
        .map(article => ({
          title: (article.title || '').substring(0, 200),
          content: (article.content || '').substring(0, 500),
          sentiment: ['Positive', 'Negative', 'Neutral'].includes(article.sentiment) ? article.sentiment : 'Neutral',
          priority: ['High', 'Medium', 'Low'].includes(article.priority) ? article.priority : 'Medium'
        }));

    } catch (error) {
      console.error('Error parsing articles:', error);
      return [];
    }
  }

  private async storeArticles(articles: ParsedArticle[]): Promise<AiArticle[]> {
    const insertData: InsertAiArticle[] = articles.map(article => ({
      title: article.title,
      content: article.content,
      type: "AI News",
      source: "AI Generated - Perplexity",
      sentiment: article.sentiment,
      priority: article.priority,
      imageUrl: null
    }));

    const result = await db.insert(aiArticles).values(insertData).returning();
    return result;
  }

  private async cleanupOldArticles(): Promise<void> {
    const [{ total }] = await db.select({ total: count() }).from(aiArticles);
    
    if (total > this.maxArticles) {
      const articlesToDelete = total - this.maxArticles;
      
      // Get oldest articles to delete
      const oldestArticles = await db
        .select({ id: aiArticles.id })
        .from(aiArticles)
        .orderBy(aiArticles.createdAt)
        .limit(articlesToDelete);

      if (oldestArticles.length > 0) {
        const idsToDelete = oldestArticles.map(a => a.id);
        await db.delete(aiArticles).where(
          inArray(aiArticles.id, idsToDelete)
        );
        
        console.log(`Cleaned up ${articlesToDelete} old AI articles`);
      }
    }
  }

  async getAllAiArticles(): Promise<AiArticle[]> {
    const articles = await db
      .select()
      .from(aiArticles)
      .orderBy(desc(aiArticles.createdAt));
    
    return this.sortByInvestorValue(articles);
  }

  async getRecentAiArticles(limit: number = 20): Promise<AiArticle[]> {
    const articles = await db
      .select()
      .from(aiArticles)
      .orderBy(desc(aiArticles.createdAt))
      .limit(limit);
      
    return this.sortByInvestorValue(articles);
  }

  private sortByInvestorValue(articles: AiArticle[]): AiArticle[] {
    return articles.sort((a, b) => {
      // Calculate investor value score for each article
      const scoreA = this.calculateInvestorValueScore(a);
      const scoreB = this.calculateInvestorValueScore(b);
      
      // Sort by score (highest first), then by creation date (newest first)
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  private calculateInvestorValueScore(article: AiArticle): number {
    let score = 0;
    const title = article.title.toLowerCase();
    const content = article.content.toLowerCase();
    const text = `${title} ${content}`;

    // High priority indicators (50+ points each)
    const highValueKeywords = [
      'target price', 'price target', 'buy rating', 'sell rating', 'upgrade', 'downgrade',
      'earnings beat', 'earnings miss', 'guidance raised', 'guidance cut',
      'block deal', 'bulk deal', 'insider buying', 'insider selling',
      'contract win', 'order win', 'major deal', 'acquisition', 'merger',
      'policy change', 'rate cut', 'rate hike', 'rbi policy',
      'breakout', 'breakdown', 'technical levels', 'support', 'resistance'
    ];

    // Medium priority indicators (20+ points each)
    const mediumValueKeywords = [
      'quarterly results', 'annual results', 'revenue growth', 'profit margin',
      'management commentary', 'conference call', 'ceo statement',
      'fii buying', 'fii selling', 'dii activity', 'institutional',
      'sector rotation', 'thematic play', 'multibagger',
      'dividend', 'buyback', 'bonus issue', 'split'
    ];

    // Stock-specific indicators (30+ points each)
    const stockSpecificKeywords = [
      'reliance', 'tcs', 'infosys', 'hdfc bank', 'icici bank', 'sbi',
      'bharti airtel', 'lic', 'itc', 'hindunilvr', 'maruti suzuki',
      'asian paints', 'kotak bank', 'axis bank', 'wipro', 'hcl tech'
    ];

    // Count high value keywords
    highValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 50;
      }
    });

    // Count medium value keywords
    mediumValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 20;
      }
    });

    // Count stock-specific mentions
    stockSpecificKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 30;
      }
    });

    // Priority boost
    if (article.priority === 'High') {
      score += 25;
    } else if (article.priority === 'Medium') {
      score += 10;
    }

    // Sentiment considerations
    if (article.sentiment === 'Positive' || article.sentiment === 'Negative') {
      score += 15; // Clear sentiment is more actionable than neutral
    }

    // Specific number mentions (price targets, percentages, etc.)
    const numberMatches = text.match(/\d+(?:\.\d+)?%|\₹\s*\d+|rs\s*\d+|\d+\s*crore|\d+\s*lakh/g);
    if (numberMatches && numberMatches.length > 0) {
      score += Math.min(numberMatches.length * 10, 40); // Max 40 points for numbers
    }

    return score;
  }
}

export const aiNewsService = new AINewsService();