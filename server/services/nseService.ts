import axios from 'axios';

interface NSEStockData {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  dayHigh: number;
  dayLow: number;
  totalTradedVolume: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  industry?: string;
}

interface NSEQuoteResponse {
  info: {
    symbol: string;
    companyName: string;
    industry: string;
  };
  metadata: {
    series: string;
    symbol: string;
    isin: string;
    status: string;
    listingDate: string;
  };
  securityInfo: {
    boardStatus: string;
    tradingStatus: string;
    tradingSegment: string;
    sessionNo: string;
    slb: string;
    classOfShare: string;
    derivatives: string;
    surveillance: {
      surv: null;
      desc: null;
    };
    faceValue: number;
    issuedSize: number;
  };
  sddDetails: {
    SDDAuditor: string;
    SDDStatus: string;
  };
  priceInfo: {
    lastPrice: number;
    change: number;
    pChange: number;
    previousClose: number;
    open: number;
    close: number;
    vwap: number;
    lowerCP: number;
    upperCP: number;
    pPriceBand: string;
    basePrice: number;
    intraDayHighLow: {
      min: number;
      max: number;
      value: number;
    };
    weekHighLow: {
      min: number;
      minDate: string;
      max: number;
      maxDate: string;
      value: number;
    };
  };
  industryInfo: {
    macro: string;
    sector: string;
    industry: string;
    basicIndustry: string;
  };
  preOpenMarket: {
    preopen: Array<{
      price: number;
      buyQty: number;
      sellQty: number;
      iep?: boolean;
    }>;
    ato: {
      buy: number;
      sell: number;
    };
    IEP: number;
    totalTradedVolume: number;
    finalPrice: number;
    finalQuantity: number;
    lastUpdateTime: string;
    totalBuyQuantity: number;
    totalSellQuantity: number;
    atoBuyQty: number;
    atoSellQty: number;
  };
}

export class NSEService {
  private baseUrl = 'https://www.nseindia.com/api';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  private session: any = null;

  async initSession() {
    try {
      // Initialize session with NSE homepage
      await axios.get('https://www.nseindia.com', { headers: this.headers });
      this.session = axios.create({
        baseURL: this.baseUrl,
        headers: this.headers,
        timeout: 10000,
      });
    } catch (error) {
      console.error('Failed to initialize NSE session:', error);
    }
  }

  async getStockQuote(symbol: string): Promise<NSEStockData | null> {
    try {
      if (!this.session) {
        await this.initSession();
      }

      const response = await this.session.get(`/quote-equity?symbol=${symbol.toUpperCase()}`);
      const data: NSEQuoteResponse = response.data;

      return {
        symbol: data.info.symbol,
        companyName: data.info.companyName,
        lastPrice: data.priceInfo.lastPrice,
        change: data.priceInfo.change,
        pChange: data.priceInfo.pChange,
        dayHigh: data.priceInfo.intraDayHighLow.max,
        dayLow: data.priceInfo.intraDayHighLow.min,
        totalTradedVolume: data.preOpenMarket?.totalTradedVolume || 0,
        industry: data.industryInfo?.industry || data.info.industry,
      };
    } catch (error) {
      console.error(`Error fetching NSE data for ${symbol}:`, error);
      return null;
    }
  }

  async getMultipleStocks(symbols: string[]): Promise<{ [key: string]: NSEStockData }> {
    const results: { [key: string]: NSEStockData } = {};
    
    for (const symbol of symbols) {
      const data = await this.getStockQuote(symbol);
      if (data) {
        results[symbol.toLowerCase()] = data;
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  async getNiftyData(): Promise<any> {
    try {
      if (!this.session) {
        await this.initSession();
      }

      const response = await this.session.get('/equity-stockIndices?index=NIFTY%2050');
      return response.data;
    } catch (error) {
      console.error('Error fetching Nifty data:', error);
      return null;
    }
  }

  async getTopGainers(): Promise<any[]> {
    try {
      if (!this.session) {
        await this.initSession();
      }

      const response = await this.session.get('/equity-stockIndices?index=NIFTY%2050');
      const data = response.data;
      
      if (data && data.data) {
        return data.data
          .filter((stock: any) => stock.pChange > 0)
          .sort((a: any, b: any) => b.pChange - a.pChange)
          .slice(0, 10);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      return [];
    }
  }

  async getTopLosers(): Promise<any[]> {
    try {
      if (!this.session) {
        await this.initSession();
      }

      const response = await this.session.get('/equity-stockIndices?index=NIFTY%2050');
      const data = response.data;
      
      if (data && data.data) {
        return data.data
          .filter((stock: any) => stock.pChange < 0)
          .sort((a: any, b: any) => a.pChange - b.pChange)
          .slice(0, 10);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching top losers:', error);
      return [];
    }
  }
}

export const nseService = new NSEService();