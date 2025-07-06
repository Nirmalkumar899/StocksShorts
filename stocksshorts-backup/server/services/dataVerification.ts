import axios from 'axios';

interface FinancialData {
  currentPrice?: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  roe?: number;
  eps?: number;
  profitMargin?: number;
  debtToEquity?: number;
  revenueGrowth?: number;
  [key: string]: number | undefined;
}

interface FinancialSource {
  name: string;
  data: FinancialData;
  confidence: number; // 0-100
}

interface VerifiedData {
  metric: string;
  value: number;
  variance: number;
  sources: string[];
  verified: boolean;
}

export class DataVerificationService {
  private readonly VARIANCE_THRESHOLD = 0.05; // 5% threshold
  
  async fetchFromMultipleSources(symbol: string): Promise<FinancialSource[]> {
    const sources: FinancialSource[] = [];
    
    // Source 1: NSE/BSE Official APIs
    try {
      const nseData = await this.fetchFromNSE(symbol);
      if (nseData) {
        sources.push({
          name: 'NSE',
          data: nseData,
          confidence: 95
        });
      }
    } catch (error) {
      console.log(`NSE data fetch failed for ${symbol}`);
    }
    
    // Source 2: Screener.in
    try {
      const screenerData = await this.fetchFromScreener(symbol);
      if (screenerData) {
        sources.push({
          name: 'Screener.in',
          data: screenerData,
          confidence: 90
        });
      }
    } catch (error) {
      console.log(`Screener data fetch failed for ${symbol}`);
    }
    
    // Source 3: MoneyControl
    try {
      const moneyControlData = await this.fetchFromMoneyControl(symbol);
      if (moneyControlData) {
        sources.push({
          name: 'MoneyControl',
          data: moneyControlData,
          confidence: 85
        });
      }
    } catch (error) {
      console.log(`MoneyControl data fetch failed for ${symbol}`);
    }
    
    // Source 4: Yahoo Finance (backup)
    try {
      const yahooData = await this.fetchFromYahoo(symbol);
      if (yahooData) {
        sources.push({
          name: 'Yahoo Finance',
          data: yahooData,
          confidence: 80
        });
      }
    } catch (error) {
      console.log(`Yahoo Finance data fetch failed for ${symbol}`);
    }
    
    return sources;
  }
  
  private async fetchFromNSE(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`https://www.nseindia.com/api/quote-equity?symbol=${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 5000
      });
      
      if (response.data && response.data.priceInfo) {
        const data = response.data;
        return {
          currentPrice: data.priceInfo.lastPrice,
          marketCap: data.marketDeptOrderBook?.totalMarketCap,
          pe: data.metadata?.pe,
          pb: data.metadata?.pb,
          eps: data.metadata?.eps
        };
      }
    } catch (error) {
      console.log(`NSE API error for ${symbol}:`, String(error));
    }
    return null;
  }
  
  private async fetchFromScreener(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`https://www.screener.in/company/${symbol}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      
      const html = response.data;
      const extracted = this.extractScreenerData(html);
      return extracted;
    } catch (error) {
      console.log(`Screener error for ${symbol}:`, String(error));
    }
    return null;
  }
  
  private async fetchFromMoneyControl(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`https://www.moneycontrol.com/india/stockpricequote/${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      
      const html = response.data;
      const extracted = this.extractMoneyControlData(html);
      return extracted;
    } catch (error) {
      console.log(`MoneyControl error for ${symbol}:`, String(error));
    }
    return null;
  }
  
  private async fetchFromYahoo(symbol: string): Promise<any> {
    try {
      const yahooSymbol = `${symbol}.NS`;
      const response = await axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryDetail,financialData`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      
      if (response.data && response.data.quoteSummary) {
        const data = response.data.quoteSummary.result[0];
        const summary = data.summaryDetail;
        const financial = data.financialData;
        
        return {
          currentPrice: summary?.regularMarketPrice?.raw,
          marketCap: summary?.marketCap?.raw,
          pe: summary?.trailingPE?.raw,
          pb: summary?.priceToBook?.raw,
          eps: financial?.trailingEps?.raw,
          profitMargin: financial?.profitMargins?.raw,
          roe: financial?.returnOnEquity?.raw,
          debtToEquity: financial?.debtToEquity?.raw
        };
      }
    } catch (error) {
      console.log(`Yahoo Finance error for ${symbol}:`, String(error));
    }
    return null;
  }
  
  private extractScreenerData(html: string): any {
    const data: any = {};
    
    // Extract current price
    const priceMatch = html.match(/Current Price[^>]*>[\s]*₹?([0-9,]+\.?[0-9]*)/i);
    if (priceMatch) {
      data.currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Extract market cap
    const marketCapMatch = html.match(/Market Cap[^>]*>[\s]*₹?([0-9,]+\.?[0-9]*)/i);
    if (marketCapMatch) {
      data.marketCap = parseFloat(marketCapMatch[1].replace(/,/g, '')) * 10000000; // Convert to actual value
    }
    
    // Extract PE ratio
    const peMatch = html.match(/Stock P\/E[^>]*>[\s]*([0-9]+\.?[0-9]*)/i);
    if (peMatch) {
      data.pe = parseFloat(peMatch[1]);
    }
    
    // Extract ROE
    const roeMatch = html.match(/ROE[^>]*>[\s]*([0-9]+\.?[0-9]*)%/i);
    if (roeMatch) {
      data.roe = parseFloat(roeMatch[1]) / 100;
    }
    
    return data;
  }
  
  private extractMoneyControlData(html: string): any {
    const data: any = {};
    
    // Extract current price
    const priceMatch = html.match(/class="pcnstn"[^>]*>[\s]*([0-9,]+\.?[0-9]*)/i);
    if (priceMatch) {
      data.currentPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Extract PE ratio
    const peMatch = html.match(/P\/E Ratio[^>]*>[\s]*([0-9]+\.?[0-9]*)/i);
    if (peMatch) {
      data.pe = parseFloat(peMatch[1]);
    }
    
    return data;
  }
  
  verifyMetrics(sources: FinancialSource[]): { [key: string]: VerifiedData } {
    const verifiedData: { [key: string]: VerifiedData } = {};
    const metrics = ['currentPrice', 'marketCap', 'pe', 'pb', 'roe', 'eps', 'profitMargin', 'debtToEquity'];
    
    for (const metric of metrics) {
      const values: { value: number; source: string; confidence: number }[] = [];
      
      // Collect values from all sources
      for (const source of sources) {
        if (source.data[metric] && !isNaN(source.data[metric])) {
          values.push({
            value: source.data[metric],
            source: source.name,
            confidence: source.confidence
          });
        }
      }
      
      if (values.length >= 2) { // Need at least 2 sources
        const verification = this.calculateVariance(values);
        verifiedData[metric] = verification;
      }
    }
    
    return verifiedData;
  }
  
  private calculateVariance(values: { value: number; source: string; confidence: number }[]): VerifiedData {
    if (values.length < 2) {
      return {
        metric: '',
        value: 0,
        variance: 1,
        sources: [],
        verified: false
      };
    }
    
    // Sort by confidence (highest first)
    values.sort((a, b) => b.confidence - a.confidence);
    
    // Calculate weighted average
    const totalWeight = values.reduce((sum, v) => sum + v.confidence, 0);
    const weightedSum = values.reduce((sum, v) => sum + (v.value * v.confidence), 0);
    const weightedAverage = weightedSum / totalWeight;
    
    // Calculate maximum variance
    const maxVariance = Math.max(...values.map(v => Math.abs(v.value - weightedAverage) / weightedAverage));
    
    return {
      metric: '',
      value: Math.round(weightedAverage * 100) / 100,
      variance: maxVariance,
      sources: values.map(v => v.source),
      verified: maxVariance <= this.VARIANCE_THRESHOLD
    };
  }
  
  async getVerifiedFinancialData(symbol: string): Promise<{ [key: string]: VerifiedData }> {
    console.log(`Cross-verifying financial data for ${symbol} across multiple sources...`);
    
    const sources = await this.fetchFromMultipleSources(symbol);
    
    if (sources.length < 2) {
      console.log(`Insufficient sources for ${symbol} - need at least 2 sources for verification`);
      return {};
    }
    
    const verifiedData = this.verifyMetrics(sources);
    
    // Log verification results
    for (const [metric, data] of Object.entries(verifiedData)) {
      if (data.verified) {
        console.log(`✓ ${metric}: ${data.value} (verified across ${data.sources.join(', ')} - variance: ${(data.variance * 100).toFixed(1)}%)`);
      } else {
        console.log(`✗ ${metric}: Variance ${(data.variance * 100).toFixed(1)}% exceeds 5% threshold - sources disagree: ${data.sources.join(', ')}`);
      }
    }
    
    return verifiedData;
  }
}

export const dataVerification = new DataVerificationService();