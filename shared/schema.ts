import { pgTable, text, serial, integer, timestamp, varchar, index, jsonb, boolean } from "drizzle-orm/pg-core";
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
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  age: integer("age"),
  gender: varchar("gender"),
  city: varchar("city"),
  occupation: varchar("occupation"),
  investmentExperience: varchar("investment_experience"),
  isVerified: varchar("is_verified").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP verification table
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number").notNull(),
  otp: varchar("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: varchar("is_used").default("false"),
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
  sourceUrl: text("source_url"), // URL to the original source
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiArticleSchema = createInsertSchema(aiArticles).omit({
  id: true,
  createdAt: true,
});

export type InsertAiArticle = z.infer<typeof insertAiArticleSchema>;
export type AiArticle = typeof aiArticles.$inferSelect;

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
  name: text("name").notNull(),
  company: text("company").default(''),
  designation: text("designation").default(''),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website").default(''),
  specialization: text("specialization").default(''),
  experience: text("experience").default(''),
  location: text("location").default(''),
  rating: text("rating").default('4.0'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvestmentAdvisorSchema = createInsertSchema(investmentAdvisors).omit({
  id: true,
  createdAt: true,
});

export type InsertInvestmentAdvisor = z.infer<typeof insertInvestmentAdvisorSchema>;
export type InvestmentAdvisor = typeof investmentAdvisors.$inferSelect;

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
