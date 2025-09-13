import { pgTable, text, serial, integer, timestamp, varchar, index, jsonb, boolean } from "drizzle-orm/pg-core";
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
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  
  // Professional Information
  sebiRegistrationNumber: text("sebi_registration_number").notNull(),
  companyName: text("company_name").default(''),
  qualification: text("qualification").default(''),
  experience: integer("experience").notNull(), // Years as integer
  yearsInBusiness: integer("years_in_business").default(0),
  
  // Office Contact Information
  officeAddress: text("office_address").default(''),
  city: text("city").default(''),
  state: text("state").default(''),
  pincode: text("pincode").default(''),
  professionalPhone: text("professional_phone").default(''),
  
  // Online Presence
  websiteUrl: text("website_url").default(''),
  linkedinProfile: text("linkedin_profile").default(''),
  articleLinks: text("article_links").array(),
  socialMediaLinks: text("social_media_links").array(),
  
  // Professional Services
  specializations: text("specializations").array(),
  servicesOffered: text("services_offered").array(),
  languagesSpoken: text("languages_spoken").array(),
  aboutYou: text("about_you").default(''),
  consultationFee: integer("consultation_fee").notNull(), // Fee in rupees as integer
  
  // Legal Requirements (stored as booleans for validation)
  acceptTerms: boolean("accept_terms").default(false),
  acceptPrivacy: boolean("accept_privacy").default(false),
  acceptDisclaimer: boolean("accept_disclaimer").default(false),
  
  // Availability
  availableForConsultations: boolean("available_for_consultations").default(true),
  
  // Legacy fields for compatibility (keeping these for existing data)
  name: text("name").default(''), // Will be computed from firstName + lastName
  company: text("company").default(''),
  designation: text("designation").default(''),
  phone: text("phone").default(''),
  website: text("website").default(''),
  specialization: text("specialization").default(''),
  location: text("location").default(''),
  rating: text("rating").default('4.0'),
  profilePictureUrl: text("profile_picture_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  whatsappNumber: text("whatsapp_number"),
  videoCallAvailable: boolean("video_call_available").default(false),
  whatsappAvailable: boolean("whatsapp_available").default(false),
  bio: text("bio").default(''),
  languages: text("languages").default('English'),
  availabilityHours: text("availability_hours").default('9 AM - 6 PM'),
  isVerified: boolean("is_verified").default(false),
  registrationStatus: text("registration_status").default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schema with proper validation
export const insertInvestmentAdvisorSchema = createInsertSchema(investmentAdvisors)
  .omit({
    id: true,
    createdAt: true,
    name: true, // Will be computed from firstName + lastName
    company: true, // Legacy field
    designation: true, // Legacy field
    phone: true, // Legacy field
    website: true, // Legacy field
    specialization: true, // Legacy field
    location: true, // Legacy field
    rating: true, // Legacy field
    profilePictureUrl: true, // Legacy field
    linkedinUrl: true, // Legacy field
    twitterUrl: true, // Legacy field
    facebookUrl: true, // Legacy field
    whatsappNumber: true, // Legacy field
    videoCallAvailable: true, // Legacy field
    whatsappAvailable: true, // Legacy field
    bio: true, // Legacy field
    languages: true, // Legacy field
    availabilityHours: true, // Legacy field
    isVerified: true, // Admin controlled
    registrationStatus: true, // Admin controlled
  })
  .extend({
    // Add custom validation rules
    email: z.string().email("Please enter a valid email address"),
    sebiRegistrationNumber: z.string().min(1, "SEBI registration number is required"),
    experience: z.number().min(1, "Experience must be at least 1 year").max(50, "Experience cannot exceed 50 years"),
    consultationFee: z.number().min(0, "Fee must be at least ₹0").max(10000, "Fee cannot exceed ₹10,000"),
    specializations: z.array(z.string()).min(1, "Please select at least one specialization"),
    servicesOffered: z.array(z.string()).min(1, "Please select at least one service"),
    languagesSpoken: z.array(z.string()).min(1, "Please select at least one language"),
    aboutYou: z.string().min(10, "Please provide at least 10 characters about yourself").max(1000, "Description cannot exceed 1000 characters"),
    acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
    acceptPrivacy: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
    acceptDisclaimer: z.boolean().refine(val => val === true, "You must acknowledge the professional disclaimer"),
    websiteUrl: z.string().url("Please enter a valid website URL").optional().or(z.literal('')),
    linkedinProfile: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal('')),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional().or(z.literal('')),
    professionalPhone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits").optional().or(z.literal('')),
  });

export type InsertInvestmentAdvisor = z.infer<typeof insertInvestmentAdvisorSchema>;
export type InvestmentAdvisor = typeof investmentAdvisors.$inferSelect;

// Constants for form dropdowns
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Jammu and Kashmir', 'Ladakh'
] as const;

export const QUALIFICATIONS = [
  'SEBI Registered Investment Advisor',
  'CFA (Chartered Financial Analyst)',
  'CFP (Certified Financial Planner)',
  'CA (Chartered Accountant)',
  'CS (Company Secretary)',
  'CMA (Cost and Management Accountant)',
  'MBA Finance',
  'Other'
] as const;

export const SPECIALIZATIONS = [
  'Equity Markets', 'Mutual Funds', 'Fixed Deposits', 'Insurance Planning',
  'Retirement Planning', 'Tax Planning', 'Portfolio Management', 'Risk Assessment',
  'Commodity Trading', 'Debt Securities', 'Real Estate Investment', 'Financial Planning'
] as const;

export const SERVICES_OFFERED = [
  'Investment Planning', 'Portfolio Review', 'Risk Assessment', 'Retirement Planning',
  'Tax Planning', 'Insurance Consultation', 'Estate Planning', 'Debt Management',
  'Goal-based Planning', 'SIP Advisory', 'Mutual Fund Selection', 'Stock Research'
] as const;

export const INDIAN_LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
  'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese'
] as const;

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
