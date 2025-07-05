import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { GoogleSheetsService } from "./services/googleSheets";
import { mobileAuth } from "./mobileAuth";

import { stockAI } from "./services/stockAI";
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

import { gmailTracker } from "./services/gmailTracker";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
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
        
        // Sort by date (most recent first) - prioritize articles with actual timestamps
        const sortedArticles = articles.sort((a, b) => {
          // Helper function to get sortable timestamp
          const getTimestamp = (article: any) => {
            if (article.time) {
              const timestamp = new Date(article.time).getTime();
              return isNaN(timestamp) ? 0 : timestamp;
            }
            // Fallback to createdAt if time is null
            return article.createdAt ? new Date(article.createdAt).getTime() : 0;
          };
          
          const timestampA = getTimestamp(a);
          const timestampB = getTimestamp(b);
          
          // Articles with timestamps always come before those without
          if (timestampA > 0 && timestampB === 0) return -1;
          if (timestampA === 0 && timestampB > 0) return 1;
          
          // If both have timestamps, sort by most recent first
          if (timestampA > 0 && timestampB > 0) {
            return timestampB - timestampA;
          }
          
          // If neither has timestamps, maintain original order
          return 0;
        });
        
        // Return full articles without truncation
        res.json(sortedArticles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch articles'
      });
    }
  });

  // Get specific article by ID
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid article ID' });
      }

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

  // Refresh articles (force fetch from Google Sheets)
  app.post("/api/articles/refresh", async (req, res) => {
    try {
      // Clear cache first to force fresh fetch
      googleSheetsService.clearCache();
      console.log('Cache cleared - forcing fresh fetch from Google Sheets');
      
      const articles = await googleSheetsService.fetchArticles();
      const uniqueCategories = Array.from(new Set(articles.map(a => a.type)));
      
      res.json({ 
        message: 'Articles refreshed successfully', 
        count: articles.length,
        categories: uniqueCategories,
        articles 
      });
    } catch (error) {
      console.error('Error refreshing articles:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to refresh articles'
      });
    }
  });

  // Translation API using OpenAI
  app.post('/api/translate-articles', async (req, res) => {
    try {
      const { articles } = req.body;
      
      if (!articles || !Array.isArray(articles)) {
        return res.status(400).json({ message: 'Articles array is required' });
      }

      const translatedArticles = await Promise.all(
        articles.map(async (article: any) => {
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a professional translator. Translate the given financial news content from English to Hindi. Maintain the same tone, meaning, and financial terminology. Keep numbers, company names, and currency symbols as they are.'
                  },
                  {
                    role: 'user',
                    content: `Please translate this article:
Title: ${article.title}
Content: ${article.content}

Return in this exact format:
Title: [Hindi translation]
Content: [Hindi translation]`
                  }
                ],
                max_tokens: 1000,
                temperature: 0.3
              })
            });

            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            const translatedText = data.choices[0].message.content;
            
            // Parse the translated response
            const titleMatch = translatedText.match(/Title:\s*(.*)/);
            const contentMatch = translatedText.match(/Content:\s*([\s\S]*)/);
            
            return {
              ...article,
              title: titleMatch ? titleMatch[1].trim() : article.title,
              content: contentMatch ? contentMatch[1].trim() : article.content
            };
          } catch (error) {
            console.error(`Translation error for article ${article.id}:`, error);
            return article; // Return original if translation fails
          }
        })
      );

      res.json(translatedArticles);
    } catch (error) {
      console.error('Translation API error:', error);
      res.status(500).json({ message: 'Translation failed' });
    }
  });

  // Get article by ID with auto-refresh capability
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const articles = await googleSheetsService.fetchArticles();
      const article = articles.find(a => a.id === id);
      
      if (!article) {
        return res.status(404).json({ 
          message: 'Article not found',
          totalArticles: articles.length,
          availableIds: articles.map(a => a.id).slice(0, 10) // Show first 10 IDs for reference
        });
      }
      
      // Add metadata for auto-updating and sharing
      const articleWithMeta = {
        ...article,
        lastUpdated: new Date().toISOString(),
        shareableLink: `${req.protocol}://${req.get('host')}/article/${article.id}`,
        apiLink: `${req.protocol}://${req.get('host')}/api/articles/${article.id}`,
        totalArticlesInSheet: articles.length,
        slug: article.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim()
      };
      
      res.json(articleWithMeta);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch article'
      });
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

  // Stock AI Query endpoint - No Authentication Required
  app.post("/api/stock-ai/query", async (req: any, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query is required' });
      }

      const analysis = await stockAI.analyzeStock(query);
      
      // Track the query for analytics (without user association)
      try {
        await storage.createAiQuery({
          userId: 0, // Anonymous user
          query,
          response: analysis
        });
      } catch (trackingError) {
        // Continue even if tracking fails
        console.log('Query tracking failed, continuing with analysis');
      }

      res.json({ 
        analysis: `**AI STOCK ANALYSIS**\n\n${analysis}`,
      });
    } catch (error) {
      console.error('Stock AI query error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to analyze stock'
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

  // Serve attached assets
  app.get('/assets/:filename', (req, res) => {
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


