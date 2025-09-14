import axios from 'axios';
import * as xml2js from 'xml2js';

interface BSEAnnouncement {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  category: string;
}

interface ProcessedAnnouncement {
  id: number;
  title: string;
  content: string;
  type: string;
  time: Date;
  source: string;
  sentiment: string;
  priority: string;
  imageUrl: string | null;
  createdAt: Date;
  sourceUrl: string;
  category: string;
}

export class BSEAnnouncementProcessor {
  private readonly BSE_RSS_URL = 'https://www.bseindia.com/data/xml/notices.xml';
  private readonly BSE_API_URL = 'https://api.bseindia.com/BseIndiaAPI/api/CorporateAnnouncement/getCorporateAnnouncement';
  
  private readonly TARGET_KEYWORDS = [
    // Original keywords
    'order', 'warrant', 'unaudited', 'result', 'block', 'fine',
    
    // Circuit and trading actions
    'circuit', 'circuit breaker', 'trading halt', 'halt', 'suspension',
    
    // Regulatory and compliance
    'penalty', 'violation', 'breach', 'compliance', 'enforcement', 
    'investigation', 'probe', 'inquiry', 'surveillance',
    
    // Market integrity
    'delisting', 'default', 'insider trading', 'price manipulation',
    'market manipulation', 'disclosure', 'non-compliance',
    
    // Critical actions
    'cease and desist', 'show cause', 'adjudication', 'settlement',
    'consent order', 'regulatory action', 'disciplinary action'
  ];

  private readonly CATEGORY_KEYWORDS = {
    'regulatory': ['order', 'fine', 'penalty', 'violation', 'enforcement', 'compliance', 'breach', 'disciplinary action', 'cease and desist', 'show cause'],
    'trading-action': ['circuit', 'circuit breaker', 'trading halt', 'halt', 'suspension', 'block', 'delisting'],
    'warrants': ['warrant', 'rights issue', 'preferential allotment'],
    'financial-results': ['unaudited', 'result', 'quarterly', 'annual', 'earnings'],
    'order-win': ['order win', 'contract', 'awarded', 'tender'],
    'investigation': ['investigation', 'inquiry', 'probe', 'surveillance', 'insider trading', 'price manipulation', 'market manipulation'],
    'disclosure': ['disclosure', 'non-compliance', 'default', 'settlement', 'consent order']
  };

  public async fetchAndProcessBSEAnnouncements(): Promise<ProcessedAnnouncement[]> {
    console.log('🏛️ Fetching BSE announcements with target keywords...');
    
    const announcements: ProcessedAnnouncement[] = [];
    
    try {
      // Fetch from RSS feed
      const rssAnnouncements = await this.fetchFromRSS();
      
      // Fetch from API (if available)
      const apiAnnouncements = await this.fetchFromAPI();
      
      // Combine all BSE announcements
      const allBSEAnnouncements = [...rssAnnouncements, ...apiAnnouncements];
      
      // Filter for target keywords and create summaries
      const filteredAnnouncements = this.filterByKeywords(allBSEAnnouncements);
      const processedAnnouncements = await this.createSummaries(filteredAnnouncements);
      
      console.log(`✅ Processed ${processedAnnouncements.length} BSE announcements with target keywords`);
      return processedAnnouncements;
      
    } catch (error) {
      console.error('Error fetching BSE announcements:', error);
      return [];
    }
  }

  private async fetchFromRSS(): Promise<BSEAnnouncement[]> {
    try {
      const response = await axios.get(this.BSE_RSS_URL, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      
      const announcements: BSEAnnouncement[] = [];
      
      if (result.rss && result.rss.channel && result.rss.channel[0].item) {
        for (const item of result.rss.channel[0].item) {
          announcements.push({
            title: item.title[0],
            link: item.link[0],
            pubDate: item.pubDate[0],
            content: item.title[0], // RSS only has title, we'll enhance this
            category: this.categorizeAnnouncement(item.title[0])
          });
        }
      }
      
      return announcements;
    } catch (error) {
      console.error('Error fetching BSE RSS:', error);
      return [];
    }
  }

  private async fetchFromAPI(): Promise<BSEAnnouncement[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const response = await axios.get(this.BSE_API_URL, {
        params: {
          FromDate: yesterdayStr,
          ToDate: today,
          segment: 'Equity',
          strSearch: 'P'
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const announcements: BSEAnnouncement[] = [];
      
      if (response.data && response.data.Table) {
        for (const item of response.data.Table) {
          announcements.push({
            title: `${item.SCRIP_CD}: ${item.NEWS}`,
            link: item.ATTACHMENTNAME || `https://www.bseindia.com/corporates/Comp_Resultsnew.aspx?scripcd=${item.SCRIP_CD}`,
            pubDate: item.NEWSSDT,
            content: item.NEWS,
            category: this.categorizeAnnouncement(item.NEWS)
          });
        }
      }
      
      return announcements;
    } catch (error) {
      console.error('Error fetching BSE API:', error);
      return [];
    }
  }

  private filterByKeywords(announcements: BSEAnnouncement[]): BSEAnnouncement[] {
    return announcements.filter(announcement => {
      const text = `${announcement.title} ${announcement.content}`.toLowerCase();
      return this.TARGET_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
    });
  }

  private categorizeAnnouncement(text: string): string {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'regulatory'; // Default category
  }

  private async createSummaries(announcements: BSEAnnouncement[]): Promise<ProcessedAnnouncement[]> {
    const processed: ProcessedAnnouncement[] = [];
    
    for (const announcement of announcements) {
      try {
        // Create a news-style summary
        const summary = await this.generateSummary(announcement);
        
        processed.push({
          id: Date.now() + Math.random(),
          title: this.enhanceTitle(announcement.title),
          content: summary,
          type: this.mapCategoryToType(announcement.category),
          time: new Date(announcement.pubDate),
          source: 'BSE Official',
          sentiment: this.analyzeSentiment(announcement),
          priority: this.assignPriority(announcement),
          imageUrl: this.getContextualImage(announcement.category),
          createdAt: new Date(),
          sourceUrl: announcement.link,
          category: announcement.category
        });
        
      } catch (error) {
        console.error('Error processing announcement:', error);
      }
    }
    
    return processed;
  }

  private async generateSummary(announcement: BSEAnnouncement): Promise<string> {
    // Create a news-style summary based on the announcement
    const category = announcement.category;
    const text = announcement.content;
    
    // Extract key information and create a structured summary
    let summary = '';
    
    if (category === 'regulatory') {
      summary = this.createRegulatorySummary(text);
    } else if (category === 'financial-results') {
      summary = this.createResultsSummary(text);
    } else if (category === 'warrants') {
      summary = this.createWarrantsSummary(text);
    } else if (category === 'trading-action') {
      summary = this.createTradingActionSummary(text);
    } else if (category === 'investigation') {
      summary = this.createInvestigationSummary(text);
    } else if (category === 'disclosure') {
      summary = this.createDisclosureSummary(text);
    } else if (category === 'order-win') {
      summary = this.createOrderWinSummary(text);
    } else {
      summary = this.createGenericSummary(text);
    }
    
    return summary;
  }

  private createRegulatorySummary(text: string): string {
    return `BSE has issued a regulatory announcement regarding market compliance. ${text}. This action is part of BSE's ongoing efforts to maintain market integrity and protect investor interests. Market participants are advised to take note of these regulatory updates and ensure compliance with all applicable regulations.`;
  }

  private createResultsSummary(text: string): string {
    return `A company has announced its latest financial results on BSE. ${text}. The results include key financial metrics and performance indicators. Investors and analysts will closely examine these figures to assess the company's financial health and future prospects.`;
  }

  private createWarrantsSummary(text: string): string {
    return `BSE has announced important trading information regarding warrants or trading restrictions. ${text}. This announcement may affect trading activity and investor decisions. Market participants should review the details carefully before making any trading decisions.`;
  }

  private createTradingActionSummary(text: string): string {
    return `BSE has implemented critical trading measures including circuit breakers or trading halts. ${text}. These actions are designed to maintain market stability and protect investors during periods of excessive volatility. Trading restrictions may significantly impact stock prices and investor strategies.`;
  }

  private createInvestigationSummary(text: string): string {
    return `BSE has announced surveillance or investigation actions related to market integrity. ${text}. These measures are part of BSE's commitment to maintaining fair and transparent markets. Investors should be aware that such actions may lead to further regulatory consequences.`;
  }

  private createDisclosureSummary(text: string): string {
    return `BSE has highlighted disclosure or compliance issues affecting market participants. ${text}. Proper disclosure is essential for market transparency and investor protection. Non-compliance with disclosure norms may result in regulatory action and penalties.`;
  }

  private createOrderWinSummary(text: string): string {
    return `A significant business development has been announced on BSE. ${text}. This order win or contract award represents a positive development for the company and may impact its financial performance and stock price. Investors should consider this development in their investment decisions.`;
  }

  private createGenericSummary(text: string): string {
    return `BSE has published an important announcement affecting market participants. ${text}. This update provides crucial information for investors and market participants. Stakeholders are advised to review the announcement details and consider any potential impact on their investment strategies.`;
  }

  private enhanceTitle(title: string): string {
    // Clean up and enhance the title for better readability
    return title.replace(/\s+/g, ' ').trim();
  }

  private mapCategoryToType(category: string): string {
    const typeMap: { [key: string]: string } = {
      'regulatory': 'regulatory',
      'trading-action': 'trading-action',
      'warrants': 'warrants',
      'financial-results': 'earnings',
      'order-win': 'order-win',
      'investigation': 'investigation',
      'disclosure': 'regulatory'
    };
    
    return typeMap[category] || 'regulatory';
  }

  private analyzeSentiment(announcement: BSEAnnouncement): string {
    const text = `${announcement.title} ${announcement.content}`.toLowerCase();
    
    const positiveKeywords = ['win', 'award', 'growth', 'profit', 'success', 'approved'];
    const negativeKeywords = ['fine', 'penalty', 'violation', 'suspension', 'block', 'investigation'];
    
    const positiveCount = positiveKeywords.filter(keyword => text.includes(keyword)).length;
    const negativeCount = negativeKeywords.filter(keyword => text.includes(keyword)).length;
    
    if (negativeCount > positiveCount) return 'Negative';
    if (positiveCount > negativeCount) return 'Positive';
    return 'Neutral';
  }

  private assignPriority(announcement: BSEAnnouncement): string {
    const text = `${announcement.title} ${announcement.content}`.toLowerCase();
    
    const highPriorityKeywords = ['fine', 'penalty', 'suspension', 'investigation', 'circuit', 'halt', 'delisting', 'enforcement', 'violation', 'breach'];
    const mediumPriorityKeywords = ['warrant', 'result', 'unaudited', 'disclosure', 'compliance', 'surveillance'];
    
    if (highPriorityKeywords.some(keyword => text.includes(keyword))) return 'High';
    if (mediumPriorityKeywords.some(keyword => text.includes(keyword))) return 'Medium';
    return 'Low';
  }

  private getContextualImage(category: string): string | null {
    const imageMap: { [key: string]: string } = {
      'regulatory': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop&auto=format&q=80',
      'trading-action': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80',
      'financial-results': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format&q=80',
      'warrants': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80',
      'investigation': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop&auto=format&q=80',
      'disclosure': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop&auto=format&q=80',
      'order-win': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format&q=80'
    };
    
    return imageMap[category] || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80';
  }
}