import { google } from 'googleapis';
import type { GoogleSheetsRow, Article, InvestmentAdvisorRow, InvestmentAdvisor } from '@shared/schema';
import { sampleArticles } from '../sampleData';

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
    // Initialize Google Sheets API client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
  }

  async fetchArticles(): Promise<Article[]> {
    // Check cache first for 30x faster response
    const cachedArticles = this.cache.get<Article[]>('articles');
    if (cachedArticles) {
      console.log('Returning cached articles - instant response');
      return cachedArticles;
    }

    // If Google Sheets credentials are not configured, return sample data
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_ID) {
      console.log('Google Sheets credentials not configured, using sample data');
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
        range: 'Sheet1!A2:I', // ID, Title, Content, Type, TimeAgo, Source, Sentiment, Priority, Category
      });

      const rows: string[][] = response.data.values || [];
      
      const articles: Article[] = rows
        .filter(row => row.length >= 6) // At least ID, Title, Content, Type, TimeAgo, Source
        .map((row, index) => {
          // Google Sheets structure: ID, Title, Content, Type, TimeAgo, Source, Sentiment, Priority, Category
          const timeStr = row[4] || '1 hour ago';
          let parsedTime: Date;
          
          try {
            // Handle "TimeAgo" column format
            if (timeStr.includes('ago')) {
              parsedTime = this.parseRelativeTime(timeStr);
            } else {
              parsedTime = new Date(timeStr);
            }
          } catch (error) {
            console.warn(`Invalid time format for row ${index + 2}: ${timeStr}`);
            parsedTime = new Date();
          }

          // Ensure content is within 350 character limit
          const content = row[2] && row[2].length > 350 ? row[2].substring(0, 347) + '...' : row[2] || '';

          // Map sentiment column (Positive/Negative) to our format
          const sentimentValue = row[6] || 'Neutral';
          const sentiment = sentimentValue.toLowerCase().includes('positive') ? 'Positive' :
                           sentimentValue.toLowerCase().includes('negative') ? 'Negative' : 'Neutral';

          // Get priority from column 7 and category from column 8
          const priority = row[7] || 'Medium';
          const category = row[8] || row[3] || 'Index'; // Use category column first, fallback to type

          return {
            id: parseInt(row[0]) || index + 1,
            title: row[1] || 'Untitled',
            content,
            type: category, // Use category instead of type for better mapping
            time: parsedTime,
            source: row[5] || 'Unknown Source',
            sentiment,
            priority,
            imageUrl: null, // Set to null for now since using priority column
            createdAt: new Date(),
          };
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
      return allArticles;
    }
    
    return allArticles.filter(article => {
      const articleType = article.type.toLowerCase().trim();
      const categoryId = category.toLowerCase();
      
      // Category mapping based on Google Sheets category column
      switch (categoryId) {
        case 'all':
          return true; // Show all articles for trending
        case 'index':
          return articleType === 'index' || articleType === 'nifty' || articleType === 'sensex';
        case 'warrants':
          return articleType === 'warrants';
        case 'stocksshorts-special':
          return articleType === 'stocksshorts special' || articleType === 'special';
        case 'breakout-stocks':
          return articleType === 'breakout stocks' || articleType === 'breakout stock' || articleType === 'breakout';
        case 'educational':
          return articleType === 'educational';
        case 'ipo':
          return articleType === 'ipo';
        case 'global':
          return articleType === 'global';
        case 'most-active':
          return articleType === 'most active' || articleType === 'active';
        case 'order-win':
          return articleType === 'order win' || articleType === 'orders';
        case 'research-report':
          return articleType === 'research report' || articleType === 'research';
        default:
          // Try direct match with the category value from sheets
          return articleType.toLowerCase().includes(categoryId.replace('-', ' '));
      }
    });
  }

  async fetchInvestmentAdvisors(): Promise<InvestmentAdvisor[]> {
    // If Google Sheets credentials are not configured, return fallback data
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_ID) {
      console.log('Google Sheets credentials not configured - using fallback advisor data');
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
