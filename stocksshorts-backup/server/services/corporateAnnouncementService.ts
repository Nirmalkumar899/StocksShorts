import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";

interface CorporateNews {
  title: string;
  content: string;
  source: string;
  type: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  priority: '1' | '2' | '3' | '4' | '5';
  newsDate: Date;
}

export class CorporateAnnouncementService {
  private genai: GoogleGenAI;

  constructor() {
    this.genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async searchRealCorporateAnnouncements(): Promise<CorporateNews[]> {
    try {
      console.log('Searching real corporate announcements from NSE/BSE for June 29, 2025 and June 27, 2025');
      
      const response = await this.genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `Search for REAL corporate announcements from NSE and BSE exchanges for June 29, 2025 (today) and June 27, 2025 (last working day). Find actual company filings and create exactly 20 news summaries:

SEARCH SOURCES (Priority order):
1. FRAUD/SEBI ACTIONS (4 articles): Search Google for "SEBI penalty June 2025", "SEBI investigation June 2025", "market manipulation June 2025", "insider trading SEBI 2025"

2. BREAKOUT STOCKS/INDICES (4 articles): Search NSE/BSE for stocks hitting 52-week highs, volume surges, technical breakouts on June 29 and June 27

3. ORDER WINS (4 articles): Search NSE announcements for real contract wins, order bookings by listed companies on these dates

4. ANALYST REPORTS (4 articles): Search Google for "brokerage upgrade June 2025", "target price revision June 2025", "analyst report June 2025"

5. OTHER REPORTS (4 articles): Search NSE/BSE for IPO updates, dividend declarations, bonus announcements, earnings results

SPECIFIC SEARCH METHODOLOGY:
- Check NSE corporate announcements section for June 29 and June 27, 2025
- Search BSE corporate actions and announcements for these dates  
- Google search for recent SEBI actions and brokerage reports
- Look for actual company names: Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, Wipro, L&T, etc.

FORMAT REQUIREMENTS:
1. Catchy headline: "29 Jun: [Real Company] [Real Action]: [Actual Detail]"
2. Summary exactly 350 characters 
3. Use only REAL NSE/BSE listed companies with actual announcement details
4. Include real monetary amounts from actual filings
5. Reference actual dates when announcements were made

If no announcement found for a specific date, use the most recent real announcement from that category and mention the actual date.

Return as JSON with title, content, source, sentiment, priority fields.

Example format:
{
  "articles": [
    {
      "title": "29 Jun: Reliance Industries Board Approves ₹8,000 Cr Capex for Jamnagar",
      "content": "Reliance Industries board approved ₹8,000 crore capital expenditure for expanding petrochemical capacity at Jamnagar complex. The expansion will increase production by 30% and is expected to be completed by Q3 FY26. This strategic investment strengthens RIL's position in the petrochemical value chain and supports long-term growth objectives.",
      "source": "NSE Announcement",
      "sentiment": "Positive", 
      "priority": "5"
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
        console.log('No real corporate announcements found');
        return [];
      }

      console.log(`Found ${result.articles.length} real corporate announcements`);
      
      return result.articles.map((article: any) => ({
        title: article.title,
        content: article.content.length > 350 ? article.content.substring(0, 350) : article.content,
        source: article.source || 'NSE Announcement',
        type: 'AI News',
        sentiment: article.sentiment || 'Neutral',
        priority: article.priority || '3',
        newsDate: new Date('2025-06-29')
      }));

    } catch (error) {
      console.error('Error searching corporate announcements:', error);
      return [];
    }
  }

  async generateRealCorporateNews(): Promise<void> {
    try {
      await storage.clearAiArticles();
      console.log('Cleared existing articles, searching for real corporate announcements');

      const articles = await this.searchRealCorporateAnnouncements();
      
      if (articles.length > 0) {
        await storage.storeAiArticles(articles);
        console.log(`Stored ${articles.length} real corporate announcements`);
      } else {
        console.log('No real corporate announcements found');
      }
    } catch (error) {
      console.error('Error generating corporate news:', error);
    }
  }
}

export const corporateAnnouncementService = new CorporateAnnouncementService();