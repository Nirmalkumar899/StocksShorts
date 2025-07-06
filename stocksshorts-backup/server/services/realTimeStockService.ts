import axios from 'axios';

interface StockData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  roe?: number;
  debtToEquity?: number;
  sector?: string;
  industry?: string;
  lastUpdated: Date;
}

interface YahooFinanceData {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  displayName: string;
  longName: string;
  marketCap?: number;
  trailingPE?: number;
  priceToBook?: number;
}

export class RealTimeStockService {
  private cache = new Map<string, { data: StockData; timestamp: number }>();
  private cacheTimeout = 2 * 60 * 1000; // 2 minutes cache

  // Stock symbol mappings for NSE stocks
  private stockMappings: { [key: string]: string } = {
    'tcs': 'TCS.NS',
    'tata consultancy': 'TCS.NS',
    'infosys': 'INFY.NS',
    'wipro': 'WIPRO.NS',
    'reliance': 'RELIANCE.NS',
    'reliance industries': 'RELIANCE.NS',
    'hdfc bank': 'HDFCBANK.NS',
    'hdfc': 'HDFCBANK.NS',
    'icici bank': 'ICICIBANK.NS',
    'icici': 'ICICIBANK.NS',
    'sbi': 'SBIN.NS',
    'state bank': 'SBIN.NS',
    'bharti airtel': 'BHARTIARTL.NS',
    'airtel': 'BHARTIARTL.NS',
    'itc': 'ITC.NS',
    'hindustan unilever': 'HINDUNILVR.NS',
    'hul': 'HINDUNILVR.NS',
    'maruti': 'MARUTI.NS',
    'maruti suzuki': 'MARUTI.NS',
    'bajaj finance': 'BAJFINANCE.NS',
    'asian paints': 'ASIANPAINT.NS',
    'nestle': 'NESTLEIND.NS',
    'nestle india': 'NESTLEIND.NS',
    'titan': 'TITAN.NS',
    'titan company': 'TITAN.NS',
    'larsen toubro': 'LT.NS',
    'l&t': 'LT.NS',
    'zomato': 'ZOMATO.NS',
    'paytm': 'PAYTM.NS',
    'nykaa': 'NYKAA.NS',
    'policybazaar': 'PB.NS',
    'pb fintech': 'PB.NS',
    'delhivery': 'DELHIVERY.NS',
    'star health': 'STARHEALTH.NS',
    'lic': 'LICI.NS',
    'life insurance corporation': 'LICI.NS'
  };

  async getStockData(stockQuery: string): Promise<StockData | null> {
    const cacheKey = stockQuery.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try Yahoo Finance API first (most reliable for Indian stocks)
      const yahooData = await this.fetchFromYahooFinance(stockQuery);
      if (yahooData) {
        this.cache.set(cacheKey, { data: yahooData, timestamp: Date.now() });
        return yahooData;
      }

      // Fallback to Alpha Vantage
      const alphaData = await this.fetchFromAlphaVantage(stockQuery);
      if (alphaData) {
        this.cache.set(cacheKey, { data: alphaData, timestamp: Date.now() });
        return alphaData;
      }

      console.log(`No real-time data found for ${stockQuery}`);
      return null;
    } catch (error) {
      console.error(`Error fetching stock data for ${stockQuery}:`, error);
      return null;
    }
  }

  private async fetchFromYahooFinance(stockQuery: string): Promise<StockData | null> {
    try {
      const symbol = this.getYahooSymbol(stockQuery);
      if (!symbol) return null;

      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      if (!meta || !quote) return null;

      return {
        symbol: meta.symbol,
        companyName: meta.longName || meta.displayName || symbol,
        currentPrice: meta.regularMarketPrice || 0,
        change: meta.regularMarketChange || 0,
        changePercent: meta.regularMarketChangePercent || 0,
        dayHigh: meta.regularMarketDayHigh || 0,
        dayLow: meta.regularMarketDayLow || 0,
        volume: meta.regularMarketVolume || 0,
        marketCap: meta.marketCap,
        pe: meta.trailingPE,
        pb: meta.priceToBook,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Yahoo Finance error for ${stockQuery}:`, error);
      return null;
    }
  }

  private async fetchFromAlphaVantage(stockQuery: string): Promise<StockData | null> {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) return null;

      const symbol = this.getAlphaVantageSymbol(stockQuery);
      if (!symbol) return null;

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: apiKey
        },
        timeout: 5000
      });

      const quote = response.data?.['Global Quote'];
      if (!quote) return null;

      return {
        symbol: quote['01. symbol'],
        companyName: symbol,
        currentPrice: parseFloat(quote['05. price']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
        dayHigh: parseFloat(quote['03. high']) || 0,
        dayLow: parseFloat(quote['04. low']) || 0,
        volume: parseInt(quote['06. volume']) || 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Alpha Vantage error for ${stockQuery}:`, error);
      return null;
    }
  }

  private getYahooSymbol(stockQuery: string): string | null {
    const query = stockQuery.toLowerCase().trim();
    return this.stockMappings[query] || null;
  }

  private getAlphaVantageSymbol(stockQuery: string): string | null {
    const symbol = this.getYahooSymbol(stockQuery);
    return symbol?.replace('.NS', '.BSE') || null;
  }

  async getMultipleStocks(queries: string[]): Promise<{ [key: string]: StockData }> {
    const results: { [key: string]: StockData } = {};
    const promises = queries.map(async (query) => {
      const data = await this.getStockData(query);
      if (data) {
        results[query.toLowerCase()] = data;
      }
    });

    await Promise.all(promises);
    return results;
  }

  async getNiftyData(): Promise<StockData | null> {
    try {
      const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/^NSEI', {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      
      return {
        symbol: 'NIFTY',
        companyName: 'NIFTY 50',
        currentPrice: meta.regularMarketPrice || 0,
        change: meta.regularMarketChange || 0,
        changePercent: meta.regularMarketChangePercent || 0,
        dayHigh: meta.regularMarketDayHigh || 0,
        dayLow: meta.regularMarketDayLow || 0,
        volume: meta.regularMarketVolume || 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching Nifty data:', error);
      return null;
    }
  }

  async getTopMovers(): Promise<{ gainers: StockData[]; losers: StockData[] }> {
    const popularStocks = [
      'TCS', 'Infosys', 'Reliance', 'HDFC Bank', 'ICICI Bank',
      'Bharti Airtel', 'ITC', 'SBI', 'Asian Paints', 'Bajaj Finance'
    ];

    const stocksData = await this.getMultipleStocks(popularStocks);
    const stocks = Object.values(stocksData);

    const gainers = stocks
      .filter(stock => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const losers = stocks
      .filter(stock => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    return { gainers, losers };
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache status for debugging
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const realTimeStockService = new RealTimeStockService();