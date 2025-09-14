import { pgTable, text, serial, integer, timestamp, varchar, index, jsonb, boolean, real, numeric, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for mobile authentication  
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: text("username"),
  password: text("password"),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  phoneNumber: varchar("phone_number", { length: 15 }),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  city: varchar("city", { length: 100 }),
  occupation: varchar("occupation", { length: 100 }),
  investmentExperience: varchar("investment_experience", { length: 50 }),
  name: varchar("name", { length: 100 }),
  isVerified: boolean("is_verified").default(false),
});

// OTP verification table
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI query tracking for daily limits
export const aiQueries = pgTable("ai_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  query: text("query").notNull(),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // Index, Warrants, StocksShorts Special, Breakout Stocks, Educational, IPO, Global, Most Active, Order Win
  time: timestamp("time"), // Allow null for articles without specific timestamp
  source: text("source").notNull(),
  sentiment: text("sentiment").notNull(), // Positive, Negative, Neutral
  priority: text("priority").notNull(), // High, Medium, Low
  imageUrl: text("image_url"), // URL for article image
  sourceUrl: text("source_url"), // URL to the original source - DEPRECATED, use primarySourceUrl
  // New source tracking fields for copyright compliance
  primarySourceUrl: text("primary_source_url"), // Required HTTPS URL to actual article
  primarySourceTitle: text("primary_source_title"), // Title of the primary source article
  primarySourcePublishedAt: timestamp("primary_source_published_at"), // When the original article was published
  sources: jsonb("sources"), // Array of source objects: {name, url, title, publishedAt}
  provenanceScore: real("provenance_score").default(0.0), // 0-1 score of how well sources match content
  contentType: text("content_type").default("summary").notNull(), // 'summary'|'analysis'|'original-report'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;

export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  createdAt: true,
});

export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

// Source tracking interfaces
export interface NewsSource {
  name: string;
  url: string;
  title?: string;
  publishedAt?: string;
}

// Enhanced article validation with source requirements
export const sourceValidatedArticleSchema = insertArticleSchema.extend({
  contentType: z.enum(["summary", "analysis", "original-report"]).default("summary"),
  provenanceScore: z.number().min(0).max(1).default(0.0),
  sources: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    title: z.string().optional(),
    publishedAt: z.string().optional()
  })).optional(),
}).refine(
  (data) => {
    // Require primarySourceUrl unless it's an original analysis
    return data.contentType === "analysis" || (
      data.primarySourceUrl && 
      data.primarySourceUrl.startsWith("https://") &&
      data.primarySourceUrl.length > 20
    );
  },
  {
    message: "Articles must have a valid primarySourceUrl (HTTPS) unless contentType is 'analysis'",
    path: ["primarySourceUrl"]
  }
);

export type SourceValidatedArticle = z.infer<typeof sourceValidatedArticleSchema>;

// AI Articles table - separate from Google Sheets articles
export const aiArticles = pgTable("ai_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("AI News"),
  source: text("source").default("AI Generated"),
  sentiment: text("sentiment").default("Neutral"),
  priority: text("priority").default("Medium"),
  imageUrl: text("image_url"),
  newsDate: timestamp("news_date").notNull(), // Date when the news actually happened
  // Source tracking fields for copyright compliance
  primarySourceUrl: text("primary_source_url"), // Required HTTPS URL to actual article
  primarySourceTitle: text("primary_source_title"), // Title of the primary source article
  primarySourcePublishedAt: timestamp("primary_source_published_at"), // When the original article was published
  sources: jsonb("sources"), // Array of source objects: {name, url, title, publishedAt}
  provenanceScore: real("provenance_score").default(0.0), // 0-1 score of how well sources match content
  contentType: text("content_type").default("summary").notNull(), // 'summary'|'analysis'|'original-report'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiArticleSchema = createInsertSchema(aiArticles).omit({
  id: true,
  createdAt: true,
});

export type InsertAiArticle = z.infer<typeof insertAiArticleSchema>;
export type AiArticle = typeof aiArticles.$inferSelect;

// Enhanced AI article validation with source requirements
export const sourceValidatedAiArticleSchema = insertAiArticleSchema.extend({
  contentType: z.enum(["summary", "analysis", "original-report"]).default("summary"),
  provenanceScore: z.number().min(0).max(1).default(0.0),
  sources: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    title: z.string().optional(),
    publishedAt: z.string().optional()
  })).optional(),
}).refine(
  (data) => {
    // Require primarySourceUrl unless it's an original analysis
    return data.contentType === "analysis" || (
      data.primarySourceUrl && 
      data.primarySourceUrl.startsWith("https://") &&
      data.primarySourceUrl.length > 20
    );
  },
  {
    message: "AI Articles must have a valid primarySourceUrl (HTTPS) unless contentType is 'analysis'",
    path: ["primarySourceUrl"]
  }
);

export type SourceValidatedAiArticle = z.infer<typeof sourceValidatedAiArticleSchema>;

// AI Article Reports table for flagging system
export const aiArticleReports = pgTable("ai_article_reports", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => aiArticles.id),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, reviewed, dismissed, removed
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 100 }),
  reviewNotes: text("review_notes"),
});

export const insertAiArticleReportSchema = createInsertSchema(aiArticleReports).omit({
  id: true,
  reportedAt: true,
});

export type InsertAiArticleReport = z.infer<typeof insertAiArticleReportSchema>;
export type AiArticleReport = typeof aiArticleReports.$inferSelect;

// Investment Advisor table
export const investmentAdvisors = pgTable("investment_advisors", {
  id: serial("id").primaryKey(),
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  
  // Professional Information  
  sebiRegNo: text("sebi_reg_no").notNull().unique(),
  company: text("company").default(''),
  qualification: text("qualification").default('SEBI Registered Investment Advisor'),
  experienceYears: integer("experience_years").default(0),
  yearsInBusiness: integer("years_in_business").default(0),
  
  // Office Contact Information
  officeAddress: text("office_address").default(''),
  city: text("city").default(''),
  state: text("state").default(''),
  pincode: text("pincode").default(''),
  professionalPhone: text("professional_phone").notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 15 }),
  
  // Online Presence
  website: text("website").default(''),
  linkedinProfile: text("linkedin_profile").default(''),
  articleLinks: jsonb("article_links").default([]),
  socialMediaLinks: jsonb("social_media_links").default([]),
  
  // Professional Services
  specializations: jsonb("specializations").default([]),
  servicesOffered: jsonb("services_offered").default([]),
  languagesSpoken: jsonb("languages_spoken").default([]),
  
  // Additional Information
  aboutYou: text("about_you").default(''),
  consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).default("100.00"),
  
  // Teleconsultation Configuration
  consultationFee15min: numeric("consultation_fee_15min", { precision: 10, scale: 2 }), // nullable - null means not offering 15min consultations
  consultationFee30min: numeric("consultation_fee_30min", { precision: 10, scale: 2 }), // nullable - null means not offering 30min consultations
  freeConsultationsPerUser: integer("free_consultations_per_user").default(1), // -1 for unlimited
  consultationEnabled: boolean("consultation_enabled").default(false),
  
  // File Uploads
  profileImageUrl: text("profile_image_url").default(''),
  sebiCertificateUrl: text("sebi_certificate_url").default(''),
  
  // Legal Requirements & Availability
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  privacyPolicyAccepted: boolean("privacy_policy_accepted").notNull().default(false),
  professionalDisclaimerAccepted: boolean("professional_disclaimer_accepted").notNull().default(false),
  availableForConsultations: boolean("available_for_consultations").notNull().default(true),
  
  // Advisor Status and Activity Tracking
  status: text("status").notNull().default("offline"), // 'active' | 'offline'
  lastActiveAt: timestamp("last_active_at"),
  statusUpdatedAt: timestamp("status_updated_at").defaultNow().notNull(),
  displayPhone: boolean("display_phone").notNull().default(false),
  
  // Legacy fields for backward compatibility
  designation: text("designation").default(''),
  phone: text("phone").default(''),
  specialization: text("specialization").default(''),
  experience: text("experience").default(''),
  location: text("location").default(''),
  bio: text("bio").default(''),
  rating: text("rating").default('4.0'),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Database-level validation for advisor status and free consultations
  check("CHK_advisor_status", sql`status IN ('active', 'offline')`),
  check("CHK_advisor_free_consultations", sql`free_consultations_per_user = -1 OR free_consultations_per_user >= 0`),
]);

// Conversations table for managing chat sessions between advisors and users
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull().references(() => investmentAdvisors.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("active"), // 'active' | 'archived'
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  lastMessagePreview: text("last_message_preview").default(""),
  unreadCount: integer("unread_count").notNull().default(0), // Messages unread by recipient
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_conversations_user").on(table.userId),
  index("IDX_conversations_advisor").on(table.advisorId),
  index("IDX_conversations_last_message").on(table.lastMessageAt),
]);

// Messages table for in-app communication between advisors and users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  advisorId: integer("advisor_id").notNull().references(() => investmentAdvisors.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  sender: text("sender").notNull(), // 'user' | 'advisor'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
  conversationKey: varchar("conversation_key").notNull(), // Format: advisorId:userId for backward compatibility
}, (table) => [
  index("IDX_messages_conversation").on(table.conversationId),
  index("IDX_messages_conversation_key").on(table.conversationKey),
  index("IDX_messages_created_at").on(table.createdAt),
]);

// Teleconsultations table for booking and managing video consultations
export const teleconsultations = pgTable("teleconsultations", {
  id: serial("id").primaryKey(),
  advisorId: integer("advisor_id").notNull().references(() => investmentAdvisors.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  duration: text("duration").notNull(), // "15min" | "30min"
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull().default("scheduled"), // "scheduled" | "completed" | "cancelled" | "in_progress"
  fee: numeric("fee", { precision: 10, scale: 2 }).notNull().default("0.00"), // Actual fee charged (0 for free consultations)
  roomId: varchar("room_id", { length: 100 }).notNull().unique(), // Unique identifier for video call room
  notes: text("notes"), // Optional notes from advisor or user
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_teleconsultations_advisor").on(table.advisorId),
  index("IDX_teleconsultations_user").on(table.userId),
  index("IDX_teleconsultations_scheduled").on(table.scheduledAt),
  index("IDX_teleconsultations_status").on(table.status),
  // Prevent double-booking: same advisor cannot have overlapping consultations
  unique("UNQ_teleconsultations_no_overlap").on(table.advisorId, table.scheduledAt, table.duration),
  // Database-level validation constraints
  check("CHK_teleconsultations_status", sql`status IN ('scheduled', 'in_progress', 'completed', 'cancelled')`),
  check("CHK_teleconsultations_duration", sql`duration IN ('15min', '30min')`),
  check("CHK_teleconsultations_fee_positive", sql`fee >= 0`),
]);

// User consultation usage tracking table
export const userConsultationUsage = pgTable("user_consultation_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  advisorId: integer("advisor_id").notNull().references(() => investmentAdvisors.id),
  freeConsultationsUsed: integer("free_consultations_used").notNull().default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_consultation_usage_user").on(table.userId),
  index("IDX_consultation_usage_advisor").on(table.advisorId),
  // Proper UNIQUE constraint to ensure one record per user-advisor pair
  unique("UNQ_consultation_usage_user_advisor").on(table.userId, table.advisorId),
  // Database-level validation
  check("CHK_consultation_usage_free_count", sql`free_consultations_used >= 0`),
]);

// Enhanced Investment Advisor schema with status validation
export const insertInvestmentAdvisorSchema = createInsertSchema(investmentAdvisors).omit({
  id: true,
  createdAt: true,
  statusUpdatedAt: true,
}).extend({
  status: z.enum(["active", "offline"]).default("offline"),
  consultationFee: z.string().regex(/^\d+(\.\d{1,2})?$/).transform((val) => val).optional(),
  // Teleconsultation fields - nullable means not offering that service
  consultationFee15min: z.union([
    z.string().regex(/^\d+(\.\d{1,2})?$/).transform((val) => val === '' ? null : val),
    z.number().transform(val => val.toString()),
    z.null()
  ]).optional().nullable(),
  consultationFee30min: z.union([
    z.string().regex(/^\d+(\.\d{1,2})?$/).transform((val) => val === '' ? null : val),
    z.number().transform(val => val.toString()),
    z.null()
  ]).optional().nullable(),
  freeConsultationsPerUser: z.number().refine((val) => val === -1 || val >= 0, {
    message: "Free consultations must be -1 (unlimited) or >= 0",
  }).optional(),
  consultationEnabled: z.boolean().default(false).optional(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
}).extend({
  status: z.enum(["active", "archived"]).default("active"),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  sender: z.enum(["user", "advisor"]),
});

export type InsertInvestmentAdvisor = z.infer<typeof insertInvestmentAdvisorSchema>;
export type InvestmentAdvisor = typeof investmentAdvisors.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Teleconsultation schemas with validation
export const insertTeleconsultationSchema = createInsertSchema(teleconsultations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  duration: z.enum(["15min", "30min"]),
  status: z.enum(["scheduled", "completed", "cancelled", "in_progress"]).default("scheduled"),
  fee: z.string().regex(/^\d+(\.\d{1,2})?$/, "Fee must be a valid decimal with up to 2 decimal places").transform((val) => parseFloat(val)).refine((val) => val >= 0 && val <= 10000, {
    message: "Fee must be between 0 and 10,000 INR",
  }),
  scheduledAt: z.date().refine((date) => date > new Date(), {
    message: "Consultation must be scheduled for a future date",
  }),
});

export const insertUserConsultationUsageSchema = createInsertSchema(userConsultationUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  freeConsultationsUsed: z.number().min(0).max(100), // Reasonable limit validation
});

export type InsertTeleconsultation = z.infer<typeof insertTeleconsultationSchema>;
export type Teleconsultation = typeof teleconsultations.$inferSelect;
export type InsertUserConsultationUsage = z.infer<typeof insertUserConsultationUsageSchema>;
export type UserConsultationUsage = typeof userConsultationUsage.$inferSelect;

// Google Sheets row structure
export interface GoogleSheetsRow {
  ID: string;
  Title: string;
  Content: string;
  Type: string;
  Time: string;
  Source: string;
  Sentiment: string;
  Priority: string;
  ImageURL: string;
  Category: string;
}

// Investment Advisor Google Sheets row structure
export interface InvestmentAdvisorRow {
  Name: string;
  Company: string;
  Designation: string;
  Phone: string;
  Email: string;
  Website: string;
  Specialization: string;
  Experience: string;
  Location: string;
  Rating: string;
}

// Gmail tracking and personalized articles
export const gmailCredentials = pgTable("gmail_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiryDate: timestamp("expiry_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailInsights = pgTable("email_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  companies: text("companies").array(),
  sectors: text("sectors").array(),
  keywords: text("keywords").array(),
  topics: text("topics").array(),
  sentiment: text("sentiment").notNull(),
  scanDate: timestamp("scan_date").defaultNow(),
  emailCount: integer("email_count").default(0),
});

export const personalizedArticles = pgTable("personalized_articles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source").notNull(),
  type: text("type").notNull().default("Personalized News"),
  sentiment: text("sentiment").notNull(),
  priority: text("priority").notNull(),
  newsDate: timestamp("news_date").notNull(),
  personalizationReason: text("personalization_reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGmailCredentialsSchema = createInsertSchema(gmailCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailInsightsSchema = createInsertSchema(emailInsights).omit({
  id: true,
  scanDate: true,
});

export const insertPersonalizedArticleSchema = createInsertSchema(personalizedArticles).omit({
  id: true,
  createdAt: true,
});

export type InsertGmailCredentials = z.infer<typeof insertGmailCredentialsSchema>;
export type GmailCredentials = typeof gmailCredentials.$inferSelect;
export type InsertEmailInsights = z.infer<typeof insertEmailInsightsSchema>;
export type EmailInsights = typeof emailInsights.$inferSelect;
export type InsertPersonalizedArticle = z.infer<typeof insertPersonalizedArticleSchema>;
export type PersonalizedArticle = typeof personalizedArticles.$inferSelect;

// Comments system for Trader View articles
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id"), // For replies
  content: text("content").notNull(),
  authorName: varchar("author_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
