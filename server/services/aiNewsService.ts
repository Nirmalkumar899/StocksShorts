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
      const prompt = `Generate 5 concise Indian stock market news articles in JSON format. Focus on:
- NSE/BSE index movements
- Major Indian stocks (Reliance, TCS, Infosys, HDFC, etc.)
- Market trends and analysis
- IPO/corporate actions
- Regulatory updates

Format each article as:
{
  "title": "Max 80 characters, specific and engaging",
  "content": "Max 200 words, factual summary with key details",
  "sentiment": "Positive/Negative/Neutral",
  "priority": "High/Medium/Low"
}

Return only a JSON array of 5 articles, no other text.`;

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
          search_domain_filter: ['economictimes.com', 'livemint.com', 'moneycontrol.com', 'business-standard.com'],
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
      
      return articles.slice(0, this.articlesPerBatch).map(article => ({
        title: article.title.substring(0, 200),
        content: article.content.substring(0, 500),
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
    return await db
      .select()
      .from(aiArticles)
      .orderBy(desc(aiArticles.createdAt));
  }

  async getRecentAiArticles(limit: number = 20): Promise<AiArticle[]> {
    return await db
      .select()
      .from(aiArticles)
      .orderBy(desc(aiArticles.createdAt))
      .limit(limit);
  }
}

export const aiNewsService = new AINewsService();