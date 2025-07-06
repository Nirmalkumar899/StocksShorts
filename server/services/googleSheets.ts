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
    // Use the correct credentials from the JSON file directly
    console.log('Google Sheets: Using service account credentials');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: "stocksshortsnew@spartan-perigee-463004-u2.iam.gserviceaccount.com",
        private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDxm4erbCGs0tHQ
Mri1jp9AcFU6KMEnywtSCFhKtgDS5IhrjtAPnATmeBz9UusIW1omj8/9oMdb75cc
rdrrcrQSBh3fQ6FmNeAoeJJ/UIaEAJs1hDqmzoMLGC/qinhqn0ZVqcAlRMyI4n2A
1g0ApZTKLI1etmeVRlbvlPmwbLg8hjk89qxSkBKTZevs5870wmgwFx60e+/TPCvn
3yGmskLUasLKveeW+x0UEmL/GWDYv8e+wXuepCUc4MOIQvMb6u2LhAAcCn5dO8BM
lDvI1Pr1lRcHE0qk6vmz4wuF5l+FhR0ylhl4wvrhQ/hAuLOgneTLpQWW8f0aXLzM
wy6VlxbdAgMBAAECggEABYhBGGH6Qf5QYN+OKjBjWGm+pCIRMZ3a0dyLxQK/uoI2
+3bwL/orqSAuQAnZO3UcnCBvUG0RQURy05E3RCNVBqYOfgzmUf139ynXng0dVkIE
cF8yhpyPy3Th9/8Y/KCXc6Fo7ZGJgkd3GF0OYLwOdH080FBzopkKFP9R7AswHaRX
Mp2W6CLeZXkRa049NKn/z5cIv0SCcyJOJ/p2v3WhmbNfK0vKXfdVFUjB8FvVs30F
L2AI3qp4avNbvE8xSWNKVw9ckck8B+lD9V65tgNUhrtgaUUjIgOBLEwM4o1DaotV
dizo8w62HHNun+0pNVnWXWv3QevRDo09zr6jR1+P0wKBgQD+T9VWv+gRZcbchZhG
IIIiHtbp8aCuk/aNCVcoOSyYtA2MVpSoFW/qXqXMg7KAOoIjwbES+y+qjZM+IeVc
2cMii6PT6QLoTG5WQ6qVqf4Vg8zt/lFd4dGADXLpn8b0t1h4+cl/HYjjI0BNYyn+
yH7ol8DarD0vKZlK+tIetHlA/wKBgQDzNhuBgs4T9VTe0XEN3z5mxQJ9v4KuAzpv
CuCPH+LY35RyQTWTesVyhwBLxD9TeE6PiP+mF1C2gzRZ5O8THoM6kaAqcZ9GbB3r
h10/r+XaYcAeM2wJDg1LbcNKQ2+8VUpiexjDjE5aOL+/Aefz3USA1/6dmW4fHeIg
b+iNfsjMIwKBgBhtZKmTf2AEbaiK8Ihz4OwUGEKaYfvC3KDJb+S+MSltygtb2aWX
gYt6keRmFgQ5Gn0CwtZ26CoytRz3todHp3WvAgp9zDix9rs0frMng+9fHJUTo48n
/K6XHB2SqlKhNc9Q9ujN1nMy1J9aUhNWANKomO6oMqxQC5hnJT2ryiXTAoGBAISQ
94kuTTmfvbT+IEtZZeAKfoMgQhCrfcxM933L+ZAQvg9Q7+0FPF5iq4yg2YubxeaC
3CYiC0KQXZaqLI4VUZ45Bj5cVF7ES8K3s+Ik9HqGUXukt7xvxltY5tuxylOzgaoQ
Qr1D2uleiVWJqm7IKrC4CvbITLf1R+46UV3ev4BVAoGAWhmoUJhwpOZmKoKQ1e3l
4ZwoB4O5gQIlCxkeDlWE/2e2x51nUsDZIF4iY7iq8o9phcleFx9AgfgrNZ89MbAr
+2hyEr0BnNGEeiNg+ZNiqcLaIIr/yG8qCSsf3LGc4jZD6m7cFAj6qwM491S0M4/v
0HsI2X6g//ccL7BPi5ZPKRY=
-----END PRIVATE KEY-----`
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
  }

  async fetchArticles(): Promise<Article[]> {
    // Check cache first for 30x faster response
    const cachedArticles = this.cache.get<Article[]>('articles');
    if (cachedArticles && cachedArticles.length > 0) {
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
          if (!providedImageUrl && (title.includes('IPO') || title.includes('Special'))) {
            console.log(`No image URL found in column I for "${title}":`, {
              rowLength: row.length,
              columnI: row[8] || 'empty',
              hasColumnI: row.length > 8
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
                imageUrl = `/assets/${filename}`;
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
