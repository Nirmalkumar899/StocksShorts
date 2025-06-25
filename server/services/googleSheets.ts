import { google } from 'googleapis';
import type { GoogleSheetsRow, Article } from '@shared/schema';
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
      console.log('Missing credentials:', {
        email: !!process.env.GOOGLE_CLIENT_EMAIL,
        key: !!process.env.GOOGLE_PRIVATE_KEY,
        sheetId: !!process.env.GOOGLE_SHEETS_ID
      });
      return sampleArticles;
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A2:H', // ID, Title, Content, Type, TimeAgo, Source, Sentiment, ImageURL
      });

      const rows: string[][] = response.data.values || [];
      
      const articles: Article[] = rows
        .filter(row => row.length >= 6) // At least ID, Title, Content, Type, TimeAgo, Source
        .map((row, index) => {
          // Google Sheets structure: ID, Title, Content, Type, TimeAgo, Source, Sentiment (Positive/Negative)
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

          return {
            id: parseInt(row[0]) || index + 1,
            title: row[1] || 'Untitled',
            content,
            type: row[3] || 'Index',
            time: parsedTime,
            source: row[5] || 'Unknown Source',
            sentiment,
            priority: 'Medium', // Default priority since it's not in sheet
            imageUrl: row[7] || null, // ImageURL column
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
      
      // Direct matches
      if (articleType === categoryId) return true;
      
      // Category mapping based on exact Google Sheets values
      switch (categoryId) {
        case 'index':
          return articleType === 'index';
        case 'warrants':
          return articleType === 'warrants';
        case 'stocksshorts-special':
          return articleType === 'stocksshorts special' || articleType === 'special';
        case 'breakout-stocks':
          return articleType === 'breakout stocks' || articleType === 'breakout';
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
        default:
          return false;
      }
    });
  }
}
