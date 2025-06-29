import { users, otpVerifications, aiQueries, type User, type InsertUser, type OtpVerification, type InsertOtp, type AiQuery, type InsertAiQuery } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, gte, sql } from "drizzle-orm";

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
          source: article.source,
          sentiment: article.sentiment,
          priority: article.priority,
          newsDate: article.newsDate,
        }).onConflictDoNothing();
      } catch (error) {
        console.error('Error storing AI article:', error);
      }
    }
  }
}

export const storage = new DatabaseStorage();