import axios from 'axios';

interface FinancialMetrics {
  marketCap: number;
  netProfit?: number;
  lastQuarterProfit?: number;
  yearOverYearGrowth?: number;
  sector: string;
  symbol: string;
}

interface CalculatedPE {
  currentPE: number;
  projectedPE: number;
  calculationMethod: string;
  basedOnPeriod: string;
}

export class PERatioCalculator {
  
  // Sector-specific multipliers for quarterly extrapolation
  private sectorMultipliers: { [key: string]: number } = {
    'asset_management': 4.0,     // Simple quarterly x4
    'banking': 4.0,              // Financial services - quarterly x4
    'insurance': 4.0,            // Insurance - quarterly x4
    'pharmaceuticals': 3.8,      // Pharma - slight seasonality
    'technology': 3.9,           // Tech - some seasonality
    'fmcg': 3.5,                 // Consumer goods - high seasonality
    'textiles': 3.2,             // Apparel - very seasonal
    'ice_cream': 2.8,            // Ice cream - extreme seasonality
    'air_conditioning': 3.0,     // AC - seasonal
    'automobiles': 3.6,          // Auto - moderate seasonality
    'steel': 3.8,                // Steel - some cyclicality
    'cement': 3.7,               // Cement - moderate seasonality
    'oil_gas': 3.9,              // Oil & Gas - some seasonality
    'real_estate': 3.5,          // Real estate - seasonal
    'retail': 3.4,               // Retail - seasonal
    'default': 3.8               // Default multiplier
  };

  private categorizeCompanySector(symbol: string, businessDescription?: string): string {
    const symbolLower = symbol.toLowerCase();
    
    // Asset Management companies
    if (symbolLower.includes('amc') || symbolLower.includes('mutual') || 
        symbolLower.includes('asset') || symbolLower.includes('wealth')) {
      return 'asset_management';
    }
    
    // Banking and Financial Services
    if (symbolLower.includes('bank') || symbolLower.includes('hdfc') || 
        symbolLower.includes('icici') || symbolLower.includes('sbi') ||
        symbolLower.includes('axis') || symbolLower.includes('kotak')) {
      return 'banking';
    }
    
    // Insurance
    if (symbolLower.includes('insurance') || symbolLower.includes('life') ||
        symbolLower.includes('general') || symbolLower.includes('lic')) {
      return 'insurance';
    }
    
    // Technology
    if (symbolLower.includes('tech') || symbolLower.includes('infy') ||
        symbolLower.includes('tcs') || symbolLower.includes('wipro') ||
        symbolLower.includes('hcl') || symbolLower.includes('software')) {
      return 'technology';
    }
    
    // Pharmaceuticals
    if (symbolLower.includes('pharma') || symbolLower.includes('reddy') ||
        symbolLower.includes('cipla') || symbolLower.includes('sun') ||
        symbolLower.includes('lupin') || symbolLower.includes('biocon')) {
      return 'pharmaceuticals';
    }
    
    // FMCG
    if (symbolLower.includes('unilever') || symbolLower.includes('hul') ||
        symbolLower.includes('nestle') || symbolLower.includes('britannia') ||
        symbolLower.includes('dabur') || symbolLower.includes('marico')) {
      return 'fmcg';
    }
    
    // Textiles and Apparel
    if (symbolLower.includes('textile') || symbolLower.includes('apparel') ||
        symbolLower.includes('garment') || symbolLower.includes('fashion')) {
      return 'textiles';
    }
    
    // Automobiles
    if (symbolLower.includes('maruti') || symbolLower.includes('tata') ||
        symbolLower.includes('mahindra') || symbolLower.includes('bajaj') ||
        symbolLower.includes('hero') || symbolLower.includes('auto')) {
      return 'automobiles';
    }
    
    // Steel and Metals
    if (symbolLower.includes('steel') || symbolLower.includes('jsw') ||
        symbolLower.includes('tata') || symbolLower.includes('hindalco') ||
        symbolLower.includes('vedanta') || symbolLower.includes('metal')) {
      return 'steel';
    }
    
    // Cement
    if (symbolLower.includes('cement') || symbolLower.includes('acc') ||
        symbolLower.includes('ambuja') || symbolLower.includes('ultratech')) {
      return 'cement';
    }
    
    // Oil and Gas
    if (symbolLower.includes('oil') || symbolLower.includes('ongc') ||
        symbolLower.includes('reliance') || symbolLower.includes('gas') ||
        symbolLower.includes('petrol') || symbolLower.includes('refinery')) {
      return 'oil_gas';
    }
    
    // Real Estate
    if (symbolLower.includes('realty') || symbolLower.includes('real') ||
        symbolLower.includes('properties') || symbolLower.includes('housing')) {
      return 'real_estate';
    }
    
    // Retail
    if (symbolLower.includes('retail') || symbolLower.includes('mall') ||
        symbolLower.includes('store') || symbolLower.includes('shopping')) {
      return 'retail';
    }
    
    return 'default';
  }

  private async fetchQuarterlyGrowthData(symbol: string): Promise<number> {
    try {
      // Try to get YoY quarterly growth from screener.in or other sources
      const response = await axios.get(`https://www.screener.in/api/company/${symbol}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      
      if (response.data && response.data.quarterly_growth) {
        return response.data.quarterly_growth / 100; // Convert percentage to decimal
      }
    } catch (error) {
      console.log(`Could not fetch quarterly growth for ${symbol}`);
    }
    
    // Default growth assumptions by sector if no data available
    const sector = this.categorizeCompanySector(symbol);
    const defaultGrowth: { [key: string]: number } = {
      'technology': 0.15,          // 15% growth
      'pharmaceuticals': 0.12,     // 12% growth
      'banking': 0.18,             // 18% growth
      'asset_management': 0.20,    // 20% growth
      'fmcg': 0.10,                // 10% growth
      'automobiles': 0.08,         // 8% growth
      'steel': 0.05,               // 5% growth
      'oil_gas': 0.03,             // 3% growth
      'default': 0.10              // 10% default
    };
    
    return defaultGrowth[sector] || 0.10;
  }

  async calculatePE(metrics: FinancialMetrics): Promise<CalculatedPE> {
    const sector = this.categorizeCompanySector(metrics.symbol);
    const multiplier = this.sectorMultipliers[sector] || this.sectorMultipliers.default;
    
    let currentPE = 0;
    let projectedPE = 0;
    let calculationMethod = '';
    let basedOnPeriod = '';
    
    // Method 1: Use existing PE if available
    if (metrics.netProfit && metrics.netProfit > 0) {
      currentPE = metrics.marketCap / metrics.netProfit;
      calculationMethod = 'Market Cap ÷ Annual Net Profit';
      basedOnPeriod = 'Last Financial Year';
      
      // Calculate projected PE with growth
      const growthRate = await this.fetchQuarterlyGrowthData(metrics.symbol);
      const projectedProfit = metrics.netProfit * (1 + growthRate);
      projectedPE = metrics.marketCap / projectedProfit;
    }
    
    // Method 2: Extrapolate from quarterly data
    else if (metrics.lastQuarterProfit && metrics.lastQuarterProfit > 0) {
      let annualizedProfit: number;
      
      if (sector === 'asset_management' || sector === 'banking' || sector === 'insurance') {
        // Simple quarterly multiplication for financial services
        annualizedProfit = metrics.lastQuarterProfit * 4;
        calculationMethod = `Last Quarter Profit × 4 (${sector} sector)`;
        basedOnPeriod = 'Last Quarter Annualized';
      } else {
        // Sector-specific seasonal adjustment
        const growthRate = await this.fetchQuarterlyGrowthData(metrics.symbol);
        const baseAnnualized = metrics.lastQuarterProfit * multiplier;
        annualizedProfit = baseAnnualized * (1 + growthRate);
        
        calculationMethod = `Last Quarter × ${multiplier} × (1 + ${(growthRate * 100).toFixed(1)}% growth)`;
        basedOnPeriod = 'Last Quarter with Sector & Growth Adjustment';
      }
      
      currentPE = metrics.marketCap / annualizedProfit;
      
      // Projected PE with additional growth
      const additionalGrowth = await this.fetchQuarterlyGrowthData(metrics.symbol);
      const futureProfit = annualizedProfit * (1 + additionalGrowth);
      projectedPE = metrics.marketCap / futureProfit;
    }
    
    // Method 3: Industry average if no profit data
    else {
      const industryPE: { [key: string]: number } = {
        'technology': 25,
        'banking': 12,
        'pharmaceuticals': 20,
        'fmcg': 35,
        'automobiles': 15,
        'steel': 8,
        'oil_gas': 10,
        'asset_management': 18,
        'default': 18
      };
      
      currentPE = industryPE[sector] || industryPE.default;
      projectedPE = currentPE * 0.9; // Assume some improvement
      calculationMethod = `Industry Average PE for ${sector} sector`;
      basedOnPeriod = 'Industry Benchmark';
    }
    
    return {
      currentPE: Math.round(currentPE * 10) / 10,
      projectedPE: Math.round(projectedPE * 10) / 10,
      calculationMethod,
      basedOnPeriod
    };
  }

  // Calculate PE from market cap and profit
  static calculateSimplePE(marketCap: number, annualProfit: number): number {
    if (annualProfit <= 0) return 0;
    return Math.round((marketCap / annualProfit) * 10) / 10;
  }

  // Get sector-specific insights
  getSectorInsights(sector: string): string {
    const insights: { [key: string]: string } = {
      'asset_management': 'Asset management companies have predictable quarterly earnings. Q4 is typically strongest due to year-end flows.',
      'banking': 'Banking sector shows consistent quarterly patterns. Credit growth and NIM expansion drive profitability.',
      'fmcg': 'FMCG companies are highly seasonal. Q3 (Oct-Dec) is strongest due to festive demand.',
      'textiles': 'Textile sector is extremely seasonal. Q3-Q4 are peak seasons for winter and wedding clothing.',
      'ice_cream': 'Ice cream businesses are highly seasonal. Q1 (Apr-Jun) generates 40-50% of annual profits.',
      'automobiles': 'Auto sector shows moderate seasonality. Q3-Q4 are stronger due to festive buying.',
      'technology': 'IT services show minimal seasonality but Q4 tends to be stronger due to client budget cycles.',
      'pharmaceuticals': 'Pharma sector is relatively stable but Q3 can be weaker due to monsoon-related issues.',
      'default': 'Most sectors show some seasonal variation. Q3-Q4 are typically stronger quarters.'
    };
    
    return insights[sector] || insights.default;
  }
}

export const peRatioCalculator = new PERatioCalculator();