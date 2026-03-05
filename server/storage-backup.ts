import { users, otpVerifications, aiQueries, type User, type InsertUser, type OtpVerification, type InsertOtp, type AiQuery, type InsertAiQuery } from "@shared/schema";
import { db } from "./db.js";
import { eq, and, gt, gte, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

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
          eq(otpVerifications.isUsed, false),
          gt(otpVerifications.expiresAt, new Date())
        )
      );
    return otp || undefined;
  }

  async markOtpAsUsed(id: number): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(eq(otpVerifications.id, id));
  }

  async verifyUser(phoneNumber: string): Promise<void> {
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.phoneNumber, phoneNumber));
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
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

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      phoneNumber: insertUser.phoneNumber,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      age: insertUser.age || null,
      gender: insertUser.gender || null,
      city: insertUser.city || null,
      occupation: insertUser.occupation || null,
      investmentExperience: insertUser.investmentExperience || null,
      isVerified: insertUser.isVerified || "false",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createOtp(insertOtp: InsertOtp): Promise<OtpVerification> {
    const id = this.currentOtpId++;
    const otp: OtpVerification = {
      id,
      phoneNumber: insertOtp.phoneNumber,
      otp: insertOtp.otp,
      expiresAt: insertOtp.expiresAt,
      isUsed: insertOtp.isUsed || "false",
      createdAt: new Date()
    };
    this.otps.set(id, otp);
    return otp;
  }

  async getValidOtp(phoneNumber: string, otpCode: string): Promise<OtpVerification | undefined> {
    const now = new Date();
    return Array.from(this.otps.values()).find(
      (otp) => 
        otp.phoneNumber === phoneNumber && 
        otp.otp === otpCode && 
        otp.isUsed === "false" && 
        otp.expiresAt > now
    );
  }

  async markOtpAsUsed(id: number): Promise<void> {
    const otp = this.otps.get(id);
    if (otp) {
      this.otps.set(id, { ...otp, isUsed: "true" });
    }
  }

  async verifyUser(phoneNumber: string): Promise<void> {
    const user = await this.getUserByPhone(phoneNumber);
    if (user) {
      this.users.set(user.id, { ...user, isVerified: "true", updatedAt: new Date() });
    }
  }

  async upsertUser(userData: any): Promise<User> {
    // For the legacy Replit auth system - create a mock user
    const existingUser = Array.from(this.users.values()).find(
      (user) => user.phoneNumber === userData.email
    );
    
    if (existingUser) {
      return existingUser;
    }

    const id = this.currentUserId++;
    const user: User = {
      id,
      phoneNumber: userData.email || `user_${id}@mock.com`,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      age: userData.age || null,
      gender: userData.gender || null,
      city: userData.city || null,
      occupation: userData.occupation || null,
      investmentExperience: userData.investmentExperience || null,
      isVerified: "true",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async createAiQuery(insertAiQuery: InsertAiQuery): Promise<AiQuery> {
    const id = this.currentAiQueryId++;
    const aiQuery: AiQuery = {
      id,
      userId: insertAiQuery.userId,
      query: insertAiQuery.query,
      response: insertAiQuery.response || null,
      createdAt: new Date(),
    };
    
    this.aiQueries.set(id, aiQuery);
    return aiQuery;
  }

  async getDailyQueryCount(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userQueries = Array.from(this.aiQueries.values()).filter(
      (query) => query.userId === userId && query.createdAt && query.createdAt >= today
    );
    
    return userQueries.length;
  }
}

export const storage = new DatabaseStorage();
