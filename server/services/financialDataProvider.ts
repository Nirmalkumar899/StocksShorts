// Professional financial data provider for Indian stocks
// Supports multiple authentic data sources with fallback hierarchy

interface FinancialData {
  symbol: string;
  currentPrice?: number;
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
      // 1. Try GPT-powered financial data extraction (most comprehensive)
      console.log(`Starting financial data extraction for ${symbol}`);
      let data = await this.fetchFromGPTSearch(symbol);
      if (data) {
        console.log(`GPT extraction successful for ${symbol}`);
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 2. Try Yahoo Finance
      data = await this.fetchFromYahooFinance(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 3. Try Alpha Vantage (for supported stocks)
      data = await this.fetchFromAlphaVantage(symbol);
      if (data) {
        this.cache.set(symbol, { data, timestamp: Date.now() });
        return data;
      }

      // 4. Try Financial Modeling Prep
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
      console.log(`Attempting Alpha Vantage for ${symbol}`);
      
      // Try multiple symbol formats for Indian stocks
      const formats = [
        `${symbol}.BSE`,
        `${symbol}.NS`, 
        `${symbol}.NSE`,
        `${symbol}.BO`,
        symbol
      ];

      for (const format of formats) {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${format}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (data.Symbol && !data.Note && !data.Information) {
          console.log(`Alpha Vantage success for ${symbol} using format ${format}`);
          
          return {
            symbol,
            currentPrice: parseFloat(data.Price || '0') || undefined,
            marketCap: parseFloat(data.MarketCapitalization || '0') || undefined,
            pe: parseFloat(data.PERatio || '0') || undefined,
            eps: parseFloat(data.EPS || '0') || undefined,
            roe: parseFloat(data.ReturnOnEquityTTM || '0') || undefined,
            debtToEquity: parseFloat(data.DebtToEquityRatio || '0') || undefined,
            profitMargin: parseFloat(data.ProfitMargin || '0') || undefined,
            bookValue: parseFloat(data.BookValue || '0') || undefined,
            pb: parseFloat(data.PriceToBookRatio || '0') || undefined,
            sector: data.Sector || undefined,
            industry: data.Industry || undefined,
            source: 'Alpha Vantage',
            lastUpdated: new Date()
          };
        }

        // Rate limiting between attempts
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`Alpha Vantage: No data found for ${symbol} in any format`);
      return null;
    } catch (error) {
      console.log(`Alpha Vantage error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromYahooFinance(symbol: string): Promise<FinancialData | null> {
    try {
      const yahooSymbol = this.stockMappings[symbol] || `${symbol}.NS`;
      console.log(`Attempting Yahoo Finance for ${yahooSymbol}`);
      
      const response = await fetch(
        `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryDetail,financialData,defaultKeyStatistics,earnings`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
          }
        }
      );

      if (!response.ok) {
        console.log(`Yahoo Finance failed for ${yahooSymbol}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const result = data.quoteSummary?.result?.[0];
      if (!result) {
        console.log(`No data in Yahoo Finance response for ${yahooSymbol}`);
        return null;
      }

      const summary = result.summaryDetail || {};
      const financial = result.financialData || {};
      const keyStats = result.defaultKeyStatistics || {};
      const earnings = result.earnings || {};

      const extractedData = {
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
        sector: summary.sector,
        industry: summary.industry,
        source: 'Yahoo Finance',
        lastUpdated: new Date()
      };

      // Filter out null/undefined values
      const cleanData = Object.fromEntries(
        Object.entries(extractedData).filter(([_, value]) => value !== null && value !== undefined)
      ) as FinancialData;

      console.log(`Yahoo Finance success for ${symbol}: ${Object.keys(cleanData).length} metrics`);
      return cleanData;
    } catch (error) {
      console.log(`Yahoo Finance error for ${symbol}:`, error);
      return null;
    }
  }



  private async fetchFromGPTSearch(symbol: string): Promise<FinancialData | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    try {
      console.log(`Using GPT-3.5-turbo to extract financial data for ${symbol}`);
      
      const openai = new (await import('openai')).default({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `Extract current financial data for ${symbol} (Indian NSE/BSE stock). Provide exact numerical data in JSON format:
      {
        "currentPrice": number (in rupees),
        "pe": number (PE ratio),
        "marketCap": number (in crores),
        "roe": number (as decimal, e.g., 0.15 for 15%),
        "debtToEquity": number,
        "profitMargin": number (as decimal),
        "eps": number,
        "bookValue": number,
        "pb": number (price to book ratio),
        "sector": "string",
        "industry": "string"
      }
      Search for authentic data from financial websites. If specific data unavailable, set to null. Focus on current accurate numbers.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      if (response.choices[0].message.content) {
        const data = JSON.parse(response.choices[0].message.content);
        
        // Validate that we have meaningful data
        const hasValidData = data.currentPrice > 0 || data.pe > 0 || data.marketCap > 0;
        
        if (hasValidData) {
          console.log(`GPT extracted financial data for ${symbol}: ${Object.keys(data).length} metrics`);
          
          return {
            symbol,
            currentPrice: data.currentPrice || undefined,
            pe: data.pe || undefined,
            marketCap: data.marketCap || undefined,
            roe: data.roe || undefined,
            debtToEquity: data.debtToEquity || undefined,
            profitMargin: data.profitMargin || undefined,
            eps: data.eps || undefined,
            bookValue: data.bookValue || undefined,
            pb: data.pb || undefined,
            sector: data.sector || undefined,
            industry: data.industry || undefined,
            source: 'GPT-3.5-turbo Financial Search',
            lastUpdated: new Date()
          };
        }
      }

      console.log(`GPT: No meaningful financial data found for ${symbol}`);
      return null;
    } catch (error) {
      console.log(`GPT search error for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchFromFMP(symbol: string): Promise<FinancialData | null> {
    if (!process.env.FMP_API_KEY) return null;

    try {
      console.log(`Attempting Financial Modeling Prep for ${symbol}`);
      
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
        pb: profile.pb,
        sector: profile.sector,
        industry: profile.industry,
        source: 'Financial Modeling Prep',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.log(`FMP error for ${symbol}:`, error);
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