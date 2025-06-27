import { google } from 'googleapis';
import type { GoogleSheetsRow, Article, InvestmentAdvisorRow, InvestmentAdvisor } from '@shared/schema';
import { sampleArticles } from '../sampleData';

export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

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
    try {
      // If Google Sheets credentials are configured, try to fetch from sheets
      if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEETS_ID) {
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: 'IA!A2:J', // Name, Company, Designation, Phone, Email, Website, Specialization, Experience, Location, Rating
        });

        const rows: string[][] = response.data.values || [];
        
        const advisors: InvestmentAdvisor[] = rows
          .filter(row => row.length >= 5) // At least Name, Company, Designation, Phone, Email
          .map((row, index) => {
            return {
              id: index + 1,
              name: row[0] || 'Unknown',
              company: row[1] || '',
              designation: row[2] || '',
              phone: row[3] || '',
              email: row[4] || '',
              website: row[5] || '',
              specialization: row[6] || '',
              experience: row[7] || '',
              location: row[8] || '',
              rating: row[9] || '4.0',
              createdAt: new Date(),
            };
          });

        // If we have advisors from sheets, return them
        if (advisors.length > 0) {
          return advisors;
        }
      }

      // Fallback sample data for demonstration
      const sampleAdvisors: InvestmentAdvisor[] = [
        {
          id: 1,
          name: 'Rajesh Kumar',
          company: 'Wealth Solutions India',
          designation: 'Senior Investment Advisor',
          phone: '+91-98765-43210',
          email: 'rajesh@wealthsolutions.in',
          website: 'www.wealthsolutions.in',
          specialization: 'Equity, Mutual Funds, Portfolio Management',
          experience: '12+ Years',
          location: 'Mumbai, Maharashtra',
          rating: '4.5',
          createdAt: new Date(),
        },
        {
          id: 2,
          name: 'Priya Sharma',
          company: 'Capital Growth Advisors',
          designation: 'Portfolio Manager',
          phone: '+91-98765-43211',
          email: 'priya@capitalgrowth.in',
          website: 'www.capitalgrowth.in',
          specialization: 'Fixed Income, Tax Planning, Retirement Planning',
          experience: '8+ Years',
          location: 'Delhi, NCR',
          rating: '4.3',
          createdAt: new Date(),
        },
        {
          id: 3,
          name: 'Amit Agarwal',
          company: 'Smart Invest Advisory',
          designation: 'Chief Investment Officer',
          phone: '+91-98765-43212',
          email: 'amit@smartinvest.in',
          website: 'www.smartinvest.in',
          specialization: 'Alternative Investments, Real Estate, Insurance',
          experience: '15+ Years',
          location: 'Bangalore, Karnataka',
          rating: '4.7',
          createdAt: new Date(),
        },
        {
          id: 4,
          name: 'Sneha Patel',
          company: 'Future Financial Services',
          designation: 'Investment Consultant',
          phone: '+91-98765-43213',
          email: 'sneha@futurefinancial.in',
          website: 'www.futurefinancial.in',
          specialization: 'SIP Planning, Goal-based Investing, Risk Assessment',
          experience: '6+ Years',
          location: 'Pune, Maharashtra',
          rating: '4.2',
          createdAt: new Date(),
        },
        {
          id: 5,
          name: 'Vikram Singh',
          company: 'Elite Wealth Management',
          designation: 'Wealth Manager',
          phone: '+91-98765-43214',
          email: 'vikram@elitewealth.in',
          website: 'www.elitewealth.in',
          specialization: 'High Net Worth Planning, Estate Planning, Tax Optimization',
          experience: '20+ Years',
          location: 'Chennai, Tamil Nadu',
          rating: '4.8',
          createdAt: new Date(),
        },
        {
          id: 6,
          name: 'Kavita Menon',
          company: 'Progressive Investment Solutions',
          designation: 'Financial Planner',
          phone: '+91-98765-43215',
          email: 'kavita@progressive.in',
          website: 'www.progressive.in',
          specialization: 'Women-focused Financial Planning, Education Planning',
          experience: '10+ Years',
          location: 'Hyderabad, Telangana',
          rating: '4.4',
          createdAt: new Date(),
        },
      ];

      return sampleAdvisors;
    } catch (error) {
      console.error('Error fetching Investment Advisors:', error);
      return [];
    }
  }
}
