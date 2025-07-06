import axios from 'axios';

interface LiveStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
  lastUpdated: Date;
}

export class StockDataProvider {
  private cache = new Map<string, { data: LiveStockData; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache

  async getLiveStockData(symbol: string): Promise<LiveStockData | null> {
    const cacheKey = symbol.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Try Yahoo Finance for Indian stocks
      const yahooSymbol = this.getYahooSymbol(symbol);
      if (yahooSymbol) {
        const data = await this.fetchFromYahoo(yahooSymbol);
        if (data) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      }

      // Fallback: Return null to use static data
      return null;
    } catch (error) {
      console.log(`Live data not available for ${symbol}, using fallback`);
      return null;
    }
  }

  private async fetchFromYahoo(symbol: string): Promise<LiveStockData | null> {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data?.chart?.result?.[0];
      if (!result?.meta) return null;

      const meta = result.meta;
      
      // Ensure we have valid price data
      if (!meta.regularMarketPrice || meta.regularMarketPrice <= 0) {
        return null;
      }

      return {
        symbol: meta.symbol.replace('.NS', ''),
        name: meta.longName || meta.displayName || symbol.replace('.NS', ''),
        price: parseFloat(meta.regularMarketPrice.toFixed(2)),
        change: parseFloat((meta.regularMarketChange || 0).toFixed(2)),
        changePercent: parseFloat((meta.regularMarketChangePercent || 0).toFixed(2)),
        high: parseFloat((meta.regularMarketDayHigh || 0).toFixed(2)),
        low: parseFloat((meta.regularMarketDayLow || 0).toFixed(2)),
        volume: parseInt(meta.regularMarketVolume || 0),
        marketCap: meta.marketCap,
        lastUpdated: new Date()
      };
    } catch (error: any) {
      console.log(`Yahoo Finance error for ${symbol}:`, error?.message || 'Unknown error');
      return null;
    }
  }

  private getYahooSymbol(query: string): string | null {
    const mappings: { [key: string]: string } = {
      'tcs': 'TCS.NS',
      'tata consultancy': 'TCS.NS',
      'tata consultancy services': 'TCS.NS',
      'infosys': 'INFY.NS',
      'reliance': 'RELIANCE.NS',
      'reliance industries': 'RELIANCE.NS',
      'hdfc bank': 'HDFCBANK.NS',
      'hdfc': 'HDFCBANK.NS',
      'icici': 'ICICIBANK.NS',
      'icici bank': 'ICICIBANK.NS',
      'sbi': 'SBIN.NS',
      'state bank': 'SBIN.NS',
      'state bank of india': 'SBIN.NS',
      'bharti airtel': 'BHARTIARTL.NS',
      'airtel': 'BHARTIARTL.NS',
      'itc': 'ITC.NS',
      'asian paints': 'ASIANPAINT.NS',
      'bajaj finance': 'BAJFINANCE.NS',
      'maruti': 'MARUTI.NS',
      'maruti suzuki': 'MARUTI.NS',
      'titan': 'TITAN.NS',
      'titan company': 'TITAN.NS',
      'wipro': 'WIPRO.NS',
      'hul': 'HINDUNILVR.NS',
      'hindustan unilever': 'HINDUNILVR.NS',
      'nestle': 'NESTLEIND.NS',
      'nestle india': 'NESTLEIND.NS',
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

    return mappings[query.toLowerCase()] || null;
  }

  async getMultipleStocks(symbols: string[]): Promise<{ [key: string]: LiveStockData }> {
    const results: { [key: string]: LiveStockData } = {};
    
    // Process in parallel but with a limit to avoid overwhelming APIs
    const chunks = this.chunk(symbols, 3);
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (symbol) => {
        const data = await this.getLiveStockData(symbol);
        if (data) {
          results[symbol.toLowerCase()] = data;
        }
      });
      
      await Promise.all(promises);
      // Small delay between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return results;
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const stockDataProvider = new StockDataProvider();