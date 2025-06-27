// Comprehensive testing system for 20 major Indian stocks
// Tests multiple financial data providers and validates authentic data extraction

interface StockTestResult {
  symbol: string;
  status: 'success' | 'partial' | 'failed';
  dataProvider: string | null;
  metricsFound: number;
  currentPrice: number | null;
  pe: number | null;
  marketCap: number | null;
  hasFinancials: boolean;
  error?: string;
}

export class StockTester {
  private testStocks = [
    'TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'ITC', 'SBIN', 'BAJFINANCE', 'BHARTIARTL',
    'ASIANPAINT', 'MARUTI', 'KOTAKBANK', 'LT', 'AXISBANK',
    'NESTLEIND', 'HDFC', 'WIPRO', 'ULTRACEMCO', 'TITAN'
  ];

  async testAllStocks(): Promise<{ 
    summary: any; 
    results: StockTestResult[]; 
    recommendations: string[] 
  }> {
    console.log('Starting comprehensive test of 20 major Indian stocks...');
    
    const results: StockTestResult[] = [];
    let successCount = 0;
    let partialCount = 0;
    let failureCount = 0;

    for (const symbol of this.testStocks) {
      try {
        console.log(`\n=== Testing ${symbol} ===`);
        const result = await this.testStock(symbol);
        results.push(result);

        if (result.status === 'success') {
          successCount++;
          console.log(`✅ ${symbol}: SUCCESS - ${result.dataProvider} (${result.metricsFound} metrics)`);
        } else if (result.status === 'partial') {
          partialCount++;
          console.log(`⚠️ ${symbol}: PARTIAL - ${result.dataProvider} (${result.metricsFound} metrics)`);
        } else {
          failureCount++;
          console.log(`❌ ${symbol}: FAILED - ${result.error}`);
        }

        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          symbol,
          status: 'failed',
          dataProvider: null,
          metricsFound: 0,
          currentPrice: null,
          pe: null,
          marketCap: null,
          hasFinancials: false,
          error: errorMessage
        });
        failureCount++;
        console.log(`❌ ${symbol}: ERROR - ${errorMessage}`);
      }
    }

    const summary = {
      totalStocks: this.testStocks.length,
      successful: successCount,
      partial: partialCount,
      failed: failureCount,
      successRate: `${((successCount / this.testStocks.length) * 100).toFixed(1)}%`,
      partialRate: `${((partialCount / this.testStocks.length) * 100).toFixed(1)}%`,
      totalDataPoints: results.reduce((sum, r) => sum + r.metricsFound, 0),
      avgMetricsPerStock: results.length > 0 ? (results.reduce((sum, r) => sum + r.metricsFound, 0) / results.length).toFixed(1) : 0
    };

    const recommendations = this.generateRecommendations(results, summary);

    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`Total stocks: ${summary.totalStocks}`);
    console.log(`Success rate: ${summary.successRate}`);
    console.log(`Average metrics per stock: ${summary.avgMetricsPerStock}`);

    return { summary, results, recommendations };
  }

  private async testStock(symbol: string): Promise<StockTestResult> {
    const { financialDataProvider } = await import('./financialDataProvider');
    
    const data = await financialDataProvider.getFinancialData(symbol);
    
    if (!data) {
      return {
        symbol,
        status: 'failed',
        dataProvider: null,
        metricsFound: 0,
        currentPrice: null,
        pe: null,
        marketCap: null,
        hasFinancials: false,
        error: 'No data from any provider'
      };
    }

    const metricsCount = Object.keys(data).filter(key => 
      key !== 'symbol' && key !== 'source' && key !== 'lastUpdated' && 
      data[key as keyof typeof data] !== null && data[key as keyof typeof data] !== undefined
    ).length;

    const hasFinancials = !!(data.pe || data.marketCap || data.eps || data.roe);
    const status = metricsCount >= 5 && hasFinancials ? 'success' : 
                   metricsCount >= 2 ? 'partial' : 'failed';

    return {
      symbol,
      status,
      dataProvider: data.source,
      metricsFound: metricsCount,
      currentPrice: data.currentPrice || null,
      pe: data.pe || null,
      marketCap: data.marketCap || null,
      hasFinancials,
    };
  }

  private generateRecommendations(results: StockTestResult[], summary: any): string[] {
    const recommendations: string[] = [];
    
    const providers = results.filter(r => r.dataProvider).map(r => r.dataProvider);
    const providerCounts = providers.reduce((acc: any, provider) => {
      acc[provider!] = (acc[provider!] || 0) + 1;
      return acc;
    }, {});

    const bestProvider = Object.entries(providerCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    if (bestProvider) {
      recommendations.push(`Primary data source: ${bestProvider[0]} (${bestProvider[1]} stocks)`);
    }

    if (summary.successRate < 50) {
      recommendations.push('Consider obtaining premium API keys (Alpha Vantage, FMP) for better data coverage');
    }

    const failedStocks = results.filter(r => r.status === 'failed').map(r => r.symbol);
    if (failedStocks.length > 0) {
      recommendations.push(`Manual data entry needed for: ${failedStocks.slice(0, 5).join(', ')}${failedStocks.length > 5 ? '...' : ''}`);
    }

    if (results.some(r => r.hasFinancials)) {
      recommendations.push('Financial metrics available - can generate comprehensive investment analysis');
    } else {
      recommendations.push('Limited financial data - recommend upgrading to premium data providers');
    }

    return recommendations;
  }

  async testConferenceCallData(): Promise<any> {
    console.log('Testing NSE conference call data extraction...');
    
    // Test NSE corporate announcements for a few stocks
    const testSymbols = ['TCS', 'RELIANCE', 'HDFCBANK'];
    const results = [];

    for (const symbol of testSymbols) {
      try {
        // NSE Corporate Actions API test
        const response = await fetch(`https://www.nseindia.com/api/corporate-actions?index=equities&symbol=${symbol}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ symbol, status: 'success', dataFound: !!data });
          console.log(`✅ NSE data for ${symbol}: Available`);
        } else {
          results.push({ symbol, status: 'failed', error: `HTTP ${response.status}` });
          console.log(`❌ NSE data for ${symbol}: Failed (${response.status})`);
        }
      } catch (error) {
        results.push({ symbol, status: 'error', error: 'Network error' });
        console.log(`❌ NSE data for ${symbol}: Network error`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }

    return results;
  }
}

export const stockTester = new StockTester();