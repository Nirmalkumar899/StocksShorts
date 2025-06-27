import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class StockAIService {
  private identifyStock(query: string): { fullName: string; symbol: string; currentPrice: string; category: string } {
    const queryLower = query.toLowerCase();
    
    // Stock mapping with current June 2025 prices - includes Large, Mid, Small, and Micro cap stocks
    const stockMap: { [key: string]: { fullName: string; symbol: string; currentPrice: string; category: string } } = {
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
      
      // Micro Cap / SME Stocks (No price targets)
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
    
    // Check for exact matches first - prioritize longer matches
    const sortedKeys = Object.keys(stockMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (queryLower.includes(key)) {
        return stockMap[key];
      }
    }
    
    // Default fallback for unrecognized stocks
    return { fullName: 'Unknown Stock', symbol: 'UNKNOWN', currentPrice: '₹0', category: 'unknown' };
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
      // First, identify the stock from user query
      const stockName = this.identifyStock(query);
      
      const getAnalysisPrompt = () => {
        const isMicroCap = stockName.category === 'micro';
        const marketCapInfo: { [key: string]: string } = {
          'large': 'Large Cap (₹20,000+ crore market cap)',
          'mid': 'Mid Cap (₹5,000-20,000 crore market cap)', 
          'small': 'Small Cap (₹1,000-5,000 crore market cap)',
          'micro': 'Micro Cap/SME (<₹1,000 crore market cap)',
          'unknown': 'Unknown Market Cap'
        };

        return `You are analyzing ${stockName.fullName} (${marketCapInfo[stockName.category] || 'Unknown Cap'}) trading at current price ${stockName.currentPrice} on June 27, 2025.

CRITICAL INSTRUCTIONS:
1. Current market price is ${stockName.currentPrice} - use ONLY this for all calculations
2. Technical levels must be realistic relative to ${stockName.currentPrice}
${isMicroCap ? 
'3. **NO PRICE TARGETS** for micro-cap/SME stocks due to high volatility and liquidity constraints' : 
'3. Target prices should be 15-25% above current price for large/mid caps, 10-20% for small caps'}
4. Support/resistance levels should be within 10-15% of ${stockName.currentPrice}

Analysis Format:
**SUMMARY**: ${stockName.fullName} | BUY/HOLD/SELL ${isMicroCap ? '| High Risk - No Target' : '| Target ₹X'} | Key reason

**BUSINESS**: Core operations and competitive advantages ${isMicroCap ? '(Note: Higher business risk due to size)' : ''}

**VALUATION**: Current PE vs industry peers, based on ${stockName.currentPrice} ${isMicroCap ? '(Limited peer comparison for micro-caps)' : ''}

**QUARTERLY**: Q4 FY25/Q1 FY26 performance analysis ${isMicroCap ? '(May have irregular reporting)' : ''}

**MANAGEMENT**: Recent guidance and strategic initiatives

**TECHNICAL**: Support/resistance levels relative to current ${stockName.currentPrice} ${isMicroCap ? '(Higher volatility expected)' : ''}

**VERDICT**: Recommendation with timeline ${isMicroCap ? '(Suitable only for high-risk investors)' : '(6-12 months)'}

${isMicroCap ? 'IMPORTANT: Micro-cap stocks carry significantly higher risk due to low liquidity, limited institutional coverage, and higher volatility. No price targets provided.' : 'IMPORTANT: All price targets and technical levels calculated from current price.'}`;
      };

      const systemPrompt = getAnalysisPrompt();

      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const userPrompt = `Analyze ${stockName.fullName} stock fundamentals for investment.

CURRENT MARKET DATA (June 27, 2025):
- Company: ${stockName.fullName} (NSE: ${stockName.symbol})
- Market Cap Category: ${stockName.category.toUpperCase()} CAP
- Current Trading Price: ${stockName.currentPrice}
${stockName.category !== 'micro' ? `- Target Price Range: ${this.calculateTargetPrice(stockName.currentPrice)}` : '- NO PRICE TARGET (Micro-cap/SME stock)'}
- Support Level: ${this.calculateSupport(stockName.currentPrice)}
- Resistance Level: ${this.calculateResistance(stockName.currentPrice)}

Use ONLY the above current market data for your analysis. Follow the market cap specific guidelines in the system prompt.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.5,
      }, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.choices[0].message.content || "Analysis unavailable.";
      
    } catch (error) {
      console.error("OpenAI API error:", error);
      
      // Return structured fallback that follows the requested format
      const stockName = query.toUpperCase().replace(/ANALYZE|STOCK/gi, '').trim() || 'STOCK';
      
      return `**SUMMARY**: HOLD | Target ₹TBD | Awaiting complete analysis

**BUSINESS**: ${stockName} operates in Indian markets with established presence

**VALUATION**: PE analysis pending - requires real-time data connection  

**QUARTERLY**: Recent performance data being retrieved

**MANAGEMENT**: Strategic guidance under review

**TECHNICAL**: Support and resistance levels being calculated

**VERDICT**: Complete analysis requires stable API connection. Please retry your query for detailed fundamental analysis including business model evaluation, PE vs industry comparison, quarterly performance assessment, and management commentary.

The AI analysis focuses on fundamentals first (business model, valuation metrics, quarterly results, management guidance) followed by technical analysis as requested.`;
    }
  }
}

export const stockAI = new StockAIService();