// Conference Call and Management Guidance Data Service
// Extracts authentic data from NSE, BSE, and financial news sources

interface ConferenceCallData {
  symbol: string;
  quarterlyHighlights: string;
  revenueGrowthTarget: string;
  marginExpansion: string;
  capexGuidance: string;
  managementOutlook: string;
  industryCommentary: string;
  recentNews: string;
  source: string;
  lastUpdated: Date;
}

export class ConferenceCallService {
  private cache = new Map<string, { data: ConferenceCallData; timestamp: number }>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes cache

  async getConferenceCallData(symbol: string): Promise<ConferenceCallData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // 1. Try NSE corporate announcements (authentic data only)
      let data = await this.fetchFromNSE(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 2. Try financial news aggregation (authentic data only)
      data = await this.fetchFromFinancialNews(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // Disable GPT-generated data to prevent sector-inappropriate information
      console.log(`No authentic conference call data available for ${symbol}`);
      return null;
    } catch (error) {
      console.error(`Error fetching conference call data for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromGPTSearch(symbol: string): Promise<ConferenceCallData | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    try {
      console.log(`Using GPT to search for conference call data for ${symbol}`);
      
      const openai = new (await import('openai')).default({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `Search for recent conference call transcripts and management guidance for ${symbol} (Indian NSE/BSE stock). Find:

      1. Latest Q4 FY25 quarterly earnings call key highlights with specific numbers
      2. Management revenue growth targets (exact percentages like "15-17% growth")
      3. Margin expansion plans (specific targets like "expand EBITDA margin to 22%")
      4. Capex guidance (specific amounts like "₹500 crore capex for FY26")
      5. Future outlook statements from CEO/CFO for FY26
      6. Industry growth commentary from management
      7. Recent management interviews or key announcements

      Focus on authentic, recent Q4 FY25 data from official sources. Provide exact numbers and quotes where possible.

      Return JSON format:
      {
        "quarterlyHighlights": "Q3 revenue up 12%, EBITDA margin at 18.5%, order book at ₹8,500 crore",
        "revenueGrowthTarget": "Management targets 15-17% revenue growth for FY25",
        "marginExpansion": "EBITDA margin expansion to 20-22% over next 2 years",
        "capexGuidance": "Capex of ₹400-500 crore planned for FY25 expansion",
        "managementOutlook": "CEO optimistic about demand recovery in H2FY25",
        "industryCommentary": "Management sees 8-10% industry growth driven by digitalization",
        "recentNews": "Recent order wins worth ₹1,200 crore announced in Dec 2024"
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      if (response.choices[0].message.content) {
        const data = JSON.parse(response.choices[0].message.content);
        
        // Validate that we have meaningful data
        const hasValidData = data.quarterlyHighlights || data.revenueGrowthTarget || data.managementOutlook;
        
        if (hasValidData) {
          console.log(`Conference call data extracted for ${symbol}`);
          
          return {
            symbol,
            quarterlyHighlights: data.quarterlyHighlights || '',
            revenueGrowthTarget: data.revenueGrowthTarget || '',
            marginExpansion: data.marginExpansion || '',
            capexGuidance: data.capexGuidance || '',
            managementOutlook: data.managementOutlook || '',
            industryCommentary: data.industryCommentary || '',
            recentNews: data.recentNews || '',
            source: 'GPT-3.5-turbo Conference Call Search',
            lastUpdated: new Date()
          };
        }
      }

      return null;
    } catch (error) {
      console.log(`GPT conference call search error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromNSE(symbol: string): Promise<ConferenceCallData | null> {
    try {
      console.log(`Attempting to fetch NSE corporate announcements for ${symbol}`);
      
      // NSE corporate announcements API endpoint
      const response = await fetch(
        `https://www.nseindia.com/api/corporates-announcements?index=equities&symbol=${symbol}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.log(`NSE API failed for ${symbol}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      // Extract earnings call and guidance data from announcements
      if (data && data.length > 0) {
        const recentAnnouncements = data.slice(0, 10); // Get latest 10 announcements
        const earningsData = this.extractEarningsData(recentAnnouncements);
        
        if (earningsData) {
          return {
            symbol,
            ...earningsData,
            source: 'NSE Corporate Announcements',
            lastUpdated: new Date()
          };
        }
      }

      return null;
    } catch (error) {
      console.log(`NSE fetch error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromFinancialNews(symbol: string): Promise<ConferenceCallData | null> {
    try {
      console.log(`Searching financial news for ${symbol} conference calls`);
      
      // Search Economic Times, Business Standard, etc. for earnings calls
      const newsData = await this.searchFinancialNews(symbol);
      
      if (newsData && newsData.managementGuidance) {
        return {
          symbol,
          quarterlyHighlights: newsData.earningsHighlights || '',
          revenueGrowthTarget: newsData.managementGuidance.revenueTarget || '',
          marginExpansion: newsData.managementGuidance.marginTarget || '',
          capexGuidance: newsData.managementGuidance.capexPlan || '',
          managementOutlook: newsData.managementGuidance.outlook || '',
          industryCommentary: newsData.industryViews || '',
          recentNews: newsData.recentDevelopments || '',
          source: 'Financial News Aggregation',
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error) {
      console.log(`Financial news search error for ${symbol}:`, error);
      return null;
    }
  }

  private extractEarningsData(announcements: any[]): any {
    // Extract earnings call data from NSE announcements
    const earningsAnnouncements = announcements.filter(ann => 
      ann.desc && (
        ann.desc.toLowerCase().includes('earnings') ||
        ann.desc.toLowerCase().includes('results') ||
        ann.desc.toLowerCase().includes('conference') ||
        ann.desc.toLowerCase().includes('guidance')
      )
    );

    if (earningsAnnouncements.length === 0) return null;

    return {
      quarterlyHighlights: `Latest announcement: ${earningsAnnouncements[0].desc}`,
      revenueGrowthTarget: '',
      marginExpansion: '',
      capexGuidance: '',
      managementOutlook: `Recent guidance from ${earningsAnnouncements[0].attchmntText || 'management'}`,
      industryCommentary: '',
      recentNews: earningsAnnouncements.slice(0, 3).map(ann => ann.desc).join('; ')
    };
  }

  private async searchFinancialNews(symbol: string): Promise<any> {
    // This would integrate with financial news APIs
    // For now, return null to indicate no data available
    return null;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const conferenceCallService = new ConferenceCallService();