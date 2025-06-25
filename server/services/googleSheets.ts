import { google } from 'googleapis';
import type { GoogleSheetsRow, Article } from '@shared/schema';

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
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A2:H', // Assuming headers are in row 1
      });

      const rows: string[][] = response.data.values || [];
      
      const articles: Article[] = rows
        .filter(row => row.length >= 8) // Ensure all required fields are present
        .map((row, index) => {
          // Parse time string to Date object
          const timeStr = row[4];
          let parsedTime: Date;
          
          try {
            // Try parsing various time formats
            if (timeStr.includes('ago')) {
              // Handle relative time like "2 hours ago"
              parsedTime = this.parseRelativeTime(timeStr);
            } else {
              // Handle absolute time formats
              parsedTime = new Date(timeStr);
            }
          } catch (error) {
            console.warn(`Invalid time format for row ${index + 2}: ${timeStr}`);
            parsedTime = new Date(); // Default to current time
          }

          // Ensure content is within 350 character limit
          const content = row[2].length > 350 ? row[2].substring(0, 347) + '...' : row[2];

          return {
            id: parseInt(row[0]) || index + 1,
            title: row[1] || 'Untitled',
            content,
            type: row[3] || 'MARKET',
            time: parsedTime,
            source: row[5] || 'Unknown Source',
            sentiment: row[6] || 'Neutral',
            priority: row[7] || 'Medium',
            createdAt: new Date(),
          };
        });

      return articles;
    } catch (error) {
      console.error('Error fetching articles from Google Sheets:', error);
      throw new Error('Failed to fetch articles from Google Sheets. Please check your API credentials and spreadsheet ID.');
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
    
    return allArticles.filter(article => 
      article.type.toLowerCase() === category.toLowerCase() ||
      (category === 'nifty' && article.type.toLowerCase().includes('nifty')) ||
      (category === 'sensex' && article.type.toLowerCase().includes('sensex')) ||
      (category === 'ipos' && article.type.toLowerCase().includes('ipo')) ||
      (category === 'mutual-funds' && article.type.toLowerCase().includes('mutual')) ||
      (category === 'crypto' && article.type.toLowerCase().includes('crypto'))
    );
  }
}
