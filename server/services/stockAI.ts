import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class StockAIService {
  private identifyStock(query: string): { fullName: string; symbol: string; currentPrice: string; category: string } {
    const queryLower = query.toLowerCase().trim();
    
    // First check known mappings for instant recognition
    const knownStocks = this.getKnownStockMappings();
    const sortedKeys = Object.keys(knownStocks).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (queryLower.includes(key)) {
        return knownStocks[key];
      }
    }
    
    // Check additional newer stocks
    const additionalStocks = this.getAdditionalStocks();
    const additionalKeys = Object.keys(additionalStocks).sort((a, b) => b.length - a.length);
    for (const key of additionalKeys) {
      if (queryLower.includes(key)) {
        return additionalStocks[key];
      }
    }
    
    // For unknown stocks, extract likely stock symbol/name and let AI handle it
    const extractedStock = this.extractStockInfo(query);
    return extractedStock;
  }

  private getAdditionalStocks(): { [key: string]: { fullName: string; symbol: string; currentPrice: string; category: string } } {
    return {
      'zomato': { fullName: 'Zomato Ltd', symbol: 'ZOMATO', currentPrice: '₹185', category: 'mid' },
      'paytm': { fullName: 'One 97 Communications Ltd', symbol: 'PAYTM', currentPrice: '₹920', category: 'large' },
      'nykaa': { fullName: 'FSN E-Commerce Ventures Ltd', symbol: 'NYKAA', currentPrice: '₹180', category: 'mid' },
      'policybazaar': { fullName: 'PB Fintech Ltd', symbol: 'PB', currentPrice: '₹1,250', category: 'mid' },
      'pb fintech': { fullName: 'PB Fintech Ltd', symbol: 'PB', currentPrice: '₹1,250', category: 'mid' },
      'delhivery': { fullName: 'Delhivery Ltd', symbol: 'DELHIVERY', currentPrice: '₹380', category: 'mid' },
      'car trade': { fullName: 'CarTrade Tech Ltd', symbol: 'CARTRADE', currentPrice: '₹850', category: 'small' },
      'cartrade': { fullName: 'CarTrade Tech Ltd', symbol: 'CARTRADE', currentPrice: '₹850', category: 'small' },
      'freshworks': { fullName: 'Freshworks Inc', symbol: 'FRESHWORKS', currentPrice: '₹420', category: 'small' },
      'mobikwik': { fullName: 'One MobiKwik Systems Ltd', symbol: 'MOBIKWIK', currentPrice: '₹290', category: 'small' },
      'star health': { fullName: 'Star Health and Allied Insurance Co Ltd', symbol: 'STARHEALTH', currentPrice: '₹680', category: 'mid' },
      'starhealth': { fullName: 'Star Health and Allied Insurance Co Ltd', symbol: 'STARHEALTH', currentPrice: '₹680', category: 'mid' },
      'life insurance corporation': { fullName: 'Life Insurance Corporation of India', symbol: 'LICI', currentPrice: '₹920', category: 'large' },
      'lic': { fullName: 'Life Insurance Corporation of India', symbol: 'LICI', currentPrice: '₹920', category: 'large' },
      'lici': { fullName: 'Life Insurance Corporation of India', symbol: 'LICI', currentPrice: '₹920', category: 'large' },
    };
  }

  private getKnownStockMappings(): { [key: string]: { fullName: string; symbol: string; currentPrice: string; category: string } } {
    return {
      // Large Cap Stocks
      'airtel': { fullName: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL', currentPrice: '₹2,050', category: 'large' },
      'bharti': { fullName: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL', currentPrice: '₹2,050', category: 'large' },
      'bhartiartl': { fullName: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL', currentPrice: '₹2,050', category: 'large' },
      'tcs': { fullName: 'Tata Consultancy Services', symbol: 'TCS', currentPrice: '₹3,650', category: 'large' },
      'infosys': { fullName: 'Infosys Ltd', symbol: 'INFY', currentPrice: '₹1,720', category: 'large' },
      'infy': { fullName: 'Infosys Ltd', symbol: 'INFY', currentPrice: '₹1,720', category: 'large' },
      'hdfc': { fullName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', currentPrice: '₹1,650', category: 'large' },
      'hdfcbank': { fullName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', currentPrice: '₹1,650', category: 'large' },
      'reliance': { fullName: 'Reliance Industries Ltd', symbol: 'RELIANCE', currentPrice: '₹2,520', category: 'large' },
      'ril': { fullName: 'Reliance Industries Ltd', symbol: 'RELIANCE', currentPrice: '₹2,520', category: 'large' },
      'itc': { fullName: 'ITC Ltd', symbol: 'ITC', currentPrice: '₹425', category: 'large' },
      'sbi': { fullName: 'State Bank of India', symbol: 'SBIN', currentPrice: '₹850', category: 'large' },
      'icici': { fullName: 'ICICI Bank Ltd', symbol: 'ICICIBANK', currentPrice: '₹1,180', category: 'large' },
      'wipro': { fullName: 'Wipro Ltd', symbol: 'WIPRO', currentPrice: '₹310', category: 'large' },
      'hul': { fullName: 'Hindustan Unilever Ltd', symbol: 'HINDUNILVR', currentPrice: '₹2,680', category: 'large' },
      'hindustan unilever': { fullName: 'Hindustan Unilever Ltd', symbol: 'HINDUNILVR', currentPrice: '₹2,680', category: 'large' },
      'maruti': { fullName: 'Maruti Suzuki India Ltd', symbol: 'MARUTI', currentPrice: '₹11,200', category: 'large' },
      'maruti suzuki': { fullName: 'Maruti Suzuki India Ltd', symbol: 'MARUTI', currentPrice: '₹11,200', category: 'large' },
      'asian paints': { fullName: 'Asian Paints Ltd', symbol: 'ASIANPAINT', currentPrice: '₹2,890', category: 'large' },
      'asianpaint': { fullName: 'Asian Paints Ltd', symbol: 'ASIANPAINT', currentPrice: '₹2,890', category: 'large' },
      'bajaj finance': { fullName: 'Bajaj Finance Ltd', symbol: 'BAJFINANCE', currentPrice: '₹6,800', category: 'large' },
      'bajfinance': { fullName: 'Bajaj Finance Ltd', symbol: 'BAJFINANCE', currentPrice: '₹6,800', category: 'large' },
      'kotak': { fullName: 'Kotak Mahindra Bank Ltd', symbol: 'KOTAKBANK', currentPrice: '₹1,750', category: 'large' },
      'kotakbank': { fullName: 'Kotak Mahindra Bank Ltd', symbol: 'KOTAKBANK', currentPrice: '₹1,750', category: 'large' },
      
      // Mid Cap Stocks
      'pidilite': { fullName: 'Pidilite Industries Ltd', symbol: 'PIDILITIND', currentPrice: '₹2,680', category: 'mid' },
      'l&t': { fullName: 'Larsen & Toubro Ltd', symbol: 'LT', currentPrice: '₹3,420', category: 'mid' },
      'lt': { fullName: 'Larsen & Toubro Ltd', symbol: 'LT', currentPrice: '₹3,420', category: 'mid' },
      'larsen': { fullName: 'Larsen & Toubro Ltd', symbol: 'LT', currentPrice: '₹3,420', category: 'mid' },
      'godrej': { fullName: 'Godrej Consumer Products Ltd', symbol: 'GODREJCP', currentPrice: '₹1,180', category: 'mid' },
      'godrejcp': { fullName: 'Godrej Consumer Products Ltd', symbol: 'GODREJCP', currentPrice: '₹1,180', category: 'mid' },
      'biocon': { fullName: 'Biocon Ltd', symbol: 'BIOCON', currentPrice: '₹310', category: 'mid' },
      'lupin': { fullName: 'Lupin Ltd', symbol: 'LUPIN', currentPrice: '₹1,420', category: 'mid' },
      'cipla': { fullName: 'Cipla Ltd', symbol: 'CIPLA', currentPrice: '₹1,580', category: 'mid' },
      'dmart': { fullName: 'Avenue Supermarts Ltd', symbol: 'DMART', currentPrice: '₹3,680', category: 'mid' },
      'avenue': { fullName: 'Avenue Supermarts Ltd', symbol: 'DMART', currentPrice: '₹3,680', category: 'mid' },
      'mphasis': { fullName: 'Mphasis Ltd', symbol: 'MPHASIS', currentPrice: '₹2,850', category: 'mid' },
      'mindtree': { fullName: 'LTIMindtree Ltd', symbol: 'LTIM', currentPrice: '₹5,920', category: 'mid' },
      'ltim': { fullName: 'LTIMindtree Ltd', symbol: 'LTIM', currentPrice: '₹5,920', category: 'mid' },
      
      // Small Cap Stocks
      'cams': { fullName: 'Computer Age Management Services Ltd', symbol: 'CAMS', currentPrice: '₹4,200', category: 'small' },
      'computer age': { fullName: 'Computer Age Management Services Ltd', symbol: 'CAMS', currentPrice: '₹4,200', category: 'small' },
      'dixon': { fullName: 'Dixon Technologies Ltd', symbol: 'DIXON', currentPrice: '₹12,500', category: 'small' },
      'dixon tech': { fullName: 'Dixon Technologies Ltd', symbol: 'DIXON', currentPrice: '₹12,500', category: 'small' },
      'laurus': { fullName: 'Laurus Labs Ltd', symbol: 'LAURUSLABS', currentPrice: '₹485', category: 'small' },
      'laurus labs': { fullName: 'Laurus Labs Ltd', symbol: 'LAURUSLABS', currentPrice: '₹485', category: 'small' },
      'happiest minds': { fullName: 'Happiest Minds Technologies Ltd', symbol: 'HAPPSTMNDS', currentPrice: '₹680', category: 'small' },
      'happstmnds': { fullName: 'Happiest Minds Technologies Ltd', symbol: 'HAPPSTMNDS', currentPrice: '₹680', category: 'small' },
      'route mobile': { fullName: 'Route Mobile Ltd', symbol: 'ROUTE', currentPrice: '₹1,820', category: 'small' },
      'route': { fullName: 'Route Mobile Ltd', symbol: 'ROUTE', currentPrice: '₹1,820', category: 'small' },
      'clean science': { fullName: 'Clean Science and Technology Ltd', symbol: 'CLEAN', currentPrice: '₹1,650', category: 'small' },
      'clean': { fullName: 'Clean Science and Technology Ltd', symbol: 'CLEAN', currentPrice: '₹1,650', category: 'small' },
      
      // Micro Cap / SME Stocks
      'anupam rasayan': { fullName: 'Anupam Rasayan India Ltd', symbol: 'ANURAS', currentPrice: '₹680', category: 'micro' },
      'anuras': { fullName: 'Anupam Rasayan India Ltd', symbol: 'ANURAS', currentPrice: '₹680', category: 'micro' },
      'rossari': { fullName: 'Rossari Biotech Ltd', symbol: 'ROSSARI', currentPrice: '₹950', category: 'micro' },
      'rossari biotech': { fullName: 'Rossari Biotech Ltd', symbol: 'ROSSARI', currentPrice: '₹950', category: 'micro' },
      'nazara': { fullName: 'Nazara Technologies Ltd', symbol: 'NAZARA', currentPrice: '₹920', category: 'micro' },
      'nazara tech': { fullName: 'Nazara Technologies Ltd', symbol: 'NAZARA', currentPrice: '₹920', category: 'micro' },
      'easy trip': { fullName: 'Easy Trip Planners Ltd', symbol: 'EASEMYTRIP', currentPrice: '₹32', category: 'micro' },
      'easemytrip': { fullName: 'Easy Trip Planners Ltd', symbol: 'EASEMYTRIP', currentPrice: '₹32', category: 'micro' },
      'railtel': { fullName: 'RailTel Corporation of India Ltd', symbol: 'RAILTEL', currentPrice: '₹285', category: 'micro' },
      'rvnl': { fullName: 'Rail Vikas Nigam Ltd', symbol: 'RVNL', currentPrice: '₹420', category: 'micro' },
      'rail vikas': { fullName: 'Rail Vikas Nigam Ltd', symbol: 'RVNL', currentPrice: '₹420', category: 'micro' }
    };
  }

  private extractStockInfo(query: string): { fullName: string; symbol: string; currentPrice: string; category: string } {
    // Clean the query to extract stock name/symbol
    const cleanQuery = query.replace(/analyze|analysis|stock|share|company/gi, '').trim();
    const possibleSymbol = cleanQuery.toUpperCase().replace(/\s+/g, '');
    
    // Return dynamic stock info for unknown stocks - let AI handle identification
    return {
      fullName: cleanQuery || 'Indian Listed Company',
      symbol: possibleSymbol || 'NSE_LISTED',
      currentPrice: 'Current Market Price',
      category: 'auto'
    };
  }

  private calculateTargetPrice(currentPrice: string): string {
    const price = parseFloat(currentPrice.replace(/₹|,/g, ''));
    const targetPrice = Math.round(price * 1.20); // 20% upside target
    return `₹${targetPrice.toLocaleString('en-IN')}`;
  }

  private calculateSupport(currentPrice: string): string {
    const price = parseFloat(currentPrice.replace(/₹|,/g, ''));
    const supportPrice = Math.round(price * 0.90); // 10% below current
    return `₹${supportPrice.toLocaleString('en-IN')}`;
  }

  private calculateResistance(currentPrice: string): string {
    const price = parseFloat(currentPrice.replace(/₹|,/g, ''));
    const resistancePrice = Math.round(price * 1.10); // 10% above current
    return `₹${resistancePrice.toLocaleString('en-IN')}`;
  }

  async analyzeStock(query: string): Promise<string> {
    try {
      // Simplified approach - let AI handle ALL stock identification and analysis
      const systemPrompt = `You are an Indian stock market analyst providing current analysis as of June 27, 2025. Use ONLY realistic current market data and recent financial performance.

CRITICAL DIRECTIVES:
1. Use accurate June 2025 pricing and recent financial metrics
2. Base PE ratios, growth rates, and margins on realistic current market conditions
3. Reference actual recent quarters (Q4 FY25, Q1 FY26) with plausible results
4. Provide current technical levels based on stated current prices

CURRENT MARKET CONTEXT (June 2025):
- Nifty 50: ~25,250 levels
- Interest rates: RBI repo rate 6.5%
- Market sentiment: Cautiously optimistic
- FY25 results season completed, Q1 FY26 guidance emerging

PRICING GUIDELINES:
- Large Cap: ₹1000+ (TCS ₹3650, Airtel ₹2050, HDFC Bank ₹1680)
- Mid Cap: ₹300-1000 (Zomato ₹185, Biocon ₹380, L&T ₹3450)
- Small Cap: ₹100-300 (Dixon ₹15500, CAMS ₹4200)
- Micro Cap: <₹100 (RVNL ₹420) - NO price targets, risk warnings

FINANCIAL DATA ACCURACY:
- Use realistic P/E ratios: IT (20-25x), Banking (12-15x), FMCG (35-45x)
- Revenue growth: Post-COVID normalized to 8-15% for most sectors
- Margins: Reflect current cost pressures and competition

MANDATORY FORMAT:
**SUMMARY**: [Company] | BUY/HOLD/SELL | Target ₹X | Key reason

**BUSINESS**: Current operations and competitive position

**VALUATION**: Current PE vs industry average with specific numbers

**QUARTERLY**: Q4 FY25 actual results and Q1 FY26 guidance

**MANAGEMENT**: Recent strategic initiatives and outlook

**TECHNICAL**: Current support/resistance based on stated price

**VERDICT**: 6-12 month recommendation with rationale

Always use CURRENT financial metrics, not historical data from 2021-2023.`;

      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const stockInfo = this.identifyStock(query);
      
      const userPrompt = `MANDATORY: Analyze ${stockInfo.fullName} (${stockInfo.symbol}) - Current Price: ${stockInfo.currentPrice}

CRITICAL INSTRUCTIONS:
1. Use ONLY the current price stated above: ${stockInfo.currentPrice}
2. Base ALL analysis on this exact pricing
3. Calculate targets as 5-8% upside from current price
4. Use realistic PE ratios for June 2025 market conditions
5. Reference actual Q4 FY25 completed results

STOCK QUERY: "${query}"

JUNE 2025 MARKET CONTEXT:
- Nifty 50: 25,250 levels
- Interest rates: 6.5% repo rate  
- Market sentiment: Cautiously optimistic
- Post-FY25 results normalized growth

PRICING VALIDATION:
- Current Price: ${stockInfo.currentPrice}
- Target Range: 5-8% upside from current price
- Support: 3-5% below current price
- Resistance: 2-4% above current price

Provide complete fundamental analysis using these EXACT price levels, not historical data.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.choices[0].message.content || "Analysis unavailable.";
      
    } catch (error) {
      console.error("OpenAI API error:", error);
      
      return `**SUMMARY**: Analysis temporarily unavailable | Retry recommended

**BUSINESS**: Unable to retrieve current data for the requested stock

**VALUATION**: Market data connection required for PE analysis  

**QUARTERLY**: Recent performance data unavailable

**MANAGEMENT**: Strategic guidance pending data retrieval

**TECHNICAL**: Technical levels calculation in progress

**VERDICT**: Please retry your analysis request. Our AI system can analyze any NSE/BSE listed stock including large cap, mid cap, small cap, and micro cap companies with appropriate risk assessments and price targets.`;
    }
  }
}

export const stockAI = new StockAIService();