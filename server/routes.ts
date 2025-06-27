import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleSheetsService } from "./services/googleSheets";
import { mobileAuth } from "./mobileAuth";
import { aiNewsService } from "./services/aiNewsService";
import { stockAI } from "./services/stockAI";
import { realTimeStockService } from "./services/realTimeStockService";
import { nseService } from "./services/nseService";
import { stockTester } from "./services/stockTester";
import { financialDataProvider } from "./services/financialDataProvider";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const googleSheetsService = new GoogleSheetsService();

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

  // Get all articles or filter by category
  app.get("/api/articles", async (req, res) => {
    try {
      const category = req.query.category as string;
      console.log('Requested category:', category);
      
      if (category && category !== 'all') {
        const articles = await googleSheetsService.getArticlesByCategory(category);
        console.log(`Found ${articles.length} articles for category: ${category}`);
        console.log('Article types found:', articles.map(a => a.type));
        res.json(articles);
      } else {
        // Set cache headers for better performance
        res.set({
          'Cache-Control': 'public, max-age=30, s-maxage=60',
          'Content-Type': 'application/json; charset=utf-8'
        });
        
        const articles = await googleSheetsService.fetchArticles();
        console.log(`Total articles: ${articles.length}`);
        // Log unique article types for debugging
        const typeSet = new Set(articles.map(a => a.type));
        const uniqueTypes: string[] = [];
        typeSet.forEach(type => uniqueTypes.push(type));
        console.log('All article categories in sheets:', uniqueTypes);
        
        // Sort by priority for trending view
        const sortedArticles = articles.sort((a, b) => {
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
          return bPriority - aPriority;
        });
        
        // Optimize response by truncating content for list view
        const optimizedArticles = sortedArticles.map(article => ({
          ...article,
          content: article.content.length > 350 ? article.content.substring(0, 350) + '...' : article.content
        }));
        
        res.json(optimizedArticles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch articles'
      });
    }
  });

  // Refresh articles (force fetch from Google Sheets)
  app.post("/api/articles/refresh", async (req, res) => {
    try {
      const articles = await googleSheetsService.fetchArticles();
      res.json({ 
        message: 'Articles refreshed successfully', 
        count: articles.length,
        articles 
      });
    } catch (error) {
      console.error('Error refreshing articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to refresh articles'
      });
    }
  });

  // Get article by ID
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const articles = await googleSheetsService.fetchArticles();
      const article = articles.find(a => a.id === id);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch article'
      });
    }
  });

  // AI News Articles Routes
  app.get("/api/ai-articles", async (req, res) => {
    try {
      const articles = await aiNewsService.getAllAiArticles();
      res.json(articles);
    } catch (error) {
      console.error('Error fetching AI articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch AI articles'
      });
    }
  });

  app.get("/api/ai-articles/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const articles = await aiNewsService.getRecentAiArticles(limit);
      res.json(articles);
    } catch (error) {
      console.error('Error fetching recent AI articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch recent AI articles'
      });
    }
  });

  app.post("/api/ai-articles/fetch", async (req, res) => {
    try {
      const articles = await aiNewsService.fetchLatestNews();
      res.json({ 
        message: 'AI articles fetched successfully', 
        count: articles.length,
        articles 
      });
    } catch (error) {
      console.error('Error fetching AI articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch AI articles'
      });
    }
  });

  // Stock AI Query endpoint
  app.post("/api/stock-ai/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query is required' });
      }

      const analysis = await stockAI.analyzeStock(query);
      res.json({ analysis });
    } catch (error) {
      console.error('Stock AI query error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to analyze stock'
      });
    }
  });

  // Test route to generate sample AI news with deduplication
  app.post("/api/ai-articles/test", async (req, res) => {
    try {
      const testArticles = [
        {
          title: "Reliance Industries: Brokers upgrade target to ₹3,200",
          content: "Reliance Industries received upgrades from multiple brokers today with target prices raised to ₹3,200-3,300 range. Strong Q3 results and petrochemical margin expansion cited as key drivers. Current price ₹2,850 offers 20% upside potential. BUY recommendation across the board.",
          sentiment: "Positive" as const,
          priority: "High" as const
        },
        {
          title: "HDFC Bank: Technical breakout signals rally to ₹1,850",
          content: "HDFC Bank broke above key resistance at ₹1,750 with volumes 2x normal. Next targets at ₹1,850 and ₹1,920. Banking sector rotation gaining momentum as NIM compression concerns fade. Stop loss ₹1,720. BUY for 15% upside.",
          sentiment: "Positive" as const,
          priority: "High" as const
        },
        {
          title: "Reliance Industries: Target price increased to ₹3,200", // Similar to first - should be filtered
          content: "Multiple brokers have raised Reliance target to ₹3,200 citing strong fundamentals.",
          sentiment: "Positive" as const,
          priority: "Medium" as const
        }
      ];

      const storedArticles = await aiNewsService.storeTestArticles(testArticles);
      res.json({ 
        message: 'Test AI articles generated with deduplication', 
        count: storedArticles.length,
        articles: storedArticles
      });
    } catch (error) {
      console.error('Error generating test AI articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate test AI articles'
      });
    }
  });

  // Get Investment Advisors
  app.get("/api/investment-advisors", async (req, res) => {
    try {
      const advisors = await googleSheetsService.fetchInvestmentAdvisors();
      res.json(advisors);
    } catch (error) {
      console.error('Error fetching investment advisors:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch investment advisors'
      });
    }
  });

  // Mobile Authentication Routes
  app.post('/api/auth/send-otp', mobileAuth.sendOTP);
  app.post('/api/auth/verify-otp', mobileAuth.verifyOTP);
  app.get('/api/auth/user', mobileAuth.isAuthenticated, mobileAuth.getCurrentUser);
  app.post('/api/auth/logout', mobileAuth.logout);
  app.put('/api/auth/profile', mobileAuth.isAuthenticated, mobileAuth.updateProfile);

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

  // Start AI News Scheduler
  startAINewsScheduler();

  const httpServer = createServer(app);
  return httpServer;
}

// AI News Scheduler - Fetch news every 15 minutes
function startAINewsScheduler() {
  console.log('Starting AI News Scheduler - fetching every 5 minutes for fresh content');
  
  // Initial fetch
  setTimeout(() => {
    aiNewsService.fetchLatestNews().catch(console.error);
  }, 5000); // Wait 5 seconds after server start

  // Schedule regular fetches every 5 minutes for fresh stock market content
  setInterval(async () => {
    try {
      console.log('Scheduled AI news fetch starting...');
      await aiNewsService.fetchLatestNews();
    } catch (error) {
      console.error('Scheduled AI news fetch failed:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
}
