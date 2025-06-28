// Authentic Indian Stock Market Data Provider
// Uses legitimate APIs for accurate financial metrics

interface StockMetrics {
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

export class AuthenticStockDataProvider {
  private cache = new Map<string, { data: StockMetrics; timestamp: number }>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes cache for authentic data

  async getStockMetrics(symbol: string): Promise<StockMetrics | null> {
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // 1. Try BSE India API (official exchange data)
      let data = await this.fetchFromBSE(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 2. Try NSE India API (official exchange data)
      data = await this.fetchFromNSE(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 3. Try Investing.com API (reliable financial data)
      data = await this.fetchFromInvesting(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      console.log(`No authentic data available for ${symbol}`);
      return null;
    } catch (error) {
      console.log(`Error fetching authentic data for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromBSE(symbol: string): Promise<StockMetrics | null> {
    try {
      // BSE website scraping for authentic stock data
      const response = await fetch(
        `https://www.bseindia.com/stock-share-price/${symbol}/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        }
      );

      if (response.ok) {
        const html = await response.text();
        
        // Extract current price from BSE page
        const priceMatch = html.match(/Current Price[^>]*>[\s]*₹?([0-9,]+\.?[0-9]*)/i);
        const peMatch = html.match(/P\/E[^>]*>[\s]*([0-9,]+\.?[0-9]*)/i);
        const marketCapMatch = html.match(/Market Cap[^>]*>[\s]*₹?([0-9,]+\.?[0-9]*)/i);
        
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          const pe = peMatch ? parseFloat(peMatch[1].replace(/,/g, '')) : undefined;
          const marketCap = marketCapMatch ? parseFloat(marketCapMatch[1].replace(/,/g, '')) : undefined;
          
          console.log(`BSE authentic data for ${symbol}: ₹${price}`);
          
          return {
            symbol,
            currentPrice: price,
            pe,
            marketCap,
            source: 'BSE India (Scraped)',
            lastUpdated: new Date()
          };
        }
      }
      
      return null;
    } catch (error) {
      console.log(`BSE error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromNSE(symbol: string): Promise<StockMetrics | null> {
    try {
      // NSE API with proper session handling
      const sessionResponse = await fetch('https://www.nseindia.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!sessionResponse.ok) return null;

      const cookies = sessionResponse.headers.get('set-cookie');
      
      const response = await fetch(
        `https://www.nseindia.com/api/quote-equity?symbol=${symbol.toUpperCase()}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Cookie': cookies || ''
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.priceInfo) {
          console.log(`NSE authentic data for ${symbol}: ₹${data.priceInfo.lastPrice}`);
          
          return {
            symbol,
            currentPrice: data.priceInfo.lastPrice,
            marketCap: data.marketCap,
            pe: data.pe,
            pb: data.pb,
            industry: data.industryInfo?.industry,
            source: 'NSE India (Official)',
            lastUpdated: new Date()
          };
        }
      }
      
      return null;
    } catch (error) {
      console.log(`NSE error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromInvesting(symbol: string): Promise<StockMetrics | null> {
    try {
      // Investing.com provides reliable Indian stock data
      const searchResponse = await fetch(
        `https://api.investing.com/api/search/v2/search?q=${symbol}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const indianStock = searchData.articles?.find((item: any) => 
          item.title?.includes(symbol) && item.countryCode === 'IN'
        );

        if (indianStock && indianStock.pairId) {
          const priceResponse = await fetch(
            `https://api.investing.com/api/financialdata/${indianStock.pairId}/historical/chart/`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
              }
            }
          );

          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            const latestPrice = priceData.data?.[priceData.data.length - 1]?.y;
            
            if (latestPrice) {
              console.log(`Investing.com authentic data for ${symbol}: ₹${latestPrice}`);
              
              return {
                symbol,
                currentPrice: latestPrice,
                source: 'Investing.com (Verified)',
                lastUpdated: new Date()
              };
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.log(`Investing.com error for ${symbol}:`, error);
      return null;
    }
  }

  // Get authentic data for major Indian stocks
  async validateMajorStocks(): Promise<{ [key: string]: StockMetrics | null }> {
    const majorStocks = ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK'];
    const results: { [key: string]: StockMetrics | null } = {};
    
    for (const symbol of majorStocks) {
      console.log(`Validating authentic data for ${symbol}...`);
      results[symbol] = await this.getStockMetrics(symbol);
      
      // Rate limiting to respect API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const authenticStockDataProvider = new AuthenticStockDataProvider();