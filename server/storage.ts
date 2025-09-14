import { 
  users, 
  otpVerifications, 
  aiQueries, 
  aiArticles, 
  gmailCredentials, 
  emailInsights, 
  personalizedArticles,
  comments,
  investmentAdvisors,
  conversations,
  messages,
  teleconsultations,
  userConsultationUsage,
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
  type InsertComment,
  type InvestmentAdvisor,
  type InsertInvestmentAdvisor,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Teleconsultation,
  type InsertTeleconsultation,
  type UserConsultationUsage,
  type InsertUserConsultationUsage
} from "@shared/schema";
import { db } from "./db";

// Add deployment timeout wrapper
const withTimeout = async <T>(promise: Promise<T>, timeout: number = 5000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Database operation timed out')), timeout);
  });
  
  return Promise.race([promise, timeoutPromise]);
};
import { eq, and, gt, gte, sql, desc, like, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
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
  // Investment Advisors
  listInvestmentAdvisors(): Promise<InvestmentAdvisor[]>;
  createInvestmentAdvisor(advisor: InsertInvestmentAdvisor): Promise<InvestmentAdvisor>;
  // Advisor Status Management
  setAdvisorStatus(advisorId: number, status: 'active' | 'offline'): Promise<void>;
  heartbeatAdvisor(advisorId: number): Promise<void>;
  listAdvisors(filters?: {city?: string, state?: string, status?: string, search?: string}): Promise<InvestmentAdvisor[]>;
  getAdvisor(id: number): Promise<InvestmentAdvisor | undefined>;
  // Contact Preferences
  updateContactPreferences(advisorId: number, prefs: {displayPhone?: boolean, whatsappNumber?: string}): Promise<void>;
  // Messaging System
  createMessage(message: InsertMessage): Promise<Message>;
  getConversation(advisorId: number, userId: string, limit?: number): Promise<Message[]>;
  // Enhanced Messaging with Conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getOrCreateConversation(advisorId: number, userId: string): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversationById(conversationId: number): Promise<Conversation | undefined>;
  updateConversationLastMessage(conversationId: number, messagePreview: string): Promise<void>;
  markMessagesAsRead(conversationId: number, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;
  // Teleconsultation methods
  createTeleconsultation(data: InsertTeleconsultation): Promise<Teleconsultation>;
  getUserTeleconsultations(userId: string): Promise<Teleconsultation[]>;
  getAdvisorTeleconsultations(advisorId: number): Promise<Teleconsultation[]>;
  updateTeleconsultationStatus(id: number, status: string): Promise<void>;
  getUserConsultationUsage(userId: string, advisorId: number): Promise<UserConsultationUsage | undefined>;
  incrementFreeConsultationUsage(userId: string, advisorId: number): Promise<void>;
  canBookFreeConsultation(userId: string, advisorId: number): Promise<boolean>;
  // New methods for conflict checking and availability
  getAdvisorBookingsForDate(advisorId: number, date: string): Promise<Teleconsultation[]>;
  checkBookingConflicts(advisorId: number, scheduledAt: Date, duration: '15min' | '30min'): Promise<Teleconsultation[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const result = await withTimeout(
        db.select().from(users).where(eq(users.id, id)),
        3000
      ) as User[];
      const [user] = result;
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
      const result = await withTimeout(
        db.insert(users).values(insertUser).returning(),
        3000
      ) as User[];
      const [user] = result;
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

  // Investment Advisors methods
  async listInvestmentAdvisors(): Promise<InvestmentAdvisor[]> {
    try {
      const advisors = await db.select().from(investmentAdvisors)
        .orderBy(desc(investmentAdvisors.createdAt));
      return advisors;
    } catch (error) {
      console.error('Error fetching investment advisors:', error);
      return [];
    }
  }

  async createInvestmentAdvisor(advisor: InsertInvestmentAdvisor): Promise<InvestmentAdvisor> {
    const [newAdvisor] = await db.insert(investmentAdvisors)
      .values(advisor)
      .returning();
    return newAdvisor;
  }

  // Advisor Status Management methods
  async setAdvisorStatus(advisorId: number, status: 'active' | 'offline'): Promise<void> {
    try {
      await db.update(investmentAdvisors)
        .set({ 
          status, 
          statusUpdatedAt: new Date(),
          // Update lastActiveAt if setting to active
          ...(status === 'active' && { lastActiveAt: new Date() })
        })
        .where(eq(investmentAdvisors.id, advisorId));
    } catch (error) {
      console.error('Error setting advisor status:', error);
      throw error;
    }
  }

  async heartbeatAdvisor(advisorId: number): Promise<void> {
    try {
      // Only update lastActiveAt if the advisor is currently active
      await db.update(investmentAdvisors)
        .set({ lastActiveAt: new Date() })
        .where(and(
          eq(investmentAdvisors.id, advisorId),
          eq(investmentAdvisors.status, 'active')
        ));
    } catch (error) {
      console.error('Error updating advisor heartbeat:', error);
      throw error;
    }
  }

  async listAdvisors(filters?: {city?: string, state?: string, status?: string, search?: string}): Promise<InvestmentAdvisor[]> {
    try {
      let query = db.select().from(investmentAdvisors);
      
      const conditions = [];
      
      // Add filter conditions
      if (filters?.city) {
        conditions.push(like(investmentAdvisors.city, `%${filters.city}%`));
      }
      
      if (filters?.state) {
        conditions.push(like(investmentAdvisors.state, `%${filters.state}%`));
      }
      
      if (filters?.status === 'active') {
        // Show as active only if status is 'active' AND lastActiveAt is within last 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        conditions.push(and(
          eq(investmentAdvisors.status, 'active'),
          gt(investmentAdvisors.lastActiveAt, twoMinutesAgo)
        ));
      } else if (filters?.status === 'offline') {
        // Show as offline if status is 'offline' OR lastActiveAt is older than 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        conditions.push(or(
          eq(investmentAdvisors.status, 'offline'),
          sql`${investmentAdvisors.lastActiveAt} IS NULL`,
          sql`${investmentAdvisors.lastActiveAt} <= ${twoMinutesAgo}`
        ));
      }
      
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(or(
          like(investmentAdvisors.firstName, searchTerm),
          like(investmentAdvisors.lastName, searchTerm),
          like(investmentAdvisors.company, searchTerm),
          like(investmentAdvisors.city, searchTerm),
          like(investmentAdvisors.state, searchTerm)
        ));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const advisors = await query.orderBy(desc(investmentAdvisors.lastActiveAt), desc(investmentAdvisors.createdAt));
      
      return advisors.map((advisor: InvestmentAdvisor) => ({
        ...advisor,
        // Add derived status based on activity
        derivedStatus: this.getDerivedAdvisorStatus(advisor)
      }));
    } catch (error) {
      console.error('Error listing advisors with filters:', error);
      return [];
    }
  }

  async getAdvisor(id: number): Promise<InvestmentAdvisor | undefined> {
    try {
      const [advisor] = await db.select().from(investmentAdvisors)
        .where(eq(investmentAdvisors.id, id));
      
      if (!advisor) return undefined;
      
      return {
        ...advisor,
        derivedStatus: this.getDerivedAdvisorStatus(advisor)
      };
    } catch (error) {
      console.error('Error fetching advisor:', error);
      return undefined;
    }
  }

  // Helper method to calculate derived status
  private getDerivedAdvisorStatus(advisor: InvestmentAdvisor): 'active' | 'offline' {
    if (advisor.status !== 'active') return 'offline';
    if (!advisor.lastActiveAt) return 'offline';
    
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return advisor.lastActiveAt > twoMinutesAgo ? 'active' : 'offline';
  }

  // Contact Preferences methods
  async updateContactPreferences(advisorId: number, prefs: {displayPhone?: boolean, whatsappNumber?: string}): Promise<void> {
    try {
      const updateData: any = {};
      
      if (prefs.displayPhone !== undefined) {
        updateData.displayPhone = prefs.displayPhone;
      }
      
      if (prefs.whatsappNumber !== undefined) {
        updateData.whatsappNumber = prefs.whatsappNumber;
      }
      
      await db.update(investmentAdvisors)
        .set(updateData)
        .where(eq(investmentAdvisors.id, advisorId));
    } catch (error) {
      console.error('Error updating contact preferences:', error);
      throw error;
    }
  }

  // Messaging System methods
  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      // Get or create conversation first
      const conversation = await this.getOrCreateConversation(message.advisorId, message.userId);
      
      const [newMessage] = await db.insert(messages)
        .values({
          ...message,
          conversationId: conversation.id,
          createdAt: new Date(),
        })
        .returning();
      
      // Update conversation last message info
      await this.updateConversationLastMessage(conversation.id, message.content.substring(0, 100));
      
      return newMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getConversation(advisorId: number, userId: string, limit: number = 50): Promise<Message[]> {
    try {
      const conversationKey = `${advisorId}:${userId}`;
      
      const conversation = await db.select().from(messages)
        .where(eq(messages.conversationKey, conversationKey))
        .orderBy(desc(messages.createdAt))
        .limit(limit);
      
      // Return in chronological order (oldest first)
      return conversation.reverse();
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return [];
    }
  }

  // Enhanced Messaging with Conversations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      const [newConversation] = await db.insert(conversations)
        .values({
          ...conversation,
          createdAt: new Date(),
          lastMessageAt: new Date(),
        })
        .returning();
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getOrCreateConversation(advisorId: number, userId: string): Promise<Conversation> {
    try {
      // Try to find existing conversation
      const [existingConversation] = await db.select().from(conversations)
        .where(and(
          eq(conversations.advisorId, advisorId),
          eq(conversations.userId, userId)
        ))
        .limit(1);
      
      if (existingConversation) {
        return existingConversation;
      }
      
      // Create new conversation if none exists
      return this.createConversation({
        advisorId,
        userId,
        status: 'active',
        lastMessagePreview: '',
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const userConversations = await db.select({
        id: conversations.id,
        advisorId: conversations.advisorId,
        userId: conversations.userId,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        unreadCount: conversations.unreadCount,
        createdAt: conversations.createdAt,
        advisorName: sql<string>`CONCAT(${investmentAdvisors.firstName}, ' ', ${investmentAdvisors.lastName})`,
        advisorCompany: investmentAdvisors.company,
      })
        .from(conversations)
        .innerJoin(investmentAdvisors, eq(conversations.advisorId, investmentAdvisors.id))
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.lastMessageAt));
      
      return userConversations as any[];
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      return [];
    }
  }

  async getConversationById(conversationId: number): Promise<Conversation | undefined> {
    try {
      const [conversation] = await db.select().from(conversations)
        .where(eq(conversations.id, conversationId));
      return conversation || undefined;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return undefined;
    }
  }

  async updateConversationLastMessage(conversationId: number, messagePreview: string): Promise<void> {
    try {
      await db.update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: messagePreview,
          unreadCount: sql`${conversations.unreadCount} + 1`,
        })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      console.error('Error updating conversation last message:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: number, userId: string): Promise<void> {
    try {
      await db.update(messages)
        .set({ readAt: new Date() })
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.userId, userId),
          sql`${messages.readAt} IS NULL`
        ));
      
      // Reset unread count for conversation
      await db.update(conversations)
        .set({ unreadCount: 0 })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const result = await db.select({ 
        totalUnread: sql<number>`SUM(${conversations.unreadCount})` 
      })
        .from(conversations)
        .where(eq(conversations.userId, userId));
      
      return result[0]?.totalUnread || 0;
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      return 0;
    }
  }

  // Teleconsultation method implementations
  async createTeleconsultation(data: InsertTeleconsultation): Promise<Teleconsultation> {
    try {
      const [teleconsultation] = await db
        .insert(teleconsultations)
        .values(data)
        .returning();
      return teleconsultation;
    } catch (error) {
      console.error('Error creating teleconsultation:', error);
      throw error;
    }
  }

  async getUserTeleconsultations(userId: string): Promise<Teleconsultation[]> {
    try {
      return await db
        .select()
        .from(teleconsultations)
        .where(eq(teleconsultations.userId, userId))
        .orderBy(desc(teleconsultations.scheduledAt));
    } catch (error) {
      console.error('Error fetching user teleconsultations:', error);
      return [];
    }
  }

  async getAdvisorTeleconsultations(advisorId: number): Promise<Teleconsultation[]> {
    try {
      return await db
        .select()
        .from(teleconsultations)
        .where(eq(teleconsultations.advisorId, advisorId))
        .orderBy(desc(teleconsultations.scheduledAt));
    } catch (error) {
      console.error('Error fetching advisor teleconsultations:', error);
      return [];
    }
  }

  async updateTeleconsultationStatus(id: number, status: string): Promise<void> {
    try {
      await db
        .update(teleconsultations)
        .set({ 
          status: status as any,
          updatedAt: new Date()
        })
        .where(eq(teleconsultations.id, id));
    } catch (error) {
      console.error('Error updating teleconsultation status:', error);
      throw error;
    }
  }

  async getUserConsultationUsage(userId: string, advisorId: number): Promise<UserConsultationUsage | undefined> {
    try {
      const [usage] = await db
        .select()
        .from(userConsultationUsage)
        .where(and(
          eq(userConsultationUsage.userId, userId),
          eq(userConsultationUsage.advisorId, advisorId)
        ));
      return usage;
    } catch (error) {
      console.error('Error fetching user consultation usage:', error);
      return undefined;
    }
  }

  async incrementFreeConsultationUsage(userId: string, advisorId: number): Promise<void> {
    try {
      // Use atomic upsert to prevent race conditions with the unique constraint
      await db
        .insert(userConsultationUsage)
        .values({
          userId,
          advisorId,
          freeConsultationsUsed: 1,
          lastUsed: new Date()
        })
        .onConflictDoUpdate({
          target: [userConsultationUsage.userId, userConsultationUsage.advisorId],
          set: {
            freeConsultationsUsed: sql`${userConsultationUsage.freeConsultationsUsed} + 1`,
            lastUsed: new Date(),
            updatedAt: new Date()
          }
        });
    } catch (error) {
      console.error('Error incrementing free consultation usage:', error);
      throw error;
    }
  }

  async canBookFreeConsultation(userId: string, advisorId: number): Promise<boolean> {
    try {
      // Get advisor's free consultation policy
      const advisor = await this.getAdvisor(advisorId);
      if (!advisor || !advisor.consultationEnabled) {
        return false;
      }

      // If unlimited free consultations (-1), always allow
      if (advisor.freeConsultationsPerUser === -1) {
        return true;
      }

      // Check current usage
      const usage = await this.getUserConsultationUsage(userId, advisorId);
      const used = usage?.freeConsultationsUsed || 0;
      
      return used < (advisor.freeConsultationsPerUser ?? 1);
    } catch (error) {
      console.error('Error checking free consultation eligibility:', error);
      return false;
    }
  }

  // ATOMIC CONFLICT CHECKING - Security and Double-booking Prevention
  async getAdvisorBookingsForDate(advisorId: number, date: string): Promise<Teleconsultation[]> {
    try {
      // Parse date to get start and end of day for proper filtering
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      
      const bookings = await db
        .select()
        .from(teleconsultations)
        .where(
          and(
            eq(teleconsultations.advisorId, advisorId),
            gte(teleconsultations.scheduledAt, startOfDay),
            sql`${teleconsultations.scheduledAt} <= ${endOfDay}`,
            // Only include scheduled and in-progress bookings for conflict checking
            or(
              eq(teleconsultations.status, 'scheduled'),
              eq(teleconsultations.status, 'in_progress')
            )
          )
        )
        .orderBy(teleconsultations.scheduledAt);
      
      return bookings;
    } catch (error) {
      console.error('Error fetching advisor bookings for date:', error);
      return [];
    }
  }

  async checkBookingConflicts(advisorId: number, scheduledAt: Date, duration: '15min' | '30min'): Promise<Teleconsultation[]> {
    try {
      // Calculate consultation end time
      const durationMinutes = duration === '15min' ? 15 : 30;
      const endTime = new Date(scheduledAt.getTime() + (durationMinutes * 60 * 1000));
      
      // Check for overlapping bookings using database-level queries for atomicity
      const conflicts = await db
        .select()
        .from(teleconsultations)
        .where(
          and(
            eq(teleconsultations.advisorId, advisorId),
            // Only check scheduled and in-progress bookings
            or(
              eq(teleconsultations.status, 'scheduled'),
              eq(teleconsultations.status, 'in_progress')
            ),
            // Overlap detection: new booking conflicts if:
            // 1. New start time is before existing end time AND
            // 2. New end time is after existing start time
            sql`(
              ${scheduledAt} < (
                ${teleconsultations.scheduledAt} + 
                CASE 
                  WHEN ${teleconsultations.duration} = '15min' THEN INTERVAL '15 minutes'
                  WHEN ${teleconsultations.duration} = '30min' THEN INTERVAL '30 minutes'
                  ELSE INTERVAL '15 minutes'
                END
              )
              AND
              ${endTime} > ${teleconsultations.scheduledAt}
            )`
          )
        );
      
      return conflicts;
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      throw error; // Throw error to prevent booking in case of database issues
    }
  }
}

export const storage = new DatabaseStorage();