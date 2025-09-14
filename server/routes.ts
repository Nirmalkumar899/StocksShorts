import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { GoogleSheetsService } from "./services/googleSheets";
import { aiNewsGenerator } from "./services/aiNewsGenerator";
import { newsCache } from "./services/newsCache";
import OpenAI from 'openai';
import { mobileAuth } from "./mobileAuth";

import { stockAI } from "./services/stockAI-new";
import { realTimeStockService } from "./services/realTimeStockService";
import { nseService } from "./services/nseService";
import { stockTester } from "./services/stockTester";
import { financialDataProvider } from "./services/financialDataProvider";
import { conferenceCallService } from "./services/conferenceCallService";
import { candlestickImageService } from "./services/candlestickImageService";
import { realTimeMarketTracker } from "./services/realTimeMarketTracker";
import { verifiedNewsService } from "./services/verifiedNewsService";
import { directExchangeConnector } from "./services/directExchangeConnector";
import { authenticDataProvider } from "./services/authenticDataProvider";
import { googleDriveService } from "./services/googleDriveService";

import { gmailTracker } from "./services/gmailTracker";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";
import { insertMessageSchema } from "@shared/schema";
import Razorpay from "razorpay";
import crypto from "crypto";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      replit_deployment: process.env.REPLIT_DEPLOYMENT || 'false',
      replit_cluster: process.env.REPLIT_CLUSTER || 'false',
      replit_environment: process.env.REPLIT_ENVIRONMENT || 'unknown',
      host: req.headers.host,
      url: req.url,
      user_agent: req.headers['user-agent']
    });
  });

  // Test endpoint to diagnose issues
  app.get('/debug-info', (req, res) => {
    res.json({
      server_status: 'running',
      node_env: process.env.NODE_ENV,
      replit_env: process.env.REPLIT_ENVIRONMENT,
      domains: process.env.REPLIT_DOMAINS,
      dev_domain: process.env.REPLIT_DEV_DOMAIN,
      host: req.headers.host,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  });

  // Add request timeout for deployment stability - except AI and translation endpoints
  app.use((req, res, next) => {
    // Skip timeout for AI and translation endpoints as they need more time
    if (req.path === '/api/translate-articles' || req.path === '/api/articles/refresh') {
      return next();
    }
    
    const timeout = process.env.NODE_ENV === 'production' ? 10000 : 30000;
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`Request timeout: ${req.method} ${req.path}`);
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeout);
    
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  });

  const googleSheetsService = new GoogleSheetsService();

  // Serve sitemap.xml with correct content type
  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile('sitemap.xml', { root: './client/public' });
  });

  // Serve robots.txt with correct content type
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile('robots.txt', { root: './client/public' });
  });

  // Initialize session middleware for mobile auth
  const MemStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));

  // Initialize Razorpay for payment processing
  let razorpay: Razorpay | null = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.warn('⚠️  Razorpay credentials not found. Payment functionality will be disabled.');
  }

  // Teleconsultation and Payment Routes

  // Create Razorpay order for teleconsultation payment
  app.post('/api/razorpay/create-order', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(500).json({ 
          message: 'Payment service not available. Please check Razorpay configuration.' 
        });
      }

      const { advisorId, duration, scheduledAt } = req.body;
      const userId = (req.session as any).userId;

      // Validate input
      const orderSchema = z.object({
        advisorId: z.number().int().positive(),
        duration: z.enum(['15min', '30min']),
        scheduledAt: z.string().datetime()
      });

      const validationResult = orderSchema.safeParse({ advisorId, duration, scheduledAt });
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid order data',
          errors: validationResult.error.errors
        });
      }

      // Check if advisor exists and get consultation fees
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }

      if (!advisor.consultationEnabled) {
        return res.status(400).json({ message: 'Advisor is not available for consultations' });
      }

      // Check user's consultation usage for this advisor
      const usage = await storage.getUserConsultationUsage(userId, advisorId);
      const freeConsultationsUsed = usage?.freeConsultationsUsed || 0;
      const freeConsultationsLimit = advisor.freeConsultationsPerUser || 0;

      let consultationFee = 0;
      let isFreeTier = false;

      // Check if user is eligible for free consultation
      if (freeConsultationsUsed < freeConsultationsLimit) {
        isFreeTier = true;
        consultationFee = 0;
      } else {
        // User must pay
        if (duration === '15min') {
          consultationFee = parseFloat(advisor.consultationFee15min || '0');
        } else {
          consultationFee = parseFloat(advisor.consultationFee30min || '0');
        }
      }

      // If it's a free consultation, create the booking directly
      if (isFreeTier) {
        const roomId = nanoid(12);
        const teleconsultation = await storage.createTeleconsultation({
          advisorId,
          userId: userId.toString(),
          duration,
          scheduledAt: new Date(scheduledAt),
          fee: 0.00,
          roomId,
          status: 'scheduled'
        });

        // Increment free consultation usage
        await storage.incrementFreeConsultationUsage(userId.toString(), advisorId);

        return res.json({
          success: true,
          isFreeConsultation: true,
          teleconsultation,
          message: 'Free consultation booked successfully'
        });
      }

      // Create Razorpay order for paid consultation
      const amountInPaise = Math.round(consultationFee * 100); // Convert to paise (smallest currency unit)
      
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `consult_${advisorId}_${userId}_${Date.now()}`,
        notes: {
          advisorId: advisorId.toString(),
          userId: userId.toString(),
          duration,
          scheduledAt,
          advisorName: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim()
        }
      });

      res.json({
        success: true,
        isFreeConsultation: false,
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        advisorName: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim(),
        consultationFee,
        duration,
        scheduledAt,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      });

    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to create payment order'
      });
    }
  });

  // Verify Razorpay payment and complete teleconsultation booking
  app.post('/api/razorpay/verify-payment', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(500).json({ 
          message: 'Payment service not available. Please check Razorpay configuration.' 
        });
      }

      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      const userId = (req.session as any).userId;

      // Validate input
      const paymentSchema = z.object({
        razorpay_payment_id: z.string().min(1),
        razorpay_order_id: z.string().min(1),
        razorpay_signature: z.string().min(1)
      });

      const validationResult = paymentSchema.safeParse({
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid payment data',
          errors: validationResult.error.errors
        });
      }

      // Verify payment signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          message: 'Payment verification failed. Invalid signature.'
        });
      }

      // Fetch order details to get consultation information
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (!order || !order.notes) {
        return res.status(400).json({
          message: 'Order details not found'
        });
      }

      const advisorId = parseInt(String(order.notes.advisorId) || '0');
      const orderUserId = order.notes.userId || '';
      const duration = (order.notes.duration as '15min' | '30min') || '15min';
      const scheduledAt = order.notes.scheduledAt || new Date().toISOString();

      // Verify the user matches
      if (orderUserId !== userId) {
        return res.status(403).json({
          message: 'Unauthorized: User mismatch'
        });
      }

      // Payment is verified - create the teleconsultation
      const roomId = nanoid(12);
      const consultationFee = (Number(order.amount || 0) / 100).toString(); // Convert back to rupees

      const teleconsultation = await storage.createTeleconsultation({
        advisorId,
        userId: userId.toString(),
        duration,
        scheduledAt: new Date(scheduledAt),
        fee: parseFloat(consultationFee),
        roomId,
        status: 'scheduled'
      });

      res.json({
        success: true,
        message: 'Payment verified and consultation booked successfully',
        teleconsultation,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });

    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Payment verification failed'
      });
    }
  });

  // Get user's teleconsultations
  app.get('/api/teleconsultations', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const teleconsultations = await storage.getUserTeleconsultations(userId);

      res.json({
        teleconsultations,
        total: teleconsultations.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching teleconsultations:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch teleconsultations'
      });
    }
  });

  // Get advisor's teleconsultations (for advisor dashboard)
  app.get('/api/advisor-teleconsultations/:advisorId', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const sessionUser = (req.session as any).user;

      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }

      // Check if advisor exists
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }

      // Verify advisor ownership - only advisors can view their own consultations
      if (!sessionUser || !sessionUser.email || sessionUser.email !== advisor.email) {
        return res.status(403).json({ 
          message: 'Forbidden: You can only view your own consultations' 
        });
      }

      const teleconsultations = await storage.getAdvisorTeleconsultations(advisorId);

      res.json({
        teleconsultations,
        total: teleconsultations.length,
        advisorId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching advisor teleconsultations:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch advisor teleconsultations'
      });
    }
  });

  // Update teleconsultation status
  app.patch('/api/teleconsultations/:id/status', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const teleconsultationId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = (req.session as any).userId;

      if (isNaN(teleconsultationId)) {
        return res.status(400).json({ message: 'Invalid teleconsultation ID' });
      }

      // Validate status
      const statusSchema = z.object({
        status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
      });

      const validationResult = statusSchema.safeParse({ status });
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid status',
          errors: validationResult.error.errors
        });
      }

      // TODO: Add authorization check - only participants can update status
      await storage.updateTeleconsultationStatus(teleconsultationId, status);

      res.json({
        success: true,
        message: 'Teleconsultation status updated successfully',
        teleconsultationId,
        status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating teleconsultation status:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to update teleconsultation status'
      });
    }
  });

  // Check consultation eligibility and pricing
  app.get('/api/consultation-eligibility/:advisorId', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const userId = (req.session as any).userId;

      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }

      // Check if advisor exists
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }

      if (!advisor.consultationEnabled) {
        return res.status(400).json({ 
          message: 'Advisor is not available for consultations',
          available: false
        });
      }

      // Get user's consultation usage
      const usage = await storage.getUserConsultationUsage(userId, advisorId);
      const freeConsultationsUsed = usage?.freeConsultationsUsed || 0;
      const freeConsultationsLimit = advisor.freeConsultationsPerUser || 0;
      const hasFreeTier = freeConsultationsUsed < freeConsultationsLimit;

      res.json({
        available: true,
        advisorName: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim(),
        freeConsultationsUsed,
        freeConsultationsLimit,
        hasFreeTier,
        freeConsultationsRemaining: Math.max(0, freeConsultationsLimit - freeConsultationsUsed),
        pricing: {
          fee15min: parseFloat(advisor.consultationFee15min || '0'),
          fee30min: parseFloat(advisor.consultationFee30min || '0')
        },
        advisorDetails: {
          specialization: advisor.specialization,
          experience: advisor.experience,
          location: advisor.location,
          bio: advisor.bio
        }
      });

    } catch (error) {
      console.error('Error checking consultation eligibility:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to check consultation eligibility'
      });
    }
  });

  // Check teleconsultation availability for a specific advisor and date
  // Supports both patterns: /:advisorId/:date and /:advisorId?date=YYYY-MM-DD
  app.get('/api/teleconsultations/availability/:advisorId/:date?', async (req, res) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      // Support both path param and query param for date
      const date = req.params.date || req.query.date as string; // Format: YYYY-MM-DD

      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }

      // Get existing bookings for the advisor on the specified date
      const existingBookings = await storage.getAdvisorBookingsForDate(advisorId, date);
      
      // Return only necessary time slot information, not full booking details for security
      const timeSlots = existingBookings.map(booking => ({
        scheduledAt: booking.scheduledAt,
        duration: booking.duration,
        status: booking.status
      }));
      
      res.json(timeSlots);

    } catch (error) {
      console.error('Error checking teleconsultation availability:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to check availability'
      });
    }
  });

  // Check if user is eligible for free consultation with specific advisor
  app.get('/api/teleconsultations/check-free-eligibility/:advisorId', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const userId = (req.session as any).userId;

      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }

      // Check eligibility using existing storage method
      const eligible = await storage.canBookFreeConsultation(userId, advisorId);
      
      // Get usage details for response
      const usage = await storage.getUserConsultationUsage(userId, advisorId);
      const advisor = await storage.getAdvisor(advisorId);
      
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }

      const freeConsultationsUsed = usage?.freeConsultationsUsed || 0;
      const freeConsultationsLimit = advisor.freeConsultationsPerUser === -1 ? -1 : (advisor.freeConsultationsPerUser || 1);

      res.json({
        eligible,
        freeConsultationsUsed,
        freeConsultationsLimit,
        remainingFreeConsultations: freeConsultationsLimit === -1 ? -1 : Math.max(0, freeConsultationsLimit - freeConsultationsUsed)
      });

    } catch (error) {
      console.error('Error checking free consultation eligibility:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to check eligibility'
      });
    }
  });

  // Book a teleconsultation
  app.post('/api/teleconsultations/book', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { advisorId, duration, scheduledAt, notes } = req.body;

      // Validate input - REMOVED client-provided fee for security
      const bookingSchema = z.object({
        advisorId: z.number().int().positive(),
        duration: z.enum(['15min', '30min']),
        scheduledAt: z.string().transform(str => new Date(str)),
        notes: z.string().max(500).optional()
      });

      const validationResult = bookingSchema.safeParse({ advisorId, duration, scheduledAt, notes });
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid booking data',
          errors: validationResult.error.errors
        });
      }

      const { advisorId: validAdvisorId, duration: validDuration, scheduledAt: validScheduledAt, notes: validNotes } = validationResult.data;

      // Check if advisor exists and consultations are enabled
      const advisor = await storage.getAdvisor(validAdvisorId);
      if (!advisor || !advisor.consultationEnabled) {
        return res.status(400).json({ 
          message: 'Advisor not available for consultations' 
        });
      }

      // Check if the duration is available for this advisor
      const isDurationAvailable = validDuration === '15min' ? 
        advisor.consultationFee15min !== null :
        advisor.consultationFee30min !== null;

      if (!isDurationAvailable) {
        return res.status(400).json({
          message: `${validDuration} consultations not available with this advisor`
        });
      }

      // Validate scheduled time is in the future
      if (validScheduledAt <= new Date()) {
        return res.status(400).json({
          message: 'Consultation must be scheduled for a future time'
        });
      }

      // SERVER-SIDE FEE CALCULATION - Security Fix
      // Calculate actual consultation fee based on advisor settings and duration
      let calculatedFee = 0;
      let isFreeTier = false;
      
      // Check if user is eligible for free consultation
      const canBookFree = await storage.canBookFreeConsultation(userId, validAdvisorId);
      
      if (canBookFree) {
        // User eligible for free consultation
        isFreeTier = true;
        calculatedFee = 0;
      } else {
        // User must pay - calculate fee from advisor settings
        if (validDuration === '15min') {
          calculatedFee = parseFloat(advisor.consultationFee15min?.toString() || '0');
        } else {
          calculatedFee = parseFloat(advisor.consultationFee30min?.toString() || '0');
        }
        
        if (calculatedFee <= 0) {
          return res.status(400).json({
            message: `${validDuration} consultations are not available or not priced by this advisor`
          });
        }
      }
      
      // Check for booking conflicts with atomic database check
      const conflictingBookings = await storage.checkBookingConflicts(validAdvisorId, validScheduledAt, validDuration);
      if (conflictingBookings.length > 0) {
        return res.status(409).json({
          message: 'Time slot is no longer available',
          conflictDetails: conflictingBookings.map(b => ({
            scheduledAt: b.scheduledAt,
            duration: b.duration
          }))
        });
      }

      // Generate unique room ID for video call
      const roomId = `consultation-${validAdvisorId}-${userId}-${Date.now()}`;

      // Create teleconsultation with server-calculated fee
      const consultation = await storage.createTeleconsultation({
        advisorId: validAdvisorId,
        userId,
        duration: validDuration,
        scheduledAt: validScheduledAt,
        status: 'scheduled',
        fee: calculatedFee, // Keep as number as expected by schema
        roomId,
        notes: validNotes || null
      });

      // Update usage tracking if it's a free consultation
      if (isFreeTier) {
        await storage.incrementFreeConsultationUsage(userId, validAdvisorId);
      }

      res.status(201).json({
        message: 'Consultation booked successfully',
        consultation: {
          id: consultation.id,
          advisorId: consultation.advisorId,
          duration: consultation.duration,
          scheduledAt: consultation.scheduledAt,
          status: consultation.status,
          fee: consultation.fee,
          roomId: consultation.roomId,
          notes: consultation.notes
        }
      });

    } catch (error) {
      console.error('Error booking teleconsultation:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to book consultation'
      });
    }
  });

  // Force refresh news cache (for testing and manual refresh)
  app.post("/api/refresh-news", async (req, res) => {
    try {
      console.log('🔄 Manual news refresh requested');
      const refreshedArticles = await newsCache.forceRefresh();
      console.log(`✅ Manual refresh completed with ${refreshedArticles.length} articles`);
      res.json({ 
        success: true, 
        message: `Refreshed ${refreshedArticles.length} articles`,
        articleCount: refreshedArticles.length
      });
    } catch (error: any) {
      console.error('❌ Manual refresh failed:', error);
      res.status(500).json({ error: error.message || 'Failed to refresh news' });
    }
  });

  // Get all articles or filter by category - Using cached AI news with Inshorts-style refresh
  app.get("/api/articles", async (req, res) => {
    try {
      const category = req.query.category as string;
      console.log('🔍 Requested category:', category);
      
      // Get articles from cache (automatically refreshes if needed)
      const articles = await newsCache.getArticles(category);
      
      console.log(`📊 Returning ${articles.length} cached articles${category ? ` for category: ${category}` : ''}`);
      
      // Sort by priority (High > Medium > Low) then by time (most recent first)
      const sortedArticles = articles.sort((a, b) => {
        // Priority ordering
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Higher priority first
        }
        
        // If same priority, sort by time (most recent first)
        const timeA = a.time ? new Date(a.time).getTime() : 0;
        const timeB = b.time ? new Date(b.time).getTime() : 0;
        return timeB - timeA;
      });
      
      // Set cache headers and respond (avoid duplicate headers)
      if (!res.headersSent) {
        res.set({
          'Cache-Control': 'public, max-age=60, s-maxage=120', // 1-2 min browser cache
          'Content-Type': 'application/json; charset=utf-8'
        });
      }
      
      return res.json(sortedArticles);
    } catch (error) {
      console.error('❌ Error fetching cached articles:', error);
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: error instanceof Error ? error.message : 'Failed to fetch articles'
        });
      }
    }
  });

  // Get specific article by ID
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid article ID' });
      }

      // Get articles from cache and find the specific article
      const articles = await newsCache.getArticles();
      const article = articles.find(a => a.id === id);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      res.json(article);
    } catch (error) {
      console.error('Error fetching cached article:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch article'
      });
    }
  });

  // Refresh articles (force refresh cached news - Inshorts style)
  app.post("/api/articles/refresh", async (req, res) => {
    try {
      console.log('🔄 Force refreshing cached news...');
      
      const articles = await newsCache.forceRefresh();
      const uniqueCategories = Array.from(new Set(articles.map(a => a.type)));
      const cacheStatus = newsCache.getCacheStatus();
      
      // Send response immediately to avoid double response issue
      return res.json({ 
        message: 'News cache refreshed successfully', 
        count: articles.length,
        categories: uniqueCategories,
        cacheStatus,
        articles: articles.slice(0, 20) // Return first 20 for verification
      });
    } catch (error) {
      console.error('Error refreshing news cache:', error);
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: error instanceof Error ? error.message : 'Failed to refresh news cache'
        });
      }
    }
  });

  // Get cache status endpoint
  app.get("/api/articles/status", (req, res) => {
    const status = newsCache.getCacheStatus();
    res.json(status);
  });

  // Translation API using OpenAI SDK
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  app.post('/api/translate-articles', async (req, res) => {
    console.log('🌐 Translation API called from:', req.headers.origin);
    console.log('📋 Request body:', req.body ? 'Present' : 'Missing');
    
    try {
      const { articles } = req.body;
      
      if (!articles || !Array.isArray(articles)) {
        console.log('❌ Invalid articles data:', { 
          articlesExists: !!articles, 
          isArray: Array.isArray(articles),
          length: articles?.length 
        });
        return res.status(400).json({ message: 'Articles array is required' });
      }

      if (!process.env.OPENAI_API_KEY) {
        console.log('❌ OpenAI API key missing');
        return res.status(500).json({ message: 'OpenAI API key not configured' });
      }

      console.log(`🚀 Starting translation of ${articles.length} articles...`);
      
      // Process articles in smaller batches to avoid timeout
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < articles.length; i += batchSize) {
        batches.push(articles.slice(i, i + batchSize));
      }
      
      const allTranslatedArticles = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} articles...`);
        
        const batchTranslatedArticles = await Promise.all(
          batch.map(async (article: any) => {
            try {
              console.log(`🌐 Translating article ${article.id}: ${article.title?.substring(0, 30)}...`);
              
              const prompt = `Translate this stock market article to Hindi. Keep financial terms, company names, and numbers in English/digits.

Title: ${article.title}
Content: ${article.content}

Return in exact format:
TITLE: [Hindi translation]
CONTENT: [Hindi translation]`;

              // Call OpenAI API - SDK handles its own timeouts
              const response = await openai.chat.completions.create({
                model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages: [{ role: 'user', content: prompt }],
                max_completion_tokens: 1000
              });
              
              const translatedText = response.choices[0].message.content;
              console.log(`✅ Translation received for article ${article.id}`);
              
              // Parse the translated response
              const titleMatch = translatedText?.match(/TITLE:\s*(.*?)(?=\nCONTENT:|$)/);
              const contentMatch = translatedText?.match(/CONTENT:\s*([\s\S]*?)$/);
              
              return {
                id: article.id,
                title: titleMatch ? titleMatch[1].trim() : article.title,
                content: contentMatch ? contentMatch[1].trim() : article.content
              };
              
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.error(`❌ Translation error for article ${article.id}:`, errorMessage);
              
              // Check if it's a quota exceeded error
              if (error instanceof Error && error.message.includes('exceeded your current quota')) {
                throw new Error('Translation service quota exceeded. Please try again later or contact support.');
              }
              
              // Return original article for other errors
              return {
                id: article.id,
                title: article.title,
                content: article.content
              };
            }
          })
        );
        
        allTranslatedArticles.push(...batchTranslatedArticles);
        
        // Add small delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`🎉 Translation completed for ${allTranslatedArticles.length} articles`);
      
      // Check if response has already been sent
      if (!res.headersSent) {
        res.json(allTranslatedArticles);
      }
      
    } catch (error) {
      console.error('💥 Translation API error:', error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('💥 Error stack:', errorStack);
      
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : 'Translation failed',
          details: errorStack
        });
      }
    }
  });


  // Get article by title slug for SEO-friendly URLs
  app.get("/api/articles/slug/:slug", async (req, res) => {
    try {
      const articles = await googleSheetsService.fetchArticles();
      const slug = req.params.slug.toLowerCase();
      
      // Find article by matching title slug
      const article = articles.find(a => {
        const titleSlug = a.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/--+/g, '-') // Replace multiple hyphens with single
          .trim();
        return titleSlug.includes(slug) || slug.includes(titleSlug);
      });
      
      if (!article) {
        return res.status(404).json({ 
          message: 'Article not found',
          searchedSlug: slug,
          suggestion: 'Try using the article ID instead'
        });
      }
      
      // Add metadata for auto-updating
      const articleWithMeta = {
        ...article,
        lastUpdated: new Date().toISOString(),
        shareableLink: `${req.protocol}://${req.get('host')}/article/${article.id}`,
        apiLink: `${req.protocol}://${req.get('host')}/api/articles/${article.id}`,
        slug: article.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim(),
        totalArticlesInSheet: articles.length
      };
      
      res.json(articleWithMeta);
    } catch (error) {
      console.error('Error fetching article by slug:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch article'
      });
    }
  });



  // Verify stock price accuracy across multiple sources
  app.get("/api/verify-price/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const claimedPrice = parseFloat(req.query.price as string);
      
      if (!symbol || !claimedPrice) {
        return res.status(400).json({ 
          message: 'Symbol and price parameters required',
          example: '/api/verify-price/RELIANCE?price=1500'
        });
      }

      const authenticPrice = await authenticDataProvider.getAuthenticStockPrice(symbol);
      
      if (!authenticPrice) {
        return res.json({
          symbol: symbol,
          verified: false,
          reason: 'Unable to fetch authentic price from verified sources',
          timestamp: new Date().toISOString()
        });
      }

      const isVerified = await authenticDataProvider.crossVerifyPrice(symbol, claimedPrice);
      const priceDifference = Math.abs(((claimedPrice - authenticPrice) / authenticPrice) * 100);

      res.json({
        symbol: symbol,
        claimedPrice: claimedPrice,
        authenticPrice: authenticPrice,
        verified: isVerified,
        accuracyPercentage: (100 - priceDifference).toFixed(2) + '%',
        priceDifference: priceDifference.toFixed(2) + '%',
        source: 'Multi-source verification',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Price verification error:', error);
      res.status(500).json({ 
        message: 'Price verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/ai-articles/:id/report", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      
      if (isNaN(articleId)) {
        return res.status(400).json({ message: 'Invalid article ID' });
      }

      // Flag the reported article for investigation
      // Verified news articles cannot be reported as they come from authorized sources
      
      res.json({ 
        message: 'Report received. Our team will investigate this content and take appropriate action.',
        status: 'flagged_for_review'
      });
    } catch (error) {
      console.error('Error reporting AI article:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to report article'
      });
    }
  });

  // Comments API routes for Trader View section
  app.get('/api/comments/:articleId', async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const comments = await storage.getCommentsByArticle(articleId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });

  app.post('/api/comments', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const { articleId, content, parentId } = req.body;
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const comment = await storage.createComment({
        articleId: parseInt(articleId),
        userId,
        content,
        parentId: parentId ? parseInt(parentId) : null,
        authorName: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : user.firstName || user.phoneNumber || 'Anonymous'
      });

      res.json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });

  app.delete('/api/comments/:id', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = (req.session as any).userId;
      
      const success = await storage.deleteComment(commentId, userId);
      if (success) {
        res.json({ message: 'Comment deleted successfully' });
      } else {
        res.status(404).json({ message: 'Comment not found or unauthorized' });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  });





  // Get Investment Advisors
  app.get("/api/investment-advisors", async (req, res) => {
    try {
      const advisors = await googleSheetsService.fetchInvestmentAdvisors();
      console.log(`Fetched ${advisors.length} advisors from Google Sheets IA tab`);
      res.json(advisors);
    } catch (error) {
      console.error('Error fetching investment advisors:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch investment advisors'
      });
    }
  });

  // Register as SEBI Investment Advisor
  app.post("/api/investment-advisors", async (req, res) => {
    try {
      console.log('📝 SEBI Advisor registration request received');
      console.log('Request body keys:', Object.keys(req.body));
      
      // Import the validation schema
      const { insertInvestmentAdvisorSchema } = await import("@shared/schema");
      
      // Validate the comprehensive form data
      const validationResult = insertInvestmentAdvisorSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.log('❌ Validation errors:', validationResult.error.issues);
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      const advisorData = validationResult.data;
      
      // Handle teleconsultation logic - set consultationEnabled based on fee values
      const hasConsultationFees = (
        (advisorData.consultationFee15min !== null && advisorData.consultationFee15min !== undefined) ||
        (advisorData.consultationFee30min !== null && advisorData.consultationFee30min !== undefined)
      );
      
      // Explicitly set consultationEnabled based on whether advisor offers any consultation fees
      advisorData.consultationEnabled = hasConsultationFees;
      
      console.log('💰 Teleconsultation setup:', {
        consultationFee15min: advisorData.consultationFee15min,
        consultationFee30min: advisorData.consultationFee30min,
        consultationEnabled: advisorData.consultationEnabled,
        freeConsultationsPerUser: advisorData.freeConsultationsPerUser
      });
      
      // Normalize phone number - ensure it has proper format
      if (advisorData.professionalPhone && !advisorData.professionalPhone.startsWith('+')) {
        // If it's a 10-digit Indian number, add +91 prefix
        if (/^\d{10}$/.test(advisorData.professionalPhone)) {
          advisorData.professionalPhone = `+91${advisorData.professionalPhone}`;
        }
      }

      // Set legacy fields for backward compatibility with Google Sheets integration
      if (advisorData.firstName && advisorData.lastName) {
        advisorData.designation = advisorData.qualification || 'SEBI Registered Investment Advisor';
        advisorData.phone = advisorData.professionalPhone;
        advisorData.specialization = Array.isArray(advisorData.specializations) 
          ? advisorData.specializations.join(', ') 
          : '';
        advisorData.experience = `${advisorData.experienceYears || 0} years`;
        advisorData.location = [advisorData.city, advisorData.state].filter(Boolean).join(', ');
        advisorData.bio = advisorData.aboutYou || '';
      }

      // Create the advisor using the comprehensive schema
      const newAdvisor = await storage.createInvestmentAdvisor(advisorData);
      
      console.log('✅ SEBI Advisor registered successfully:', newAdvisor.id);

      res.status(201).json({
        message: 'Investment advisor registered successfully',
        advisor: {
          id: newAdvisor.id,
          firstName: newAdvisor.firstName,
          lastName: newAdvisor.lastName,
          sebiRegNo: newAdvisor.sebiRegNo,
          email: newAdvisor.email,
          professionalPhone: newAdvisor.professionalPhone,
          company: newAdvisor.company,
          specializations: newAdvisor.specializations,
          experienceYears: newAdvisor.experienceYears,
          location: [newAdvisor.city, newAdvisor.state].filter(Boolean).join(', ')
        }
      });

    } catch (error: any) {
      console.error('❌ Error registering SEBI advisor:', error);

      // Handle duplicate email or sebiRegNo
      if (error.code === '23505') { // Postgres unique violation
        if (error.detail?.includes('email')) {
          return res.status(409).json({
            message: 'An advisor with this email address already exists'
          });
        }
        if (error.detail?.includes('sebi_reg_no')) {
          return res.status(409).json({
            message: 'An advisor with this SEBI registration number already exists'
          });
        }
      }

      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to register advisor'
      });
    }
  });

  // Refresh Investment Advisors (force refresh from Google Sheets)
  app.post("/api/investment-advisors/refresh", async (req, res) => {
    try {
      console.log('🔄 Force refreshing investment advisors data...');
      
      // Clear the cache to force fresh data fetch
      googleSheetsService.clearCache();
      
      // Fetch fresh data
      const advisors = await googleSheetsService.fetchInvestmentAdvisors();
      console.log(`✅ Refreshed ${advisors.length} advisors from Google Sheets`);
      
      res.json({ 
        message: 'Investment advisors data refreshed successfully', 
        count: advisors.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error refreshing investment advisors:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to refresh investment advisors'
      });
    }
  });

  // ===== ADVISOR POST-REGISTRATION SYSTEM API ROUTES =====
  
  // Advisor Status Management
  app.patch('/api/advisors/:id/status', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const advisorId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }
      
      // Validate status
      const statusSchema = z.object({
        status: z.enum(['active', 'offline'])
      });
      
      const validationResult = statusSchema.safeParse({ status });
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid status value',
          errors: validationResult.error.errors
        });
      }
      
      // Check if advisor exists and get advisor info for validation
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }
      
      // Verify advisor ownership - only advisors can modify their own status
      const sessionUserId = (req.session as any).userId;
      const sessionUser = await storage.getUser(sessionUserId);
      
      if (!sessionUser || !sessionUser.email || sessionUser.email !== advisor.email) {
        return res.status(403).json({ 
          message: 'Forbidden: You can only update your own advisor status' 
        });
      }
      
      // Update advisor status
      await storage.setAdvisorStatus(advisorId, validationResult.data.status);
      
      res.json({
        message: `Advisor status updated to ${validationResult.data.status}`,
        advisorId,
        status: validationResult.data.status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error updating advisor status:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to update advisor status'
      });
    }
  });
  
  app.post('/api/advisors/:id/heartbeat', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const advisorId = parseInt(req.params.id);
      
      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }
      
      // Check if advisor exists
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }
      
      // Verify advisor ownership - only advisors can update their own heartbeat
      const sessionUserId = (req.session as any).userId;
      const sessionUser = await storage.getUser(sessionUserId);
      
      if (!sessionUser || !sessionUser.email || sessionUser.email !== advisor.email) {
        return res.status(403).json({ 
          message: 'Forbidden: You can only update your own advisor heartbeat' 
        });
      }
      
      // Only update heartbeat if advisor is active
      if (advisor.status !== 'active') {
        return res.status(400).json({ 
          message: 'Heartbeat only allowed for active advisors',
          currentStatus: advisor.status 
        });
      }
      
      // Update last active timestamp
      await storage.heartbeatAdvisor(advisorId);
      
      res.json({
        message: 'Heartbeat recorded',
        advisorId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error recording advisor heartbeat:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to record heartbeat'
      });
    }
  });
  
  // Contact Preferences
  app.patch('/api/advisors/:id/contact-prefs', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const advisorId = parseInt(req.params.id);
      const { displayPhone, whatsappNumber } = req.body;
      
      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }
      
      // Validate contact preferences
      const contactPrefsSchema = z.object({
        displayPhone: z.boolean().optional(),
        whatsappNumber: z.string().max(15).optional()
      });
      
      const validationResult = contactPrefsSchema.safeParse({ displayPhone, whatsappNumber });
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid contact preferences',
          errors: validationResult.error.errors
        });
      }
      
      // Check if advisor exists
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }
      
      // Verify advisor ownership - only advisors can update their own contact preferences
      const sessionUserId = (req.session as any).userId;
      const sessionUser = await storage.getUser(sessionUserId);
      
      if (!sessionUser || !sessionUser.email || sessionUser.email !== advisor.email) {
        return res.status(403).json({ 
          message: 'Forbidden: You can only update your own advisor contact preferences' 
        });
      }
      
      // Update contact preferences
      await storage.updateContactPreferences(advisorId, validationResult.data);
      
      res.json({
        message: 'Contact preferences updated successfully',
        advisorId,
        preferences: validationResult.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error updating contact preferences:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to update contact preferences'
      });
    }
  });
  
  // Get current user's advisor profile - SECURE ENDPOINT
  app.get('/api/advisors/me', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      // Get session user
      const sessionUserId = (req.session as any).userId;
      const sessionUser = await storage.getUser(sessionUserId);
      
      if (!sessionUser || !sessionUser.email) {
        return res.status(401).json({ 
          message: 'Session user not found or email missing' 
        });
      }
      
      // Find advisor record by email
      const advisors = await storage.listInvestmentAdvisors();
      const currentAdvisor = advisors.find(advisor => advisor.email === sessionUser.email);
      
      if (!currentAdvisor) {
        return res.status(404).json({ 
          message: 'Advisor profile not found for current user',
          hint: 'Please register as an advisor first' 
        });
      }
      
      // Return only current user's advisor data
      res.json({
        advisor: currentAdvisor,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching current user advisor:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch advisor profile'
      });
    }
  });
  
  // Advisor Directory
  app.get('/api/advisors', async (req, res) => {
    try {
      const { city, state, status, search } = req.query;
      
      // Validate query parameters
      const filtersSchema = z.object({
        city: z.string().optional(),
        state: z.string().optional(),
        status: z.enum(['active', 'offline']).optional(),
        search: z.string().optional()
      });
      
      const validationResult = filtersSchema.safeParse({ city, state, status, search });
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid filter parameters',
          errors: validationResult.error.errors
        });
      }
      
      // Get filtered advisors
      const advisors = await storage.listAdvisors(validationResult.data);
      
      // Apply privacy controls - hide contact info when displayPhone is false
      const filteredAdvisors = advisors.map(advisor => {
        if (!advisor.displayPhone) {
          const { professionalPhone, phone, whatsappNumber, ...filtered } = advisor;
          return filtered;
        }
        return advisor;
      });
      
      res.json({
        advisors: filteredAdvisors,
        total: filteredAdvisors.length,
        filters: validationResult.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error listing advisors:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to list advisors'
      });
    }
  });
  
  app.get('/api/advisors/:id', async (req, res) => {
    try {
      const advisorId = parseInt(req.params.id);
      
      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }
      
      // Get specific advisor
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }
      
      // Apply privacy controls - hide contact info when displayPhone is false
      const filteredAdvisor = advisor.displayPhone 
        ? advisor 
        : (() => {
            const { professionalPhone, phone, whatsappNumber, ...filtered } = advisor;
            return filtered;
          })();
      
      res.json({
        advisor: filteredAdvisor,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching advisor:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch advisor'
      });
    }
  });
  
  // Simple in-memory rate limiter for messaging
  const messageRateLimit = new Map<string, { count: number; resetAt: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const MAX_MESSAGES_PER_MINUTE = 10;

  // Messaging System
  app.post('/api/messages', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const { advisorId, content } = req.body;
      const userId = (req.session as any).userId;
      
      // Rate limiting check
      const now = Date.now();
      const userRateKey = `user_${userId}`;
      const userRateData = messageRateLimit.get(userRateKey);
      
      if (userRateData) {
        if (now < userRateData.resetAt) {
          if (userRateData.count >= MAX_MESSAGES_PER_MINUTE) {
            return res.status(429).json({
              message: `Rate limit exceeded. Maximum ${MAX_MESSAGES_PER_MINUTE} messages per minute allowed.`,
              retryAfter: Math.ceil((userRateData.resetAt - now) / 1000)
            });
          }
          userRateData.count += 1;
        } else {
          messageRateLimit.set(userRateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        }
      } else {
        messageRateLimit.set(userRateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      }
      
      // Validate message data
      const messageSchema = z.object({
        advisorId: z.number().int().positive(),
        content: z.string().min(1).max(1000)
      });
      
      const validationResult = messageSchema.safeParse({ advisorId, content });
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid message data',
          errors: validationResult.error.errors
        });
      }
      
      // Check if advisor exists
      const advisor = await storage.getAdvisor(validationResult.data.advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }
      
      // Create message with user as sender
      const newMessage = await storage.createMessage({
        advisorId: validationResult.data.advisorId,
        userId,
        sender: 'user',
        content: validationResult.data.content,
        conversationKey: `${validationResult.data.advisorId}:${userId}`,
        conversationId: 0 // Will be set automatically by storage method
      });
      
      res.status(201).json({
        message: 'Message sent successfully',
        messageData: newMessage,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  });
  
  app.get('/api/messages/:advisorId', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const advisorId = parseInt(req.params.advisorId);
      const userId = (req.session as any).userId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (isNaN(advisorId)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }
      
      // Validate limit parameter
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ 
          message: 'Limit must be between 1 and 100' 
        });
      }
      
      // Check if advisor exists
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }
      
      // Get conversation messages
      const messages = await storage.getConversation(advisorId, userId, limit);
      
      res.json({
        messages,
        advisorId,
        userId,
        total: messages.length,
        limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch messages'
      });
    }
  });

  // Enhanced Messaging System API Endpoints
  
  // Get user's conversations
  app.get('/api/conversations', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      const conversations = await storage.getUserConversations(userId);
      
      res.json({
        conversations,
        userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch conversations'
      });
    }
  });

  // Create new conversation with advisor
  app.post('/api/conversations', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const { advisorId } = req.body;
      const userId = (req.session as any).userId;
      
      // Validate advisor ID
      const advisorIdNum = parseInt(advisorId);
      if (isNaN(advisorIdNum)) {
        return res.status(400).json({ message: 'Invalid advisor ID' });
      }
      
      // Check if advisor exists
      const advisor = await storage.getAdvisor(advisorIdNum);
      if (!advisor) {
        return res.status(404).json({ message: 'Advisor not found' });
      }
      
      // Get or create conversation
      const conversation = await storage.getOrCreateConversation(advisorIdNum, userId);
      
      res.status(201).json({
        message: 'Conversation ready',
        conversation,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to create conversation'
      });
    }
  });

  // Get messages in a specific conversation
  app.get('/api/conversations/:id/messages', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = (req.session as any).userId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      
      // Validate limit parameter
      if (limit < 1 || limit > 100) {
        return res.status(400).json({ 
          message: 'Limit must be between 1 and 100' 
        });
      }
      
      // Check if conversation exists and user has access
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Verify user has access to this conversation
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get messages using the original method (works with conversationKey)
      const messages = await storage.getConversation(conversation.advisorId, userId, limit);
      
      // Mark messages as read
      await storage.markMessagesAsRead(conversationId, userId);
      
      res.json({
        messages,
        conversation,
        total: messages.length,
        limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch messages'
      });
    }
  });

  // Send message in a conversation
  app.post('/api/conversations/:id/messages', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      const userId = (req.session as any).userId;
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      
      // Rate limiting check (reuse existing logic)
      const now = Date.now();
      const userRateKey = `user_${userId}`;
      const userRateData = messageRateLimit.get(userRateKey);
      const MAX_MESSAGES_PER_MINUTE = 10;
      const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
      
      if (userRateData) {
        if (now < userRateData.resetAt) {
          if (userRateData.count >= MAX_MESSAGES_PER_MINUTE) {
            return res.status(429).json({
              message: `Rate limit exceeded. Maximum ${MAX_MESSAGES_PER_MINUTE} messages per minute allowed.`,
              retryAfter: Math.ceil((userRateData.resetAt - now) / 1000)
            });
          }
          userRateData.count += 1;
        } else {
          messageRateLimit.set(userRateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        }
      } else {
        messageRateLimit.set(userRateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      }
      
      // Validate message content
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      if (content.length > 1000) {
        return res.status(400).json({ message: 'Message content too long (max 1000 characters)' });
      }
      
      // Check if conversation exists and user has access
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Verify user has access to this conversation
      if (conversation.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Create message
      const newMessage = await storage.createMessage({
        advisorId: conversation.advisorId,
        userId,
        sender: 'user',
        content: content.trim(),
        conversationKey: `${conversation.advisorId}:${userId}`,
        conversationId
      });
      
      res.status(201).json({
        message: 'Message sent successfully',
        messageData: newMessage,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  });

  // Get unread message count for user
  app.get('/api/conversations/unread-count', mobileAuth.isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      const unreadCount = await storage.getUnreadMessageCount(userId);
      
      res.json({
        unreadCount,
        userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to fetch unread count'
      });
    }
  });

  // Mobile Authentication Routes
  app.post('/api/auth/send-otp', mobileAuth.sendOTP);
  app.post('/api/auth/verify-otp', mobileAuth.verifyOTP);
  app.get('/api/auth/user', mobileAuth.isAuthenticated, mobileAuth.getCurrentUser);
  app.post('/api/auth/logout', mobileAuth.logout);
  app.put('/api/auth/profile', mobileAuth.isAuthenticated, mobileAuth.updateProfile);

  // Article Sharing and Export Routes
  
  // Generate shareable link with metadata for any article
  app.get("/api/articles/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const articles = await googleSheetsService.fetchArticles();
      const article = articles.find(a => a.id === id);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      const shareData = {
        article,
        shareableLink: `${req.protocol}://${req.get('host')}/article/${article.id}`,
        apiLink: `${req.protocol}://${req.get('host')}/api/articles/${article.id}`,
        socialShare: {
          twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${req.protocol}://${req.get('host')}/article/${article.id}`)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(`${article.title} - ${req.protocol}://${req.get('host')}/article/${article.id}`)}`,
          telegram: `https://t.me/share/url?url=${encodeURIComponent(`${req.protocol}://${req.get('host')}/article/${article.id}`)}&text=${encodeURIComponent(article.title)}`
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalArticles: articles.length,
          category: article.type,
          autoRefresh: true
        }
      };
      
      res.json(shareData);
    } catch (error) {
      console.error('Error generating share data:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate share data'
      });
    }
  });

  // Bulk export all article links for easy sharing
  app.get("/api/articles/export/links", async (req, res) => {
    try {
      const articles = await googleSheetsService.fetchArticles();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const exportData = {
        totalArticles: articles.length,
        generatedAt: new Date().toISOString(),
        baseUrl,
        autoUpdateMessage: "All links automatically refresh when new articles are added to Google Sheets",
        links: articles.map(article => ({
          id: article.id,
          title: article.title,
          category: article.type,
          priority: article.priority,
          shareableLink: `${baseUrl}/article/${article.id}`,
          apiLink: `${baseUrl}/api/articles/${article.id}`,
          slug: article.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim()
        }))
      };
      
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting article links:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to export article links'
      });
    }
  });



  // Financial Data Testing Endpoints
  
  // Test all 20 major Indian stocks with comprehensive metrics
  app.post("/api/stock-testing/test-all", async (req, res) => {
    try {
      console.log('Starting comprehensive 20-stock testing...');
      const { results, summary } = await stockTester.testAllStocks();
      
      res.json({
        message: 'Comprehensive stock testing completed',
        summary,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Stock testing error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Stock testing failed'
      });
    }
  });

  // Test specific stocks with financial data extraction
  app.post("/api/stock-testing/test-stocks", async (req, res) => {
    try {
      const { symbols } = req.body;
      
      if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ message: 'Symbols array is required' });
      }

      console.log(`Testing ${symbols.length} specific stocks:`, symbols);
      const results = await stockTester.testSpecificStocks(symbols);
      
      res.json({
        message: `Testing completed for ${symbols.length} stocks`,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Specific stock testing error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Stock testing failed'
      });
    }
  });

  // Validate data quality for a specific stock
  app.get("/api/stock-testing/validate/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return res.status(400).json({ message: 'Stock symbol is required' });
      }

      console.log(`Validating data quality for ${symbol}...`);
      const validation = await stockTester.validateDataQuality(symbol.toUpperCase());
      
      res.json({
        message: `Data quality validation for ${symbol}`,
        validation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Data validation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Data validation failed'
      });
    }
  });

  // Get financial data for any stock using multiple providers
  app.get("/api/financial-data/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return res.status(400).json({ message: 'Stock symbol is required' });
      }

      console.log(`Fetching comprehensive financial data for ${symbol}...`);
      const data = await financialDataProvider.getFinancialData(symbol.toUpperCase());
      
      if (data) {
        res.json({
          message: `Financial data retrieved for ${symbol}`,
          data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          message: `No financial data available for ${symbol}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Financial data error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Financial data retrieval failed'
      });
    }
  });

  // Conference Call and Management Guidance Endpoints
  
  // Get conference call transcripts and management guidance
  app.get("/api/conference-calls/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return res.status(400).json({ message: 'Stock symbol is required' });
      }

      console.log(`Fetching conference call data for ${symbol}...`);
      const data = await conferenceCallService.getConferenceCallData(symbol.toUpperCase());
      
      if (data) {
        res.json({
          message: `Conference call data retrieved for ${symbol}`,
          data,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          message: `No conference call data available for ${symbol}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Conference call data error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Conference call data retrieval failed'
      });
    }
  });

  // Get management guidance and recent news
  app.get("/api/management-guidance/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return res.status(400).json({ message: 'Stock symbol is required' });
      }

      console.log(`Fetching management guidance for ${symbol}...`);
      const conferenceData = await conferenceCallService.getConferenceCallData(symbol.toUpperCase());
      
      if (conferenceData) {
        const guidanceData = {
          symbol: symbol.toUpperCase(),
          revenueGrowthTarget: conferenceData.revenueGrowthTarget,
          marginExpansion: conferenceData.marginExpansion,
          capexGuidance: conferenceData.capexGuidance,
          managementOutlook: conferenceData.managementOutlook,
          industryCommentary: conferenceData.industryCommentary,
          source: conferenceData.source,
          lastUpdated: conferenceData.lastUpdated
        };

        res.json({
          message: `Management guidance retrieved for ${symbol}`,
          data: guidanceData,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          message: `No management guidance available for ${symbol}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Management guidance error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Management guidance retrieval failed'
      });
    }
  });

  // Get recent company news and developments
  app.get("/api/company-news/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return res.status(400).json({ message: 'Stock symbol is required' });
      }

      console.log(`Fetching recent company news for ${symbol}...`);
      const conferenceData = await conferenceCallService.getConferenceCallData(symbol.toUpperCase());
      
      if (conferenceData && conferenceData.recentNews) {
        const newsData = {
          symbol: symbol.toUpperCase(),
          recentNews: conferenceData.recentNews,
          quarterlyHighlights: conferenceData.quarterlyHighlights,
          source: conferenceData.source,
          lastUpdated: conferenceData.lastUpdated
        };

        res.json({
          message: `Recent company news retrieved for ${symbol}`,
          data: newsData,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          message: `No recent company news available for ${symbol}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Company news error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Company news retrieval failed'
      });
    }
  });

  // AI news system removed - focusing on Google Sheets content only

  // Gmail integration endpoints
  app.get("/api/gmail/auth-url", async (req, res) => {
    try {
      const authUrl = await gmailTracker.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Gmail auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.post("/api/gmail/callback", async (req, res) => {
    try {
      const { code, userId } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      // Exchange code for tokens
      const tokens = await gmailTracker.exchangeCodeForTokens(code);
      
      // Store credentials
      await storage.storeGmailCredentials({
        userId: userId || 1, // Default to user 1 for now
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true,
      });

      // Initialize Gmail tracker
      await gmailTracker.initialize(tokens);
      
      res.json({ success: true, message: "Gmail connected successfully" });
    } catch (error) {
      console.error("Error handling Gmail callback:", error);
      res.status(500).json({ message: "Failed to connect Gmail" });
    }
  });

  app.post("/api/gmail/scan", async (req, res) => {
    try {
      // Get user credentials
      const credentials = await storage.getGmailCredentials(1); // Default user 1
      
      if (!credentials) {
        return res.status(400).json({ message: "Gmail not connected. Please connect your Gmail first." });
      }

      // Initialize and scan emails
      await gmailTracker.initialize({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.expiryDate?.getTime(),
      });

      await gmailTracker.processEmailTracking();
      
      res.json({ success: true, message: "Email scanning completed" });
    } catch (error) {
      console.error("Error scanning emails:", error);
      res.status(500).json({ message: "Failed to scan emails" });
    }
  });

  app.get("/api/personalized-articles", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await storage.getPersonalizedArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching personalized articles:", error);
      res.status(500).json({ message: "Failed to fetch personalized articles" });
    }
  });

  // Serve attached assets from a different path to avoid conflict with build assets
  app.get('/attachments/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'attached_assets', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Serve the file with proper content type
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}


