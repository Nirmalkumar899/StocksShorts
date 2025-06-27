import { users, otpVerifications, aiQueries, type User, type InsertUser, type OtpVerification, type InsertOtp, type AiQuery, type InsertAiQuery } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private otps: Map<number, OtpVerification>;
  private aiQueries: Map<number, AiQuery>;
  private currentUserId: number;
  private currentOtpId: number;
  private currentAiQueryId: number;

  constructor() {
    this.users = new Map();
    this.otps = new Map();
    this.aiQueries = new Map();
    this.currentUserId = 1;
    this.currentOtpId = 1;
    this.currentAiQueryId = 1;
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

export const storage = new MemStorage();
