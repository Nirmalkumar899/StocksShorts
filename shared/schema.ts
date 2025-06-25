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
  type: text("type").notNull(), // NIFTY, SENSEX, IPO, MARKET, CRYPTO, etc.
  time: timestamp("time").notNull(),
  source: text("source").notNull(),
  sentiment: text("sentiment").notNull(), // Positive, Negative, Neutral
  priority: text("priority").notNull(), // High, Medium, Low
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
}
