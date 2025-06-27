import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleSheetsService } from "./services/googleSheets";
import { mobileAuth } from "./mobileAuth";
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

  const httpServer = createServer(app);
  return httpServer;
}
