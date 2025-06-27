// Comprehensive testing system for 20 major Indian stocks
// Tests GPT-powered financial data extraction with authentic metrics

import { financialDataProvider } from './financialDataProvider.js';

interface TestResult {
  symbol: string;
  success: boolean;
  price?: number;
  pe?: number;
  marketCap?: number;
  roe?: number;
  sector?: string;
  source?: string;
  error?: string;
}

export class StockTester {
  // Top 20 Indian stocks by market cap for comprehensive testing
  private readonly testStocks = [
    'TCS',      // IT Services
    'RELIANCE', // Oil & Gas
    'HDFCBANK', // Banking
    'INFY',     // IT Services
    'ICICIBANK',// Banking
    'HINDUNILVR', // FMCG
    'ITC',      // FMCG
    'SBIN',     // Banking
    'BHARTIARTL', // Telecom
    'KOTAKBANK', // Banking
    'LT',       // Engineering
    'ASIANPAINT', // Paints
    'HCLTECH',  // IT Services
    'AXISBANK', // Banking
    'MARUTI',   // Automobiles
    'SUNPHARMA', // Pharmaceuticals
    'TITAN',    // Consumer Discretionary
    'ULTRACEMCO', // Cement
    'WIPRO',    // IT Services
    'NESTLEIND' // FMCG
  ];

  async testAllStocks(): Promise<{ results: TestResult[], summary: any }> {
    console.log('Starting comprehensive 20-stock testing with GPT-powered financial data extraction...');
    
    const results: TestResult[] = [];
    let successCount = 0;
    let totalPrice = 0;
    let totalPE = 0;
    let peCount = 0;
    const sectors: { [key: string]: number } = {};

    for (const symbol of this.testStocks) {
      try {
        console.log(`Testing ${symbol}...`);
        const data = await financialDataProvider.getFinancialData(symbol);
        
        if (data && data.currentPrice) {
          results.push({
            symbol,
            success: true,
            price: data.currentPrice,
            pe: data.pe,
            marketCap: data.marketCap,
            roe: data.roe,
            sector: data.sector,
            source: data.source
          });
          
          successCount++;
          totalPrice += data.currentPrice;
          
          if (data.pe && data.pe > 0) {
            totalPE += data.pe;
            peCount++;
          }
          
          if (data.sector) {
            sectors[data.sector] = (sectors[data.sector] || 0) + 1;
          }
        } else {
          results.push({
            symbol,
            success: false,
            error: 'No financial data available'
          });
        }
      } catch (error) {
        results.push({
          symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = {
      totalStocks: this.testStocks.length,
      successfulTests: successCount,
      successRate: `${((successCount / this.testStocks.length) * 100).toFixed(1)}%`,
      averagePrice: totalPrice > 0 ? `₹${(totalPrice / successCount).toFixed(2)}` : 'N/A',
      averagePE: peCount > 0 ? (totalPE / peCount).toFixed(2) : 'N/A',
      sectorsFound: Object.keys(sectors).length,
      sectorBreakdown: sectors
    };

    console.log('20-Stock Testing Complete!');
    console.log(`Success Rate: ${summary.successRate}`);
    console.log(`Average Price: ${summary.averagePrice}`);
    console.log(`Average PE: ${summary.averagePE}`);
    console.log(`Sectors: ${Object.keys(sectors).join(', ')}`);

    return { results, summary };
  }

  async testSpecificStocks(symbols: string[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const symbol of symbols) {
      try {
        const data = await financialDataProvider.getFinancialData(symbol);
        
        if (data) {
          results.push({
            symbol,
            success: true,
            price: data.currentPrice,
            pe: data.pe,
            marketCap: data.marketCap,
            roe: data.roe,
            sector: data.sector,
            source: data.source
          });
        } else {
          results.push({
            symbol,
            success: false,
            error: 'No data available'
          });
        }
      } catch (error) {
        results.push({
          symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  async validateDataQuality(symbol: string): Promise<{
    symbol: string;
    hasPrice: boolean;
    hasValuation: boolean;
    hasFinancials: boolean;
    hasSector: boolean;
    qualityScore: number;
    details: any;
  }> {
    const data = await financialDataProvider.getFinancialData(symbol);
    
    if (!data) {
      return {
        symbol,
        hasPrice: false,
        hasValuation: false,
        hasFinancials: false,
        hasSector: false,
        qualityScore: 0,
        details: null
      };
    }

    const hasPrice = !!data.currentPrice && data.currentPrice > 0;
    const hasValuation = !!(data.pe && data.pe > 0) || !!(data.pb && data.pb > 0);
    const hasFinancials = !!(data.roe && data.roe > 0) || !!(data.profitMargin && data.profitMargin > 0);
    const hasSector = !!data.sector;

    const qualityScore = [hasPrice, hasValuation, hasFinancials, hasSector]
      .reduce((score, hasData) => score + (hasData ? 25 : 0), 0);

    return {
      symbol,
      hasPrice,
      hasValuation,
      hasFinancials,
      hasSector,
      qualityScore,
      details: data
    };
  }
}

export const stockTester = new StockTester();