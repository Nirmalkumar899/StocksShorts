// Authentic Indian Stock Market Data Provider
// Uses multiple legitimate sources for accurate financial data

interface IndianStockData {
  symbol: string;
  currentPrice: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  roe?: number;
  debtToEquity?: number;
  eps?: number;
  bookValue?: number;
  profitMargin?: number;
  revenueGrowth?: number;
  sector?: string;
  industry?: string;
  source: string;
  lastUpdated: Date;
}

export class IndianStockDataProvider {
  private cache = new Map<string, { data: IndianStockData; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  async getStockData(symbol: string): Promise<IndianStockData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // 1. Try Tiingo API (primary authentic source for Indian stocks)
      let data = await this.fetchFromTiingo(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 2. Try MoneyControl (secondary authentic source)
      data = await this.fetchFromMoneycontrol(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 3. Try Yahoo Finance with proper session handling
      data = await this.fetchFromYahooWithSession(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      console.log(`No authentic data available for ${symbol}`);
      return null;
    } catch (error) {
      console.log(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromTiingo(symbol: string): Promise<IndianStockData | null> {
    try {
      // Tiingo provides reliable Indian stock data with free tier
      const tiingoSymbol = `${symbol}.XNSE`; // NSE exchange format
      const response = await fetch(
        `https://api.tiingo.com/tiingo/daily/${tiingoSymbol}/prices?token=demo&startDate=2024-12-01`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const latestData = data[data.length - 1];
          console.log(`Tiingo authentic data for ${symbol}: ₹${latestData.close}`);
          
          return {
            symbol,
            currentPrice: latestData.close,
            source: 'Tiingo (Authentic NSE)',
            lastUpdated: new Date()
          };
        }
      }
      
      return null;
    } catch (error) {
      console.log(`Tiingo error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromMoneycontrol(symbol: string): Promise<IndianStockData | null> {
    try {
      // Use MoneyControl's stock search API
      const response = await fetch(
        `https://www.moneycontrol.com/stocks/marketstats/stock-price-charts/${symbol}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        }
      );

      if (response.ok) {
        const html = await response.text();
        
        // Extract stock price from HTML using regex
        const priceMatch = html.match(/id="Nse_Prc_tick_div"[^>]*>([^<]+)</);
        const peMatch = html.match(/PE<\/span>[^>]*>([^<]+)</);
        
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          const pe = peMatch ? parseFloat(peMatch[1]) : undefined;
          
          console.log(`MoneyControl authentic data for ${symbol}: ₹${price}`);
          
          return {
            symbol,
            currentPrice: price,
            pe,
            source: 'MoneyControl (Authentic)',
            lastUpdated: new Date()
          };
        }
      }
      
      return null;
    } catch (error) {
      console.log(`MoneyControl error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromETMarkets(symbol: string): Promise<IndianStockData | null> {
    try {
      // Economic Times Markets API
      const response = await fetch(
        `https://economictimes.indiatimes.com/markets/stocks/stock-quotes?stockid=${symbol}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.price) {
          console.log(`ET Markets data found for ${symbol}`);
          
          return {
            symbol,
            currentPrice: parseFloat(data.price) || 0,
            marketCap: parseFloat(data.marketcap) || undefined,
            pe: parseFloat(data.pe) || undefined,
            source: 'ET Markets',
            lastUpdated: new Date()
          };
        }
      }
      
      return null;
    } catch (error) {
      console.log(`ET Markets error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromYahooWithSession(symbol: string): Promise<IndianStockData | null> {
    try {
      const yahooSymbol = `${symbol}.NS`;
      
      // First get a crumb for the session
      const crumbResponse = await fetch(
        'https://query1.finance.yahoo.com/v1/test/getcrumb',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      if (!crumbResponse.ok) {
        return null;
      }

      const crumb = await crumbResponse.text();
      
      // Now fetch the stock data with the crumb
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d&crumb=${crumb}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        
        if (result && result.meta) {
          const meta = result.meta;
          console.log(`Yahoo Finance authentic data for ${symbol}: ₹${meta.regularMarketPrice}`);
          
          return {
            symbol,
            currentPrice: meta.regularMarketPrice || meta.previousClose,
            marketCap: meta.marketCap,
            source: 'Yahoo Finance (Authenticated)',
            lastUpdated: new Date()
          };
        }
      }
      
      return null;
    } catch (error) {
      console.log(`Yahoo Finance with session error for ${symbol}:`, error);
      return null;
    }
  }

  // Test multiple stocks to validate data accuracy
  async testMultipleStocks(symbols: string[]): Promise<{ [key: string]: IndianStockData | null }> {
    const results: { [key: string]: IndianStockData | null } = {};
    
    for (const symbol of symbols) {
      console.log(`Testing authentic data for ${symbol}...`);
      results[symbol] = await this.getStockData(symbol);
      
      // Rate limiting between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const indianStockDataProvider = new IndianStockDataProvider();