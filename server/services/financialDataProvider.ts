// Professional financial data provider for Indian stocks
// Supports multiple authentic data sources with fallback hierarchy

interface FinancialData {
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

export class FinancialDataProvider {
  private cache = new Map<string, { data: FinancialData; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  // Major Indian stock symbol mappings
  private stockMappings: { [key: string]: string } = {
    'TCS': 'TCS.NS',
    'RELIANCE': 'RELIANCE.NS',
    'HDFCBANK': 'HDFCBANK.NS',
    'INFY': 'INFY.NS',
    'ICICIBANK': 'ICICIBANK.NS',
    'HINDUNILVR': 'HINDUNILVR.NS',
    'ITC': 'ITC.NS',
    'SBIN': 'SBIN.NS',
    'BAJFINANCE': 'BAJFINANCE.NS',
    'BHARTIARTL': 'BHARTIARTL.NS',
    'ASIANPAINT': 'ASIANPAINT.NS',
    'MARUTI': 'MARUTI.NS',
    'KOTAKBANK': 'KOTAKBANK.NS',
    'LT': 'LT.NS',
    'AXISBANK': 'AXISBANK.NS',
    'NESTLEIND': 'NESTLEIND.NS',
    'HDFC': 'HDFC.NS',
    'WIPRO': 'WIPRO.NS',
    'ULTRACEMCO': 'ULTRACEMCO.NS',
    'TITAN': 'TITAN.NS'
  };

  async getFinancialData(symbol: string): Promise<FinancialData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // 1. Try Alpha Vantage (premium source)
      let data = await this.fetchFromAlphaVantage(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 2. Try Yahoo Finance (reliable fallback)
      data = await this.fetchFromYahooFinance(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 3. Try Financial Modeling Prep
      data = await this.fetchFromFMP(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      console.log(`No financial data available for ${symbol}`);
      return null;
    } catch (error) {
      console.log(`Error fetching financial data for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromAlphaVantage(symbol: string): Promise<FinancialData | null> {
    if (!process.env.ALPHA_VANTAGE_API_KEY) return null;

    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}.BSE&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.Symbol || data.Note) return null;

      return {
        symbol,
        currentPrice: parseFloat(data.Price || '0'),
        marketCap: parseFloat(data.MarketCapitalization || '0'),
        pe: parseFloat(data.PERatio || '0'),
        eps: parseFloat(data.EPS || '0'),
        roe: parseFloat(data.ReturnOnEquityTTM || '0'),
        debtToEquity: parseFloat(data.DebtToEquityRatio || '0'),
        profitMargin: parseFloat(data.ProfitMargin || '0'),
        bookValue: parseFloat(data.BookValue || '0'),
        pb: parseFloat(data.PriceToBookRatio || '0'),
        sector: data.Sector,
        industry: data.Industry,
        source: 'Alpha Vantage',
        lastUpdated: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  private async fetchFromYahooFinance(symbol: string): Promise<FinancialData | null> {
    try {
      const yahooSymbol = this.stockMappings[symbol] || `${symbol}.NS`;
      
      const response = await fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryDetail,financialData,defaultKeyStatistics`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const result = data.quoteSummary?.result?.[0];
      if (!result) return null;

      const summary = result.summaryDetail || {};
      const financial = result.financialData || {};
      const keyStats = result.defaultKeyStatistics || {};

      return {
        symbol,
        currentPrice: summary.regularMarketPrice?.raw || summary.previousClose?.raw || 0,
        marketCap: summary.marketCap?.raw,
        pe: summary.trailingPE?.raw || summary.forwardPE?.raw,
        pb: keyStats.priceToBook?.raw,
        eps: keyStats.trailingEps?.raw,
        bookValue: keyStats.bookValue?.raw,
        roe: financial.returnOnEquity?.raw,
        debtToEquity: financial.debtToEquity?.raw,
        profitMargin: financial.profitMargins?.raw,
        revenueGrowth: financial.revenueGrowth?.raw,
        source: 'Yahoo Finance',
        lastUpdated: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  private async fetchFromFMP(symbol: string): Promise<FinancialData | null> {
    if (!process.env.FMP_API_KEY) return null;

    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}.NS?apikey=${process.env.FMP_API_KEY}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data[0]) return null;

      const profile = data[0];
      return {
        symbol,
        currentPrice: profile.price || 0,
        marketCap: profile.mktCap,
        pe: profile.pe,
        eps: profile.eps,
        sector: profile.sector,
        industry: profile.industry,
        source: 'Financial Modeling Prep',
        lastUpdated: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  async testMultipleStocks(symbols: string[]): Promise<{ [key: string]: FinancialData | null }> {
    const results: { [key: string]: FinancialData | null } = {};
    
    for (const symbol of symbols) {
      results[symbol] = await this.getFinancialData(symbol);
    }

    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const financialDataProvider = new FinancialDataProvider();