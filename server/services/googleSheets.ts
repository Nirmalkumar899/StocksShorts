import { google } from 'googleapis';
import type { GoogleSheetsRow, Article, InvestmentAdvisorRow, InvestmentAdvisor } from '@shared/schema';
import { sampleArticles } from '../sampleData';
import { candlestickImageService } from './candlestickImageService';

// In-memory cache with TTL for faster repeated requests
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlSeconds: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
}

export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;
  private cache = new MemoryCache();

  constructor() {
    // Use environment variables for security - never hard-code credentials
    console.log('Google Sheets: Using service account credentials from environment variables');
    
    // Check if Google Sheets credentials are available
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    if (clientEmail && privateKey) {
      console.log('Google Sheets: Environment variables found, initializing auth');
      
      try {
        // Robust private key normalization to handle various formats
        const formattedPrivateKey = this.normalizePrivateKey(privateKey);
        console.log('Google Sheets: Private key normalized successfully');
        
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: clientEmail,
            private_key: formattedPrivateKey,
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        this.sheets = google.sheets({ version: 'v4', auth });
        
        // Test authentication with a lightweight call
        this.testAuthentication();
      } catch (error) {
        console.error('Google Sheets: Private key normalization failed:', error);
        this.sheets = null;
      }
    } else {
      console.log('Google Sheets: Credentials not found in environment variables - service will use fallback data');
      // Initialize without auth - methods will handle fallback appropriately
      this.sheets = null;
    }
    
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
  }

  /**
   * Robust private key normalization to handle various formats and edge cases
   */
  private normalizePrivateKey(privateKey: string): string {
    let normalizedKey = privateKey.trim();
    
    // Remove surrounding quotes if present
    if ((normalizedKey.startsWith('"') && normalizedKey.endsWith('"')) ||
        (normalizedKey.startsWith("'") && normalizedKey.endsWith("'"))) {
      normalizedKey = normalizedKey.slice(1, -1);
    }
    
    // Handle base64 encoded private key (if GOOGLE_PRIVATE_KEY_BASE64 was used)
    if (!normalizedKey.includes('-----BEGIN') && normalizedKey.length > 100) {
      try {
        normalizedKey = Buffer.from(normalizedKey, 'base64').toString('utf-8');
      } catch (error) {
        // Not base64, continue with original
      }
    }
    
    // Convert escaped newlines to real newlines
    normalizedKey = normalizedKey.replace(/\\n/g, '\n');
    
    // Normalize line endings (CRLF to LF)
    normalizedKey = normalizedKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Extract the key body between BEGIN/END markers
    const beginMatch = normalizedKey.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----/);
    const endMatch = normalizedKey.match(/-----END (?:RSA )?PRIVATE KEY-----/);
    
    if (!beginMatch || !endMatch) {
      throw new Error('Invalid private key format: missing BEGIN/END markers');
    }
    
    const beginMarker = beginMatch[0];
    const endMarker = endMatch[0];
    const beginIndex = normalizedKey.indexOf(beginMarker) + beginMarker.length;
    const endIndex = normalizedKey.indexOf(endMarker);
    
    if (beginIndex >= endIndex) {
      throw new Error('Invalid private key format: malformed structure');
    }
    
    // Extract and clean the base64 body
    const keyBody = normalizedKey.substring(beginIndex, endIndex);
    const cleanBody = keyBody.replace(/\s/g, ''); // Remove all whitespace
    
    // Validate base64 content
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanBody)) {
      throw new Error('Invalid private key format: invalid base64 characters');
    }
    
    // Re-wrap to 64 characters per line
    const wrappedBody = cleanBody.match(/.{1,64}/g)?.join('\n') || cleanBody;
    
    // Reconstruct the private key with proper formatting
    const reconstructedKey = `${beginMarker}\n${wrappedBody}\n${endMarker}\n`;
    
    return reconstructedKey;
  }

  /**
   * Test authentication with a lightweight Google Sheets API call
   */
  private async testAuthentication(): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) {
      return;
    }
    
    try {
      // Make a lightweight call to test authentication
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        fields: 'properties.title'
      });
      console.log('Google Sheets: Authentication test successful');
    } catch (error) {
      console.error('Google Sheets: Authentication test failed:', error);
      this.sheets = null; // Disable sheets if auth fails
    }
  }

  async fetchArticles(): Promise<Article[]> {
    // Check cache first for 30x faster response
    const cachedArticles = this.cache.get<Article[]>('articles');
    if (cachedArticles && cachedArticles.length > 0) {
      console.log('Returning cached articles - instant response');
      return cachedArticles;
    }

    // If Google Sheets is not properly initialized, return sample data
    if (!this.sheets || !this.spreadsheetId) {
      console.log('Google Sheets not configured, using sample data');
      // Return fresh sample data with updated timestamps
      return sampleArticles.map(article => ({
        ...article,
        createdAt: new Date(),
        time: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time within last 24 hours
      }));
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A2:J', // ID, Title, Content, Type, TimeAgo, Source, Sentiment, Priority, Category, ImageURL
      });

      const rows: string[][] = response.data.values || [];
      
      const articles: Article[] = rows
        .filter(row => row.length >= 6) // At least ID, Title, Content, Type, TimeAgo, Source
        .filter(row => {
          // Filter out Trader View articles completely as per July 5, 2025 requirement
          const category = row[3] || ''; // Column D (Type)
          return category.toLowerCase().trim() !== 'trader view';
        })
        .map((row, index) => {
          // Google Sheets structure: A=ID, B=Title, C=Content, D=Type, E=TimeAgo, F=Source, G=Sentiment, H=Priority, I=ImageURL
          
          // Debug: Log the row structure for first few articles
          if (index < 3) {
            console.log(`Row ${index + 2} structure (length: ${row.length}):`, row.map((cell, i) => `${String.fromCharCode(65 + i)}="${cell}"`));
          }
          
          const timeStr = row[4] || '1 hour ago';
          let parsedTime: Date;
          
          try {
            // Handle "TimeAgo" column format
            if (timeStr.includes('ago')) {
              parsedTime = this.parseRelativeTime(timeStr);
            } else if (timeStr.trim() === '' || timeStr.trim() === 'null') {
              // Handle null/empty timestamps - treat as beginning of today (12:01 AM)
              const today = new Date();
              today.setHours(0, 1, 0, 0); // Set to 12:01 AM of today
              parsedTime = today;
            } else {
              parsedTime = new Date(timeStr);
            }
          } catch (error) {
            console.warn(`Invalid time format for row ${index + 2}: ${timeStr}`);
            // Treat invalid timestamps as beginning of today (12:01 AM)
            const today = new Date();
            today.setHours(0, 1, 0, 0);
            parsedTime = today;
          }

          // Get full content without truncation
          const content = row[2] || '';
          
          // Debug content length for troubleshooting
          if (content.length > 300 && content.includes('…')) {
            console.log(`Article "${row[1]}" content length: ${content.length}, ends with: "${content.slice(-50)}"`);
          }

          // Map sentiment column (Positive/Negative) to our format
          const sentimentValue = row[6] || 'Neutral';
          const sentiment = sentimentValue.toLowerCase().includes('positive') ? 'Positive' :
                           sentimentValue.toLowerCase().includes('negative') ? 'Negative' : 'Neutral';

          // Get priority from column 7 and category from column 8
          const priority = row[7] || 'Medium';
          
          // Use column D (Type) as primary category source based on user request
          const category = row[3] || 'Index'; // Use Type column (D) as requested

          // Get Image URL from column I (index 8), debug thoroughly
          let imageUrl = null;
          const title = row[1] || 'Untitled';
          
          // Get Image URL from Column I (index 8) ONLY
          const providedImageUrl = row[8] ? row[8].toString().trim() : '';
          
          // Debug log for articles that should have images but don't
          if (!providedImageUrl && (title.includes('IPO') || title.includes('Special') || category === 'KalkaBazaar')) {
            console.log(`No image URL found in column I for "${title}":`, {
              rowLength: row.length,
              columnI: row[8] || 'empty',
              hasColumnI: row.length > 8,
              category: category,
              fullRow: row
            });
          } else if (providedImageUrl) {
            console.log(`Found image URL in column I for article "${title}": ${providedImageUrl}`);
          }
          
          // Debug: Log the image URL check
          if (providedImageUrl) {
            console.log(`Found image URL in column I for article "${title}": ${providedImageUrl}`);
          }
          
          if (providedImageUrl && (providedImageUrl.startsWith('http://') || providedImageUrl.startsWith('https://'))) {
            // Convert Google Drive sharing URLs to direct image URLs
            if (providedImageUrl.includes('drive.google.com')) {
              const fileIdMatch = providedImageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
              if (fileIdMatch) {
                const fileId = fileIdMatch[1];
                // Use Google Drive direct download format that bypasses CORS
                imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                console.log(`Converted Google Drive URL for ${category} article: ${title}`);
                console.log(`Original URL: ${providedImageUrl}`);
                console.log(`Converted URL: ${imageUrl}`);
              } else {
                imageUrl = providedImageUrl;
                console.log(`Could not extract file ID from Google Drive URL: ${providedImageUrl}`);
              }
            } else if (providedImageUrl.includes('imgur.com/a/')) {
              // Convert Imgur album URLs to direct image URLs
              const albumIdMatch = providedImageUrl.match(/imgur\.com\/a\/([a-zA-Z0-9]+)/);
              if (albumIdMatch) {
                const albumId = albumIdMatch[1];
                // Use direct Imgur image URL format
                imageUrl = `https://i.imgur.com/${albumId}.jpg`;
                console.log(`Converted Imgur album URL for ${category} article: ${title}`);
                console.log(`Original URL: ${providedImageUrl}`);
                console.log(`Converted URL: ${imageUrl}`);
              } else {
                imageUrl = providedImageUrl;
                console.log(`Could not extract album ID from Imgur URL: ${providedImageUrl}`);
              }
            } else if (providedImageUrl.includes('replit.com') && providedImageUrl.includes('attached_assets')) {
              // Convert Replit URLs to local asset URLs
              const assetMatch = providedImageUrl.match(/attached_assets\/([^#]+)/);
              if (assetMatch) {
                const filename = assetMatch[1];
                // Use local asset serving endpoint
                imageUrl = `/attachments/${filename}`;
                console.log(`Converted Replit asset URL for ${category} article: ${title}`);
                console.log(`Original URL: ${providedImageUrl}`);
                console.log(`Converted URL: ${imageUrl}`);
              } else {
                imageUrl = providedImageUrl;
                console.log(`Could not extract filename from Replit URL: ${providedImageUrl}`);
              }
            } else {
              // Use provided image URL as-is for other services
              imageUrl = providedImageUrl;
            }
            console.log(`Using provided image URL for ${category} article: ${title}`);
          }
          // Don't generate candlestick charts automatically - let frontend handle image selection

          // Debug: Log final imageUrl value
          if (imageUrl) {
            console.log(`Final imageUrl for article "${title}": ${imageUrl}`);
          }
          
          return {
            id: parseInt(row[0]) || index + 1,
            title,
            content,
            type: category, // Use category instead of type for better mapping
            time: parsedTime, // Now always a Date object (12:01 AM for null timestamps)
            source: row[5] || 'Unknown Source',
            sentiment,
            priority,
            imageUrl,
            createdAt: new Date(),
          };
        })
        .filter(article => {
          // Filter out Trader View articles completely
          return article.type.toLowerCase() !== 'trader view';
        });

      // Cache articles for 30 seconds to speed up repeated requests
      this.cache.set('articles', articles, 30);
      console.log(`Cached ${articles.length} articles for faster subsequent requests`);

      return articles;
    } catch (error) {
      console.error('Error fetching articles from Google Sheets:', error);
      // Fallback to sample data if Google Sheets fails
      console.log('Falling back to sample data due to Google Sheets error');
      return sampleArticles;
    }
  }

  async fetchStocksShortsSpecialArticles(): Promise<Article[]> {
    // Check cache first for faster response
    const cachedSpecialArticles = this.cache.get<Article[]>('stocks-special-articles');
    if (cachedSpecialArticles && cachedSpecialArticles.length > 0) {
      console.log('Returning cached StocksShorts Special articles - instant response');
      return cachedSpecialArticles;
    }

    // If Google Sheets is not properly initialized, return empty array
    if (!this.sheets || !this.spreadsheetId) {
      console.log('Google Sheets not configured, returning empty StocksShorts Special articles');
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'news!A2:J', // ID, Title, Content, Type, TimeAgo, Source, Sentiment, Priority, Category, ImageURL
      });

      const rows: string[][] = response.data.values || [];
      
      const specialArticles: Article[] = rows
        .filter(row => row.length >= 6) // At least ID, Title, Content, Type, TimeAgo, Source
        .map((row, index) => {
          // Google Sheets structure: A=ID, B=Title, C=Content, D=Type, E=TimeAgo, F=Source, G=Sentiment, H=Priority, I=ImageURL
          
          const timeStr = row[4] || '1 hour ago';
          let parsedTime: Date;
          
          try {
            // Handle "TimeAgo" column format
            if (timeStr.includes('ago')) {
              parsedTime = this.parseRelativeTime(timeStr);
            } else if (timeStr.trim() === '' || timeStr.trim() === 'null') {
              // Handle null/empty timestamps - treat as beginning of today (12:01 AM)
              const today = new Date();
              today.setHours(0, 1, 0, 0); // Set to 12:01 AM of today
              parsedTime = today;
            } else {
              parsedTime = new Date(timeStr);
            }
          } catch (error) {
            console.warn(`Invalid time format for StocksShorts Special row ${index + 2}: ${timeStr}`);
            // Treat invalid timestamps as beginning of today (12:01 AM)
            const today = new Date();
            today.setHours(0, 1, 0, 0);
            parsedTime = today;
          }

          // Get full content without truncation
          const content = row[2] || '';
          
          // Map sentiment column (Positive/Negative) to our format
          const sentimentValue = row[6] || 'Neutral';
          const sentiment = sentimentValue.toLowerCase().includes('positive') ? 'Positive' :
                           sentimentValue.toLowerCase().includes('negative') ? 'Negative' : 'Neutral';

          // Get priority from column H (index 7)
          const priority = row[7] || 'Medium';
          
          // Use column D (Type) as category source
          const category = row[3] || 'StocksShorts Special';

          // Get Image URL from column I (index 8)
          let imageUrl = null;
          const title = row[1] || 'Untitled';
          
          const providedImageUrl = row[8] ? row[8].toString().trim() : '';
          
          if (providedImageUrl && (providedImageUrl.startsWith('http://') || providedImageUrl.startsWith('https://'))) {
            // Convert Google Drive sharing URLs to direct image URLs
            if (providedImageUrl.includes('drive.google.com')) {
              const fileIdMatch = providedImageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
              if (fileIdMatch) {
                const fileId = fileIdMatch[1];
                imageUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                console.log(`Converted Google Drive URL for StocksShorts Special article: ${title}`);
              } else {
                imageUrl = providedImageUrl;
              }
            } else if (providedImageUrl.includes('imgur.com/a/')) {
              // Convert Imgur album URLs to direct image URLs
              const albumIdMatch = providedImageUrl.match(/imgur\.com\/a\/([a-zA-Z0-9]+)/);
              if (albumIdMatch) {
                const albumId = albumIdMatch[1];
                imageUrl = `https://i.imgur.com/${albumId}.jpg`;
              } else {
                imageUrl = providedImageUrl;
              }
            } else if (providedImageUrl.includes('replit.com') && providedImageUrl.includes('attached_assets')) {
              // Convert Replit URLs to local asset URLs
              const assetMatch = providedImageUrl.match(/attached_assets\/([^#]+)/);
              if (assetMatch) {
                const filename = assetMatch[1];
                imageUrl = `/attachments/${filename}`;
              } else {
                imageUrl = providedImageUrl;
              }
            } else {
              // Use provided image URL as-is for other services
              imageUrl = providedImageUrl;
            }
          }
          
          return {
            id: parseInt(row[0]) || Date.now() + index, // Use unique ID for special articles
            title,
            content,
            type: 'StocksShorts Special', // Always set as StocksShorts Special
            time: parsedTime,
            source: row[5] || 'StocksShorts',
            sentiment,
            priority,
            imageUrl,
            sourceUrl: null, // StocksShorts Special articles don't have external source URLs
            primarySourceUrl: null,
            primarySourceTitle: null,
            primarySourcePublishedAt: null,
            sources: null,
            provenanceScore: null,
            contentType: 'original-report' as const,
            createdAt: new Date(),
          };
        })
        .sort((a, b) => {
          // Sort by Priority (High > Medium > Low) then by time descending
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority; // High priority first
          }
          
          // If same priority, sort by time (most recent first)
          const aTime = a.time ? new Date(a.time).getTime() : 0;
          const bTime = b.time ? new Date(b.time).getTime() : 0;
          return bTime - aTime;
        });

      // Cache articles for 5 minutes to avoid API rate limits
      this.cache.set('stocks-special-articles', specialArticles, 300); // 5 minutes
      console.log(`Cached ${specialArticles.length} StocksShorts Special articles for 5 minutes`);

      return specialArticles;
    } catch (error) {
      console.error('Error fetching StocksShorts Special articles from Google Sheets:', error);
      console.log('📊 Returning 0 StocksShorts Special articles');
      return [];
    }
  }

  private parseRelativeTime(timeStr: string): Date {
    const now = new Date();
    const lowerStr = timeStr.toLowerCase();
    
    if (lowerStr.includes('hour')) {
      const hours = parseInt(lowerStr.match(/(\d+)/)?.[1] || '0');
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    } else if (lowerStr.includes('minute')) {
      const minutes = parseInt(lowerStr.match(/(\d+)/)?.[1] || '0');
      return new Date(now.getTime() - minutes * 60 * 1000);
    } else if (lowerStr.includes('day')) {
      const days = parseInt(lowerStr.match(/(\d+)/)?.[1] || '0');
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    
    return now;
  }

  async getArticlesByCategory(category: string): Promise<Article[]> {
    const allArticles = await this.fetchArticles();
    
    if (category === 'all') {
      // Sort all articles by date (most recent first)
      // Articles with null timestamps are set to 12:01 AM of today
      return allArticles.sort((a, b) => {
        const dateA = a.time ? new Date(a.time).getTime() : new Date().setHours(0, 1, 0, 0);
        const dateB = b.time ? new Date(b.time).getTime() : new Date().setHours(0, 1, 0, 0);
        return dateB - dateA; // Most recent first
      });
    }
    
    const filteredArticles = allArticles.filter(article => {
      const articleType = article.type.toLowerCase().trim();
      const categoryId = category.toLowerCase();
      
      // Enhanced category mapping to match Google Sheets Column D values exactly
      switch (categoryId) {
        case 'trending':
          return articleType === 'kalkabazaar'; // Trending maps to Kalkabazaar articles
        case 'kalkabazaar':
          return articleType === 'kalkabazaar'; // Kalkabazaar maps directly to Kalkabazaar articles  
        case 'warrants':
          return articleType === 'warrants' || articleType === 'preferential/warrants';
        case 'stocksshorts-special':
          return articleType === 'stocksshorts special';
        case 'breakout-stocks':
          return articleType === 'breakout stocks' || articleType === 'breakout stock' || articleType === 'breakout';
        case 'educational':
          return articleType === 'educational';
        case 'ipo':
          return articleType === 'ipo';

        case 'others':
          return articleType === 'others';
        case 'crypto':
          return articleType === 'crypro'; // Handle the typo in Google Sheets
        case 'us-market':
          return articleType === 'us market' || articleType === 'global';
        case 'order-win':
          return articleType === 'order win';
        case 'research-report':
          return articleType === 'research report' || articleType.includes('research report');
        case 'ai':
          return false; // AI News comes from separate service, not Google Sheets
        default:
          return false; // Strict matching only - no fallback matching
      }
    });
    
    // Sort filtered articles by date (most recent first)
    return filteredArticles.sort((a, b) => {
      const dateA = a.time ? new Date(a.time).getTime() : 0;
      const dateB = b.time ? new Date(b.time).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
  }

  async fetchInvestmentAdvisors(): Promise<InvestmentAdvisor[]> {
    // If Google Sheets is not properly initialized, return fallback data
    if (!this.sheets || !this.spreadsheetId) {
      console.log('Google Sheets not configured - using fallback advisor data');
      return this.getFallbackAdvisorData();
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'IA!A2:J', // Name, Company, Designation, Phone, Email, Website, Specialization, Experience, Location, Rating
      });

      const rows: string[][] = response.data.values || [];
      
      const advisors: InvestmentAdvisor[] = rows
        .filter(row => row.length >= 3 && row[0]?.trim()) // At least Name and some data
        .map((row, index) => {
          return {
            id: index + 1,
            name: row[0]?.trim() || 'Unknown',
            company: row[1]?.trim() || 'Investment Advisory',
            designation: row[2]?.trim() || 'Investment Advisor',
            phone: row[3]?.trim() || '',
            email: row[4]?.trim() || '',
            website: row[5]?.trim() || '',
            specialization: row[6]?.trim() || 'Financial Planning',
            experience: row[7]?.trim() || '5+ years',
            location: row[8]?.trim() || 'India',
            rating: row[9]?.trim() || '4.0',
            createdAt: new Date(),
          };
        });

      console.log(`Fetched ${advisors.length} advisors from Google Sheets IA tab`);
      return advisors;
    } catch (error) {
      console.error('Error fetching Investment Advisors from Google Sheets:', error);
      console.log('Falling back to sample advisor data');
      // Fallback data including names from user's image
      return [
        {
          id: 1,
          name: 'KAVITHA MENON',
          company: 'KAVITHA MENON',
          designation: 'Investment Advisor',
          phone: '919821455882',
          email: 'cavithamenon@gmail.com',
          website: '',
          specialization: 'Wealth Management',
          experience: '8+ years',
          location: 'Mumbai',
          rating: '4.0',
          createdAt: new Date(),
        },
        {
          id: 2,
          name: 'PRAKASH CHANDRA PRAHARAJ',
          company: 'Prakash Chandra Praharaj',
          designation: 'Investment Advisor',
          phone: '2227575648',
          email: 'Prakash.praharaj@gmail.com',
          website: '',
          specialization: 'Financial Planning',
          experience: '10+ years',
          location: 'Delhi',
          rating: '4.0',
          createdAt: new Date(),
        },
        {
          id: 3,
          name: 'VALUEFY SOLUTIONS PRIVATE LIMITED',
          company: 'Valuefy Solutions',
          designation: 'Investment Advisory Firm',
          phone: '022 32264400',
          email: 'sumeet@valuefy.com',
          website: 'www.valuefy.com',
          specialization: 'Portfolio Management',
          experience: '12+ years',
          location: 'Mumbai',
          rating: '4.2',
          createdAt: new Date(),
        },
        {
          id: 4,
          name: 'ICICI SECURITIES LIMITED',
          company: 'ICICI Securities',
          designation: 'Investment Advisory',
          phone: '1800 200 3636',
          email: 'customer.care@icicisecurities.com',
          website: 'www.icicidirect.com',
          specialization: 'Equity Research',
          experience: '15+ years',
          location: 'Mumbai',
          rating: '4.1',
          createdAt: new Date(),
        },
        {
          id: 5,
          name: 'AXIS SECURITIES LIMITED',
          company: 'Axis Securities',
          designation: 'Investment Advisory',
          phone: '1800 233 2947',
          email: 'support@axissecurities.in',
          website: 'www.axissecurities.in',
          specialization: 'Investment Advisory',
          experience: '18+ years',
          location: 'Mumbai',
          rating: '4.0',
          createdAt: new Date(),
        }
      ];
    }
  }

  // Public method to clear cache for forced refresh
  clearCache(): void {
    this.cache = new MemoryCache();
    console.log('Google Sheets cache cleared');
  }

  private getFallbackAdvisorData(): InvestmentAdvisor[] {
    return [
      {
        id: 1,
        name: 'KAVITHA MENON',
        company: 'KAVITHA MENON',
        designation: 'Investment Advisor',
        phone: '919821455882',
        email: 'cavithamenon@gmail.com',
        website: '',
        specialization: 'Wealth Management',
        experience: '8+ years',
        location: 'Mumbai',
        rating: '4.0',
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'PRAKASH CHANDRA PRAHARAJ',
        company: 'Prakash Chandra Praharaj',
        designation: 'Investment Advisor',
        phone: '2227575648',
        email: 'Prakash.praharaj@gmail.com',
        website: '',
        specialization: 'Financial Planning',
        experience: '10+ years',
        location: 'Delhi',
        rating: '4.0',
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'VALUEFY SOLUTIONS PRIVATE LIMITED',
        company: 'Valuefy Solutions',
        designation: 'Investment Advisory Firm',
        phone: '022 32264400',
        email: 'sumeet@valuefy.com',
        website: 'www.valuefy.com',
        specialization: 'Portfolio Management',
        experience: '12+ years',
        location: 'Mumbai',
        rating: '4.2',
        createdAt: new Date(),
      },
      {
        id: 4,
        name: 'ICICI SECURITIES LIMITED',
        company: 'ICICI Securities',
        designation: 'Investment Advisory',
        phone: '1800 200 3636',
        email: 'customer.care@icicisecurities.com',
        website: 'www.icicidirect.com',
        specialization: 'Equity Research',
        experience: '15+ years',
        location: 'Mumbai',
        rating: '4.1',
        createdAt: new Date(),
      },
      {
        id: 5,
        name: 'AXIS SECURITIES LIMITED',
        company: 'Axis Securities',
        designation: 'Investment Advisory',
        phone: '1800 233 2947',
        email: 'support@axissecurities.in',
        website: 'www.axissecurities.in',
        specialization: 'Investment Advisory',
        experience: '18+ years',
        location: 'Mumbai',
        rating: '4.0',
        createdAt: new Date(),
      },
      {
        id: 6,
        name: 'IIFL SECURITIES LIMITED',
        company: 'IIFL Securities',
        designation: 'Investment Advisory',
        phone: '1800 267 3000',
        email: 'support@iiflsecurities.com',
        website: 'www.iiflsecurities.com',
        specialization: 'Research & Advisory',
        experience: '16+ years',
        location: 'Mumbai',
        rating: '4.1',
        createdAt: new Date(),
      },
      {
        id: 7,
        name: 'QUANTUM INFORMATION SERVICES PRIVATE LIMITED',
        company: 'Quantum Information Services',
        designation: 'Investment Advisory',
        phone: '022 6717 0000',
        email: 'info@quantumamc.com',
        website: 'www.quantumamc.com',
        specialization: 'Mutual Fund Advisory',
        experience: '20+ years',
        location: 'Mumbai',
        rating: '4.3',
        createdAt: new Date(),
      },
      {
        id: 8,
        name: 'SANDIP SABHARWAL',
        company: 'Independent Advisor',
        designation: 'Investment Advisor',
        phone: '022 2659 8888',
        email: 'contact@sandipsabharwal.com',
        website: 'www.sandipsabharwal.com',
        specialization: 'Equity Advisory',
        experience: '25+ years',
        location: 'Mumbai',
        rating: '4.5',
        createdAt: new Date(),
      },
      {
        id: 9,
        name: 'ASK WEALTH ADVISORS PRIVATE LIMITED',
        company: 'ASK Wealth Advisors',
        designation: 'Wealth Management',
        phone: '022 6707 9999',
        email: 'info@askwealth.com',
        website: 'www.askwealth.com',
        specialization: 'Private Wealth',
        experience: '14+ years',
        location: 'Mumbai',
        rating: '4.2',
        createdAt: new Date(),
      },
      {
        id: 10,
        name: '360 ONE INVESTMENT ADVISER AND TRUSTEE SERVICES LIMITED',
        company: '360 ONE',
        designation: 'Investment Advisory',
        phone: '022 6736 3636',
        email: 'info@360one.co.in',
        website: 'www.360one.co.in',
        specialization: 'Comprehensive Wealth',
        experience: '18+ years',
        location: 'Mumbai',
        rating: '4.4',
        createdAt: new Date(),
      }
    ];
  }
}
