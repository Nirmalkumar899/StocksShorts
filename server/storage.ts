import { users, otpVerifications, aiQueries, aiArticles, type User, type InsertUser, type OtpVerification, type InsertOtp, type AiQuery, type InsertAiQuery, type AiArticle } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, gte, sql, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOtp(otp: InsertOtp): Promise<OtpVerification>;
  getValidOtp(phoneNumber: string, otp: string): Promise<OtpVerification | undefined>;
  markOtpAsUsed(id: number): Promise<void>;
  verifyUser(phoneNumber: string): Promise<void>;
  upsertUser(user: any): Promise<User>;
  createAiQuery(query: InsertAiQuery): Promise<AiQuery>;
  getDailyQueryCount(userId: number): Promise<number>;
  storeAiArticles(articles: any[]): Promise<void>;
  getStoredAiArticles(limit?: number): Promise<any[]>;
  clearAiArticles(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createOtp(insertOtp: InsertOtp): Promise<OtpVerification> {
    const [otp] = await db
      .insert(otpVerifications)
      .values(insertOtp)
      .returning();
    return otp;
  }

  async getValidOtp(phoneNumber: string, otpCode: string): Promise<OtpVerification | undefined> {
    const [otp] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.phoneNumber, phoneNumber),
          eq(otpVerifications.otp, otpCode),
          eq(otpVerifications.isUsed, "false"),
          gt(otpVerifications.expiresAt, new Date())
        )
      );
    return otp || undefined;
  }

  async markOtpAsUsed(id: number): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ isUsed: "true" })
      .where(eq(otpVerifications.id, id));
  }

  async verifyUser(phoneNumber: string): Promise<void> {
    await db
      .update(users)
      .set({ isVerified: "true" })
      .where(eq(users.phoneNumber, phoneNumber));
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.phoneNumber,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createAiQuery(insertAiQuery: InsertAiQuery): Promise<AiQuery> {
    const [aiQuery] = await db
      .insert(aiQueries)
      .values(insertAiQuery)
      .returning();
    return aiQuery;
  }

  async getDailyQueryCount(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiQueries)
      .where(
        and(
          eq(aiQueries.userId, userId),
          gte(aiQueries.createdAt, today)
        )
      );
    
    return result[0]?.count || 0;
  }

  async storeAiArticles(articles: any[]): Promise<void> {
    if (articles.length === 0) return;

    for (const article of articles) {
      try {
        await db.insert(aiArticles).values({
          title: article.title,
          content: article.content,
          type: article.type || "AI News",
          source: article.source,
          sentiment: article.sentiment,
          priority: article.priority,
          newsDate: article.newsDate,
        });
      } catch (error) {
        console.error('Error storing AI article:', error);
      }
    }
    
    // Maintain maximum 20 AI articles
    await this.maintainAiArticleLimit();
  }

  async getStoredAiArticles(limit: number = 20): Promise<any[]> {
    try {
      const articles = await db
        .select()
        .from(aiArticles)
        .orderBy(desc(aiArticles.createdAt))
        .limit(limit);
      
      return articles.map((article: AiArticle) => ({
        id: article.id, // Include ID for React keys
        title: article.title,
        content: article.content,
        source: article.source,
        type: article.type,
        sentiment: article.sentiment,
        priority: article.priority,
        time: article.newsDate, // Map newsDate to time for consistency
        newsDate: article.newsDate,
        imageUrl: null, // AI articles don't have images
        createdAt: article.createdAt
      }));
    } catch (error) {
      console.error('Error fetching stored AI articles:', error);
      return [];
    }
  }

  async maintainAiArticleLimit(): Promise<void> {
    try {
      // Count current articles
      const count = await db.select({ count: sql`count(*)` }).from(aiArticles);
      const currentCount = Number(count[0].count);
      
      if (currentCount > 20) {
        // Delete oldest articles to maintain 20
        const articlesToDelete = currentCount - 20;
        await db.delete(aiArticles)
          .where(sql`id IN (
            SELECT id FROM ai_articles 
            ORDER BY created_at ASC 
            LIMIT ${articlesToDelete}
          )`);
        console.log(`Removed ${articlesToDelete} old AI articles. Now maintaining 20 articles.`);
      }
    } catch (error) {
      console.error('Error maintaining AI article limit:', error);
    }
  }

  async clearAiArticles(): Promise<void> {
    try {
      await db.delete(aiArticles);
      console.log('Cleared all AI articles from database');
    } catch (error) {
      console.error('Error clearing AI articles:', error);
    }
  }
}

export const storage = new DatabaseStorage();