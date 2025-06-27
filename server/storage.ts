import { users, otpVerifications, type User, type InsertUser, type OtpVerification, type InsertOtp } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private otps: Map<number, OtpVerification>;
  private currentUserId: number;
  private currentOtpId: number;

  constructor() {
    this.users = new Map();
    this.otps = new Map();
    this.currentUserId = 1;
    this.currentOtpId = 1;
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
}

export const storage = new MemStorage();
