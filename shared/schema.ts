import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // Index, Warrants, StocksShorts Special, Breakout Stocks, Educational, IPO, Global, Most Active, Order Win
  time: timestamp("time").notNull(),
  source: text("source").notNull(),
  sentiment: text("sentiment").notNull(), // Positive, Negative, Neutral
  priority: text("priority").notNull(), // High, Medium, Low
  imageUrl: text("image_url"), // URL for article image
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

// Investment Advisor table
export const investmentAdvisors = pgTable("investment_advisors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  designation: text("designation"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  specialization: text("specialization"),
  experience: text("experience"),
  location: text("location"),
  rating: text("rating"),
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
