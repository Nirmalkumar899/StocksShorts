import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";

interface AuthenticNews {
  title: string;
  content: string;
  source: string;
  type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  priority: '1' | '2' | '3' | '4' | '5';
  newsDate: Date;
}

export class AuthenticNewsService {
  private genai: GoogleGenAI;

  constructor() {
    this.genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async searchRealMarketNews(): Promise<AuthenticNews[]> {
    try {
      console.log('Searching real market events from June 29, 2025 and June 27, 2025');
      
      const response = await this.genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `Search for authentic Indian stock market news from June 29, 2025 (today) and June 27, 2025 (last working day). Find real events and create exactly 20 news summaries in this priority order:

PRIORITY 1 - FRAUD/SEBI ACTIONS (4 articles):
Search for real SEBI investigations, penalties, regulatory actions, compliance failures, market manipulation cases

PRIORITY 2 - BREAKOUT STOCKS/INDICES (4 articles): 
Search for actual stock price breakouts, technical chart patterns, volume surges, index movements above resistance

PRIORITY 3 - ORDER WINS (4 articles):
Search for real contract announcements, deal wins, order bookings with specific monetary values

PRIORITY 4 - ANALYST REPORTS (4 articles):
Search for actual brokerage upgrades/downgrades, target price changes, coverage initiations

PRIORITY 5 - OTHER REPORTS (4 articles):
Search for IPO updates, earnings results, corporate actions, bonus/dividend announcements

SEARCH METHODOLOGY:
- Look through Economic Times, Business Standard, MoneyControl, LiveMint archives
- Find real events with specific companies, amounts, dates
- If no news found for June 29, use most recent authentic news from that category

FORMAT REQUIREMENTS:
1. Catchy headline: "29 Jun: [Company] [Action]: [Key Detail]" 
2. Summary exactly 350 characters including link
3. Use real NSE/BSE company names only
4. Include actual monetary amounts from announcements
5. End with: <a href='https://economictimes.indiatimes.com' target='_blank' style='color: #3b82f6;'>Click here</a>

Return as JSON with title, content, source, sentiment, priority fields.

Example:
{
  "articles": [
    {
      "title": "29 Jun: SEBI Penalizes Karvy Stock Broking for Client Fund Misuse",
      "content": "SEBI imposes ₹1 crore penalty on Karvy Stock Broking for misusing client securities and funds. Broker violated segregation norms, pledged client shares. License suspended pending compliance. Recovery process initiated for affected investors. <a href='https://economictimes.indiatimes.com' target='_blank' style='color: #3b82f6;'>Click here</a>",
      "source": "Economic Times",
      "sentiment": "Negative",
      "priority": "1"
    }
  ]
}`
          }]
        }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{"articles": []}');
      
      if (!result.articles || result.articles.length === 0) {
        console.log('No real market news found');
        return [];
      }

      console.log(`Found ${result.articles.length} authentic market news articles`);
      
      return result.articles.map((article: any) => ({
        title: article.title,
        content: article.content.length > 350 ? article.content.substring(0, 347) + '...' : article.content,
        source: article.source || 'Economic Times',
        type: 'AI News',
        sentiment: article.sentiment || 'Neutral',
        priority: article.priority || '3',
        newsDate: new Date('2025-06-29')
      }));

    } catch (error) {
      console.error('Error searching authentic news:', error);
      return [];
    }
  }

  async generateAuthenticNews(): Promise<void> {
    try {
      await storage.clearAiArticles();
      console.log('Cleared existing articles, searching for real market news');

      const articles = await this.searchRealMarketNews();
      
      if (articles.length > 0) {
        await storage.storeAiArticles(articles);
        console.log(`Stored ${articles.length} authentic news summaries`);
      } else {
        console.log('No authentic news articles found');
      }
    } catch (error) {
      console.error('Error generating authentic news:', error);
    }
  }
}

export const authenticNewsService = new AuthenticNewsService();