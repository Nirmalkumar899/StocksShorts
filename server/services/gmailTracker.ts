import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../storage.js';

interface EmailInsight {
  companies: string[];
  sectors: string[];
  keywords: string[];
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  topics: string[];
}

interface PersonalizedArticle {
  title: string;
  content: string;
  source: string;
  type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  priority: '1' | '2' | '3' | '4' | '5';
  newsDate: Date;
  personalizationReason: string;
}

export class GmailTracker {
  private gmail: any;
  private genai: GoogleGenAI;
  private isInitialized = false;

  constructor() {
    this.genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async initialize(credentials: any) {
    try {
      const auth = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );
      
      auth.setCredentials(credentials);
      this.gmail = google.gmail({ version: 'v1', auth });
      this.isInitialized = true;
      
      console.log('Gmail API initialized successfully');
      return true;
    } catch (error) {
      console.error('Gmail initialization failed:', error);
      return false;
    }
  }

  async getAuthUrl(): Promise<string> {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels'
    ];

    const url = auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });

    return url;
  }

  async exchangeCodeForTokens(code: string) {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    const { tokens } = await auth.getToken(code);
    return tokens;
  }

  async scanRecentEmails(maxResults: number = 50): Promise<EmailInsight> {
    if (!this.isInitialized) {
      throw new Error('Gmail API not initialized');
    }

    try {
      // Get recent emails from last 7 days
      const query = `newer_than:7d`;
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      const emailContents: string[] = [];

      // Fetch email content
      for (const message of messages.slice(0, 20)) { // Limit to 20 for performance
        try {
          const messageData = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const subject = this.extractHeader(messageData.data, 'Subject') || '';
          const body = this.extractEmailBody(messageData.data) || '';
          
          if (subject || body) {
            emailContents.push(`Subject: ${subject}\nBody: ${body.substring(0, 1000)}`);
          }
        } catch (err) {
          console.log('Error fetching message:', err);
        }
      }

      // Analyze emails with AI
      return await this.analyzeEmailContent(emailContents);
    } catch (error) {
      console.error('Error scanning emails:', error);
      throw error;
    }
  }

  private extractHeader(message: any, headerName: string): string | null {
    const headers = message.payload?.headers || [];
    const header = headers.find((h: any) => h.name === headerName);
    return header?.value || null;
  }

  private extractEmailBody(message: any): string {
    let body = '';
    
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString();
        }
      }
    }
    
    return body.replace(/<[^>]*>/g, ''); // Remove HTML tags
  }

  private async analyzeEmailContent(emailContents: string[]): Promise<EmailInsight> {
    if (emailContents.length === 0) {
      return {
        companies: [],
        sectors: [],
        keywords: [],
        sentiment: 'Neutral',
        topics: []
      };
    }

    const combinedContent = emailContents.join('\n\n');
    
    const prompt = `
    Analyze the following email content for Indian stock market interests:
    
    ${combinedContent}
    
    Extract and return JSON with:
    {
      "companies": ["list of Indian company names mentioned"],
      "sectors": ["sectors like Banking, IT, Pharma, Auto, etc."],
      "keywords": ["investment keywords like IPO, dividend, earnings, etc."],
      "sentiment": "Positive/Negative/Neutral overall sentiment",
      "topics": ["main financial topics discussed"]
    }
    
    Focus only on Indian stock market related content. Ignore promotional emails.
    `;

    try {
      const response = await this.genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
        },
        contents: prompt,
      });

      const analysis = JSON.parse(response.text || '{}');
      
      return {
        companies: analysis.companies || [],
        sectors: analysis.sectors || [],
        keywords: analysis.keywords || [],
        sentiment: analysis.sentiment || 'Neutral',
        topics: analysis.topics || []
      };
    } catch (error) {
      console.error('Error analyzing email content:', error);
      return {
        companies: [],
        sectors: [],
        keywords: [],
        sentiment: 'Neutral',
        topics: []
      };
    }
  }

  async generatePersonalizedArticles(insights: EmailInsight): Promise<PersonalizedArticle[]> {
    if (insights.companies.length === 0 && insights.sectors.length === 0) {
      return [];
    }

    const prompt = `
    Generate 5 personalized corporate announcements based on user's email interests:
    
    User's Interests:
    - Companies: ${insights.companies.join(', ')}
    - Sectors: ${insights.sectors.join(', ')}
    - Keywords: ${insights.keywords.join(', ')}
    - Topics: ${insights.topics.join(', ')}
    
    Create realistic corporate announcements (warrant issues, conference calls, order wins, SEBI alerts, preferential issues) focusing on these companies/sectors.
    
    Return JSON array with format:
    [{
      "title": "Date: Company/Event Title",
      "content": "Detailed announcement with specific numbers and dates",
      "source": "Official source like NSE, BSE, Company IR",
      "type": "AI News",
      "sentiment": "Positive/Negative/Neutral",
      "priority": "1-5",
      "newsDate": "2025-06-29",
      "personalizationReason": "Based on your interest in [Company/Sector]"
    }]
    
    Make announcements realistic with proper Indian company names, deal values in crores, and authentic corporate language.
    `;

    try {
      const response = await this.genai.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
        },
        contents: prompt,
      });

      const articles = JSON.parse(response.text || '[]');
      
      return articles.map((article: any) => ({
        ...article,
        newsDate: new Date(article.newsDate)
      }));
    } catch (error) {
      console.error('Error generating personalized articles:', error);
      return [];
    }
  }

  async processEmailTracking(): Promise<void> {
    try {
      console.log('Starting email tracking process...');
      
      // Scan recent emails
      const insights = await this.scanRecentEmails();
      console.log('Email insights extracted:', insights);
      
      // Generate personalized articles
      const personalizedArticles = await this.generatePersonalizedArticles(insights);
      console.log(`Generated ${personalizedArticles.length} personalized articles`);
      
      if (personalizedArticles.length > 0) {
        // Add userId to each article and store
        const articlesWithUserId = personalizedArticles.map(article => ({
          ...article,
          userId: 1 // Default user ID for now, will be dynamic when user authentication is added
        }));
        await storage.storePersonalizedArticles(articlesWithUserId);
        console.log('Personalized articles stored successfully');
      }
    } catch (error) {
      console.error('Email tracking process failed:', error);
    }
  }

  async getPersonalizedArticles(limit: number = 10): Promise<any[]> {
    return await storage.getPersonalizedArticles(limit);
  }
}

export const gmailTracker = new GmailTracker();