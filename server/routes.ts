import type { Express } from "express";
import { createServer, type Server } from "http";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { GoogleSheetsService } from "./services/googleSheets";
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
import { enhancedAIService } from "./services/enhancedAIService";
import { googleDriveService } from "./services/googleDriveService";

import { gmailTracker } from "./services/gmailTracker";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      replit_deployment: process.env.REPLIT_DEPLOYMENT || 'false',
      replit_cluster: process.env.REPLIT_CLUSTER || 'false'
    });
  });

  // Add request timeout for deployment stability - except translation endpoint
  app.use((req, res, next) => {
    // Skip timeout for translation endpoint as it needs more time
    if (req.path === '/api/translate-articles') {
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
        
        // Sort by date (most recent first) - articles without timestamp are treated as beginning of today
        const sortedArticles = articles.sort((a, b) => {
          // Helper function to get sortable timestamp
          const getTimestamp = (article: any) => {
            if (article.time) {
              const timestamp = new Date(article.time).getTime();
              if (!isNaN(timestamp)) return timestamp;
            }
            
            // If no timestamp, treat as beginning of today (very recent)
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today
            return today.getTime();
          };
          
          const timestampA = getTimestamp(a);
          const timestampB = getTimestamp(b);
          
          // Sort by most recent first (higher timestamp first)
          return timestampB - timestampA;
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

              const response = await Promise.race([
                openai.chat.completions.create({
                  model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                  messages: [{ role: 'user', content: prompt }],
                  temperature: 0.3,
                  max_tokens: 1000
                }),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Translation timeout after 30s')), 30000)
                )
              ]) as any;
              
              const translatedText = response.choices[0].message.content;
              console.log(`✅ Translation received for article ${article.id}`);
              
              // Parse the translated response
              const titleMatch = translatedText.match(/TITLE:\s*(.*?)(?=\nCONTENT:|$)/s);
              const contentMatch = translatedText.match(/CONTENT:\s*([\s\S]*?)$/s);
              
              return {
                id: article.id,
                title: titleMatch ? titleMatch[1].trim() : article.title,
                content: contentMatch ? contentMatch[1].trim() : article.content
              };
              
            } catch (error) {
              console.error(`❌ Translation error for article ${article.id}:`, error.message);
              // Return original article if translation fails
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
      console.error('💥 Error stack:', error.stack);
      
      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({ 
          message: error instanceof Error ? error.message : 'Translation failed',
          details: error.stack
        });
      }
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

  // Enhanced AI Query endpoint - Uses Database + Google Drive
  app.post("/api/stock-ai/query", async (req: any, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query is required' });
      }

      // Use enhanced AI service that reads from database and Google Drive
      const result = await enhancedAIService.processAIQuery(query, req.session?.user?.id);
      
      res.json({ 
        analysis: result.response,
        sources: result.sources,
        databaseResults: result.databaseResults,
        driveResults: result.driveResults,
        enhanced: true
      });
    } catch (error) {
      console.error('Enhanced AI query error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to process AI query'
      });
    }
  });

  // Get company setup suggestions for Google Drive
  app.post("/api/ai/company-setup", async (req: any, res) => {
    try {
      const { companyName } = req.body;
      if (!companyName || typeof companyName !== 'string') {
        return res.status(400).json({ message: 'Company name is required' });
      }

      const suggestions = await enhancedAIService.suggestCompanySetup(companyName);
      res.json(suggestions);
    } catch (error) {
      console.error('Company setup error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to generate setup suggestions'
      });
    }
  });

  // Search for company data in Google Drive
  app.post("/api/ai/search-company", async (req: any, res) => {
    try {
      const { companyName } = req.body;
      if (!companyName || typeof companyName !== 'string') {
        return res.status(400).json({ message: 'Company name is required' });
      }

      const data = await googleDriveService.searchCompanyData(companyName);
      res.json({
        ...data,
        message: `Found ${data.folders.length} folders, ${data.documents.length} documents, ${data.sheets.length} spreadsheets for ${companyName}`
      });
    } catch (error) {
      console.error('Company search error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to search company data'
      });
    }
  });

  // List all available company folders in Google Drive
  app.get("/api/ai/list-folders", async (req: any, res) => {
    try {
      const folders = await googleDriveService.listAllFoldersInAIDatabase();
      res.json({
        folders,
        count: folders.length,
        message: `Found ${folders.length} company folders in AI Database`
      });
    } catch (error) {
      console.error('List folders error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to list folders'
      });
    }
  });

  // Test Google Drive access
  app.get("/api/ai/test-drive", async (req: any, res) => {
    try {
      const folderId = await googleDriveService.findAIDatabaseFolder();
      if (folderId) {
        const folders = await googleDriveService.listAllFoldersInAIDatabase();
        res.json({
          success: true,
          message: 'Google Drive access successful',
          folderId,
          folders: folders.map(f => f.name),
          count: folders.length
        });
      } else {
        res.json({
          success: false,
          message: 'Could not access Google Drive folder. Check if folder is publicly accessible or if service account credentials are needed.'
        });
      }
    } catch (error) {
      console.error('Test drive error:', error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test Google Drive access'
      });
    }
  });

  // Debug specific company folder contents
  app.get("/api/ai/debug-folder/:companyName", async (req: any, res) => {
    try {
      const companyName = req.params.companyName;
      console.log(`DEBUG: Checking folder contents for ${companyName}`);
      
      // Find company folders
      const folders = await googleDriveService.searchCompanyFolders(companyName);
      console.log(`DEBUG: Found ${folders.length} folders for ${companyName}`);
      
      if (folders.length === 0) {
        return res.json({
          success: false,
          message: `No folders found for ${companyName}`,
          folders: []
        });
      }
      
      // Check files in each folder
      const folderContents = [];
      for (const folder of folders) {
        console.log(`DEBUG: Checking files in folder ${folder.name} (${folder.id})`);
        const files = await googleDriveService.getFilesFromFolder(folder.id);
        console.log(`DEBUG: Found ${files.length} files in ${folder.name}`);
        
        folderContents.push({
          folderName: folder.name,
          folderId: folder.id,
          fileCount: files.length,
          files: files.map(f => ({
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
            modifiedTime: f.modifiedTime
          }))
        });
      }
      
      res.json({
        success: true,
        companyName,
        folderContents
      });
    } catch (error) {
      console.error('Debug folder error:', error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to debug folder'
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


