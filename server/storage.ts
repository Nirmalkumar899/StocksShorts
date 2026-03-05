import { 
  users, 
  otpVerifications, 
  aiQueries, 
  aiArticles, 
  gmailCredentials, 
  emailInsights, 
  personalizedArticles,
  comments,
  type User, 
  type InsertUser, 
  type OtpVerification, 
  type InsertOtp, 
  type AiQuery, 
  type InsertAiQuery, 
  type AiArticle,
  type GmailCredentials,
  type InsertGmailCredentials,
  type EmailInsights,
  type InsertEmailInsights,
  type PersonalizedArticle,
  type InsertPersonalizedArticle,
  type Comment,
  type InsertComment
} from "@shared/schema";
import { db } from "./db.js";

// Add deployment timeout wrapper
const withTimeout = async <T>(promise: Promise<T>, timeout: number = 5000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Database operation timed out')), timeout);
  });
  
  return Promise.race([promise, timeoutPromise]);
};
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
  // Gmail integration methods
  storeGmailCredentials(credentials: any): Promise<void>;
  getGmailCredentials(userId: number): Promise<any>;
  storeEmailInsights(insights: any): Promise<void>;
  getEmailInsights(userId: number): Promise<any>;
  storePersonalizedArticles(articles: any[]): Promise<void>;
  getPersonalizedArticles(limit?: number): Promise<any[]>;
  // Comments system
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByArticle(articleId: number): Promise<Comment[]>;
  getCommentById(id: number): Promise<Comment | undefined>;
  deleteComment(id: number, userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const [user] = await withTimeout(
        db.select().from(users).where(eq(users.id, id)),
        3000
      );
      return user || undefined;
    } catch (error) {
      console.warn('Database timeout in getUser:', error);
      return undefined;
    }
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error('Database not available');
    try {
      const [user] = await withTimeout(
        db.insert(users).values(insertUser).returning(),
        3000
      );
      return user;
    } catch (error) {
      console.warn('Database timeout in createUser:', error);
      throw error;
    }
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
        .orderBy(aiArticles.priority, desc(aiArticles.createdAt))
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

  // Gmail integration methods
  async storeGmailCredentials(credentials: InsertGmailCredentials): Promise<void> {
    await db.insert(gmailCredentials).values(credentials)
      .onConflictDoUpdate({
        target: gmailCredentials.userId,
        set: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiryDate: credentials.expiryDate,
          isActive: credentials.isActive,
          updatedAt: new Date(),
        },
      });
  }

  async getGmailCredentials(userId: number): Promise<GmailCredentials | undefined> {
    const [creds] = await db.select().from(gmailCredentials)
      .where(and(eq(gmailCredentials.userId, userId), eq(gmailCredentials.isActive, true)));
    return creds;
  }

  async storeEmailInsights(insights: InsertEmailInsights): Promise<void> {
    await db.insert(emailInsights).values(insights);
  }

  async getEmailInsights(userId: number): Promise<EmailInsights | undefined> {
    const [insights] = await db.select().from(emailInsights)
      .where(eq(emailInsights.userId, userId))
      .orderBy(desc(emailInsights.scanDate))
      .limit(1);
    return insights;
  }

  async storePersonalizedArticles(articles: InsertPersonalizedArticle[]): Promise<void> {
    if (articles.length === 0) return;
    
    await db.insert(personalizedArticles).values(articles);
    
    // Keep only latest 20 personalized articles
    const totalCount = await db.select({ count: sql<number>`count(*)` })
      .from(personalizedArticles);
    
    if (totalCount[0].count > 20) {
      const articlesToDelete = await db.select({ id: personalizedArticles.id })
        .from(personalizedArticles)
        .orderBy(desc(personalizedArticles.createdAt))
        .offset(20);
      
      if (articlesToDelete.length > 0) {
        const idsToDelete = articlesToDelete.map((a: any) => a.id);
        await db.delete(personalizedArticles)
          .where(sql`${personalizedArticles.id} = ANY(${idsToDelete})`);
      }
    }
  }

  async getPersonalizedArticles(limit: number = 10): Promise<PersonalizedArticle[]> {
    const articles = await db.select().from(personalizedArticles)
      .orderBy(desc(personalizedArticles.createdAt))
      .limit(limit);
    
    return articles;
  }

  // Comments system methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values({
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newComment;
  }

  async getCommentsByArticle(articleId: number): Promise<Comment[]> {
    const allComments = await db.select().from(comments)
      .where(eq(comments.articleId, articleId))
      .orderBy(comments.createdAt);
    
    // Group comments by parent ID to create thread structure
    const commentsMap = new Map<number, Comment & { replies?: Comment[] }>();
    const rootComments: (Comment & { replies?: Comment[] })[] = [];
    
    allComments.forEach((comment: Comment) => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
      if (!comment.parentId) {
        rootComments.push(commentsMap.get(comment.id)!);
      }
    });
    
    // Add replies to their parent comments
    allComments.forEach((comment: Comment) => {
      if (comment.parentId && commentsMap.has(comment.parentId)) {
        const parentComment = commentsMap.get(comment.parentId)!;
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push(commentsMap.get(comment.id)!);
      }
    });
    
    return rootComments as Comment[];
  }

  async getCommentById(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments)
      .where(eq(comments.id, id));
    return comment;
  }

  async deleteComment(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();