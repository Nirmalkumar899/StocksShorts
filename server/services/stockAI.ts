// Using Perplexity API for more accurate financial data and analysis

import { stockDataProvider } from './stockDataProvider';
import { screenerService } from './screenerService';
import { peRatioCalculator } from './peRatioCalculator';
import { dataVerification } from './dataVerification';
import axios from 'axios';

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error('PERPLEXITY_API_KEY is required for stock analysis');
}

export class StockAIService {
  private async identifyStock(query: string): Promise<{ fullName: string; symbol: string; currentPrice: string; category: string; screenerData?: any }> {
    const queryLower = query.toLowerCase().trim();
    
    // Try to get live market data first
    try {
      const liveData = await stockDataProvider.getLiveStockData(queryLower);
      if (liveData) {
        // Also try to get screener data for financial metrics
        const screenerData = await screenerService.getStockByName(liveData.name);
        
        return {
          fullName: liveData.name,
          symbol: liveData.symbol,
          currentPrice: `₹${Math.round(liveData.price)}`,
          category: this.categorizeByPrice(liveData.price),
          screenerData: screenerData
        };
      }
    } catch (error) {
      console.log(`Live data not available for ${query}, trying screener.in`);
    }

    // Try screener.in search
    try {
      const screenerResults = await screenerService.searchStock(queryLower);
      if (screenerResults.length > 0) {
        const stockData = await screenerService.getStockData(screenerResults[0].id);
        if (stockData) {
          return {
            fullName: stockData.name,
            symbol: stockData.symbol,
            currentPrice: `₹${Math.round(stockData.currentPrice)}`,
            category: this.categorizeByPrice(stockData.currentPrice),
            screenerData: stockData
          };
        }
      }
    } catch (error) {
      console.log(`Screener.in data not available for ${query}, using fallback`);
    }

    // Fallback: check known mappings for instant recognition
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

  private categorizeByPrice(price: number): string {
    if (price >= 3000) return 'large';
    if (price >= 1000) return 'mid';
    return 'small';
  }

  private getAdditionalStocks(): { [key: string]: { fullName: string; symbol: string; currentPrice: string; category: string } } {
    return {
      'zomato': { fullName: 'Zomato Ltd', symbol: 'ZOMATO', currentPrice: '₹285', category: 'mid' },
      'paytm': { fullName: 'One 97 Communications Ltd', symbol: 'PAYTM', currentPrice: '₹685', category: 'mid' },
      'nykaa': { fullName: 'FSN E-Commerce Ventures Ltd', symbol: 'NYKAA', currentPrice: '₹285', category: 'mid' },
      'policybazaar': { fullName: 'PB Fintech Ltd', symbol: 'PB', currentPrice: '₹1,485', category: 'mid' },
      'pb fintech': { fullName: 'PB Fintech Ltd', symbol: 'PB', currentPrice: '₹1,485', category: 'mid' },
      'delhivery': { fullName: 'Delhivery Ltd', symbol: 'DELHIVERY', currentPrice: '₹485', category: 'mid' },
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
      'tcs': { fullName: 'Tata Consultancy Services Ltd', symbol: 'TCS', currentPrice: '₹4,185', category: 'large' },
      'tata consultancy services': { fullName: 'Tata Consultancy Services Ltd', symbol: 'TCS', currentPrice: '₹4,185', category: 'large' },
      'infosys': { fullName: 'Infosys Ltd', symbol: 'INFY', currentPrice: '₹1,785', category: 'large' },
      'wipro': { fullName: 'Wipro Ltd', symbol: 'WIPRO', currentPrice: '₹485', category: 'mid' },
      'reliance': { fullName: 'Reliance Industries Ltd', symbol: 'RELIANCE', currentPrice: '₹3,125', category: 'large' },
      'hdfc bank': { fullName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', currentPrice: '₹1,885', category: 'large' },
      'hdfc': { fullName: 'HDFC Bank Ltd', symbol: 'HDFCBANK', currentPrice: '₹1,885', category: 'large' },
      'airtel': { fullName: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL', currentPrice: '₹1,785', category: 'large' },
      'bharti airtel': { fullName: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL', currentPrice: '₹1,785', category: 'large' },
      'itc': { fullName: 'ITC Ltd', symbol: 'ITC', currentPrice: '₹485', category: 'large' },
      'sbi': { fullName: 'State Bank of India', symbol: 'SBIN', currentPrice: '₹885', category: 'large' },
      'state bank of india': { fullName: 'State Bank of India', symbol: 'SBIN', currentPrice: '₹885', category: 'large' },
      'icici bank': { fullName: 'ICICI Bank Ltd', symbol: 'ICICIBANK', currentPrice: '₹1,385', category: 'large' },
      'icici': { fullName: 'ICICI Bank Ltd', symbol: 'ICICIBANK', currentPrice: '₹1,385', category: 'large' },
      'bajaj finance': { fullName: 'Bajaj Finance Ltd', symbol: 'BAJFINANCE', currentPrice: '₹7,485', category: 'large' },
      'asian paints': { fullName: 'Asian Paints Ltd', symbol: 'ASIANPAINT', currentPrice: '₹2,885', category: 'large' },
      'nestle': { fullName: 'Nestle India Ltd', symbol: 'NESTLEIND', currentPrice: '₹2,385', category: 'large' },
      'nestle india': { fullName: 'Nestle India Ltd', symbol: 'NESTLEIND', currentPrice: '₹2,385', category: 'large' },
      'hul': { fullName: 'Hindustan Unilever Ltd', symbol: 'HINDUNILVR', currentPrice: '₹2,485', category: 'large' },
      'hindustan unilever': { fullName: 'Hindustan Unilever Ltd', symbol: 'HINDUNILVR', currentPrice: '₹2,485', category: 'large' },
      'maruti': { fullName: 'Maruti Suzuki India Ltd', symbol: 'MARUTI', currentPrice: '₹11,785', category: 'large' },
      'maruti suzuki': { fullName: 'Maruti Suzuki India Ltd', symbol: 'MARUTI', currentPrice: '₹11,785', category: 'large' },
      'titan': { fullName: 'Titan Company Ltd', symbol: 'TITAN', currentPrice: '₹3,685', category: 'large' },
      'titan company': { fullName: 'Titan Company Ltd', symbol: 'TITAN', currentPrice: '₹3,685', category: 'large' },
      'larsen toubro': { fullName: 'Larsen & Toubro Ltd', symbol: 'LT', currentPrice: '₹3,450', category: 'large' },
      'l&t': { fullName: 'Larsen & Toubro Ltd', symbol: 'LT', currentPrice: '₹3,450', category: 'large' },
      'lt': { fullName: 'Larsen & Toubro Ltd', symbol: 'LT', currentPrice: '₹3,450', category: 'large' },
      'adani enterprises': { fullName: 'Adani Enterprises Ltd', symbol: 'ADANIENT', currentPrice: '₹2,890', category: 'large' },
      'adani': { fullName: 'Adani Enterprises Ltd', symbol: 'ADANIENT', currentPrice: '₹2,890', category: 'large' },
      'coal india': { fullName: 'Coal India Ltd', symbol: 'COALINDIA', currentPrice: '₹420', category: 'large' },
      'ntpc': { fullName: 'NTPC Ltd', symbol: 'NTPC', currentPrice: '₹360', category: 'large' },
      'ongc': { fullName: 'Oil and Natural Gas Corporation Ltd', symbol: 'ONGC', currentPrice: '₹280', category: 'large' },
      'powergrid': { fullName: 'Power Grid Corporation of India Ltd', symbol: 'POWERGRID', currentPrice: '₹320', category: 'large' },
      'sun pharma': { fullName: 'Sun Pharmaceutical Industries Ltd', symbol: 'SUNPHARMA', currentPrice: '₹1,680', category: 'large' },
      'sun pharmaceutical': { fullName: 'Sun Pharmaceutical Industries Ltd', symbol: 'SUNPHARMA', currentPrice: '₹1,680', category: 'large' },
      'dr reddy': { fullName: 'Dr. Reddys Laboratories Ltd', symbol: 'DRREDDY', currentPrice: '₹1,290', category: 'large' },
      'dr reddys': { fullName: 'Dr. Reddys Laboratories Ltd', symbol: 'DRREDDY', currentPrice: '₹1,290', category: 'large' },
      'cipla': { fullName: 'Cipla Ltd', symbol: 'CIPLA', currentPrice: '₹1,580', category: 'large' },
      'divis labs': { fullName: 'Divis Laboratories Ltd', symbol: 'DIVISLAB', currentPrice: '₹5,890', category: 'large' },
      'divis': { fullName: 'Divis Laboratories Ltd', symbol: 'DIVISLAB', currentPrice: '₹5,890', category: 'large' },
      'biocon': { fullName: 'Biocon Ltd', symbol: 'BIOCON', currentPrice: '₹380', category: 'mid' },
      'tata steel': { fullName: 'Tata Steel Ltd', symbol: 'TATASTEEL', currentPrice: '₹140', category: 'large' },
      'jsw steel': { fullName: 'JSW Steel Ltd', symbol: 'JSWSTEEL', currentPrice: '₹890', category: 'large' },
      'jsw': { fullName: 'JSW Steel Ltd', symbol: 'JSWSTEEL', currentPrice: '₹890', category: 'large' },
      'hindalco': { fullName: 'Hindalco Industries Ltd', symbol: 'HINDALCO', currentPrice: '₹650', category: 'large' },
      'vedanta': { fullName: 'Vedanta Ltd', symbol: 'VEDL', currentPrice: '₹480', category: 'large' },
      'bajaj auto': { fullName: 'Bajaj Auto Ltd', symbol: 'BAJAJ-AUTO', currentPrice: '₹9,200', category: 'large' },
      'hero motocorp': { fullName: 'Hero MotoCorp Ltd', symbol: 'HEROMOTOCO', currentPrice: '₹4,890', category: 'large' },
      'hero': { fullName: 'Hero MotoCorp Ltd', symbol: 'HEROMOTOCO', currentPrice: '₹4,890', category: 'large' },
      'tata motors': { fullName: 'Tata Motors Ltd', symbol: 'TATAMOTORS', currentPrice: '₹890', category: 'large' },
      'mahindra': { fullName: 'Mahindra & Mahindra Ltd', symbol: 'M&M', currentPrice: '₹2,980', category: 'large' },
      'm&m': { fullName: 'Mahindra & Mahindra Ltd', symbol: 'M&M', currentPrice: '₹2,980', category: 'large' },
      'eicher motors': { fullName: 'Eicher Motors Ltd', symbol: 'EICHERMOT', currentPrice: '₹4,650', category: 'large' },
      'eicher': { fullName: 'Eicher Motors Ltd', symbol: 'EICHERMOT', currentPrice: '₹4,650', category: 'large' },
      'ultratech cement': { fullName: 'UltraTech Cement Ltd', symbol: 'ULTRACEMCO', currentPrice: '₹11,200', category: 'large' },
      'ultratech': { fullName: 'UltraTech Cement Ltd', symbol: 'ULTRACEMCO', currentPrice: '₹11,200', category: 'large' },
      'grasim': { fullName: 'Grasim Industries Ltd', symbol: 'GRASIM', currentPrice: '₹2,680', category: 'large' },
      'axis bank': { fullName: 'Axis Bank Ltd', symbol: 'AXISBANK', currentPrice: '₹1,120', category: 'large' },
      'axis': { fullName: 'Axis Bank Ltd', symbol: 'AXISBANK', currentPrice: '₹1,120', category: 'large' },
      'kotak bank': { fullName: 'Kotak Mahindra Bank Ltd', symbol: 'KOTAKBANK', currentPrice: '₹1,780', category: 'large' },
      'kotak mahindra': { fullName: 'Kotak Mahindra Bank Ltd', symbol: 'KOTAKBANK', currentPrice: '₹1,780', category: 'large' },
      'kotak': { fullName: 'Kotak Mahindra Bank Ltd', symbol: 'KOTAKBANK', currentPrice: '₹1,780', category: 'large' },
      'indusind bank': { fullName: 'IndusInd Bank Ltd', symbol: 'INDUSINDBK', currentPrice: '₹980', category: 'large' },
      'indusind': { fullName: 'IndusInd Bank Ltd', symbol: 'INDUSINDBK', currentPrice: '₹980', category: 'large' },
      'tech mahindra': { fullName: 'Tech Mahindra Ltd', symbol: 'TECHM', currentPrice: '₹1,680', category: 'large' },
      'tech m': { fullName: 'Tech Mahindra Ltd', symbol: 'TECHM', currentPrice: '₹1,680', category: 'large' },
      'hcl tech': { fullName: 'HCL Technologies Ltd', symbol: 'HCLTECH', currentPrice: '₹1,890', category: 'large' },
      'hcl': { fullName: 'HCL Technologies Ltd', symbol: 'HCLTECH', currentPrice: '₹1,890', category: 'large' },
      'dixon': { fullName: 'Dixon Technologies India Ltd', symbol: 'DIXON', currentPrice: '₹15,500', category: 'small' },
      'dixon tech': { fullName: 'Dixon Technologies India Ltd', symbol: 'DIXON', currentPrice: '₹15,500', category: 'small' },
      'dixon technologies': { fullName: 'Dixon Technologies India Ltd', symbol: 'DIXON', currentPrice: '₹15,500', category: 'small' },
      'cams': { fullName: 'Computer Age Management Services Ltd', symbol: 'CAMS', currentPrice: '₹4,200', category: 'small' },
      'computer age': { fullName: 'Computer Age Management Services Ltd', symbol: 'CAMS', currentPrice: '₹4,200', category: 'small' },
      'nazara': { fullName: 'Nazara Technologies Ltd', symbol: 'NAZARA', currentPrice: '₹890', category: 'small' },
      'nazara tech': { fullName: 'Nazara Technologies Ltd', symbol: 'NAZARA', currentPrice: '₹890', category: 'small' },
      'nazara technologies': { fullName: 'Nazara Technologies Ltd', symbol: 'NAZARA', currentPrice: '₹890', category: 'small' },
      'nuvama': { fullName: 'Nuvama Wealth Management Ltd', symbol: 'NUVAMA', currentPrice: '₹7,385', category: 'small' },
      'nuvama wealth': { fullName: 'Nuvama Wealth Management Ltd', symbol: 'NUVAMA', currentPrice: '₹7,385', category: 'small' },
      'v2 retail': { fullName: 'V2 Retail Ltd', symbol: 'V2RETAIL', currentPrice: '₹885', category: 'small' },
      'v2retail': { fullName: 'V2 Retail Ltd', symbol: 'V2RETAIL', currentPrice: '₹885', category: 'small' },
      'metro brands': { fullName: 'Metro Brands Ltd', symbol: 'METROBRAND', currentPrice: '₹1,285', category: 'small' },
      'metrobrands': { fullName: 'Metro Brands Ltd', symbol: 'METROBRAND', currentPrice: '₹1,285', category: 'small' },
      'campus activewear': { fullName: 'Campus Activewear Ltd', symbol: 'CAMPUS', currentPrice: '₹485', category: 'small' },
      'campus': { fullName: 'Campus Activewear Ltd', symbol: 'CAMPUS', currentPrice: '₹485', category: 'small' },
      'anupam rasayan': { fullName: 'Anupam Rasayan India Ltd', symbol: 'ANURAS', currentPrice: '₹885', category: 'small' },
      'anuras': { fullName: 'Anupam Rasayan India Ltd', symbol: 'ANURAS', currentPrice: '₹885', category: 'small' },
      'medplus': { fullName: 'MedPlus Health Services Ltd', symbol: 'MEDPLUS', currentPrice: '₹785', category: 'small' },
      'medplus health': { fullName: 'MedPlus Health Services Ltd', symbol: 'MEDPLUS', currentPrice: '₹785', category: 'small' },
      'cartrade tech': { fullName: 'CarTrade Tech Ltd', symbol: 'CARTRADE', currentPrice: '₹485', category: 'small' },
      'cartrade': { fullName: 'CarTrade Tech Ltd', symbol: 'CARTRADE', currentPrice: '₹485', category: 'small' },
      'kalyan jewellers': { fullName: 'Kalyan Jewellers India Ltd', symbol: 'KALYANKJIL', currentPrice: '₹485', category: 'mid' },
      'kalyan': { fullName: 'Kalyan Jewellers India Ltd', symbol: 'KALYANKJIL', currentPrice: '₹485', category: 'mid' },
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
    // Extract numeric value from price string like "₹3,650"
    const numericPrice = parseFloat(currentPrice.replace(/[₹,]/g, ''));
    if (isNaN(numericPrice)) return currentPrice;
    
    // Calculate 5-8% upside target
    const targetPrice = Math.round(numericPrice * 1.07);
    return `₹${targetPrice.toLocaleString('en-IN')}`;
  }

  private calculateSupport(currentPrice: string): string {
    const numericPrice = parseFloat(currentPrice.replace(/[₹,]/g, ''));
    if (isNaN(numericPrice)) return currentPrice;
    
    // Calculate 3-5% downside support
    const supportPrice = Math.round(numericPrice * 0.96);
    return `₹${supportPrice.toLocaleString('en-IN')}`;
  }

  private calculateResistance(currentPrice: string): string {
    const numericPrice = parseFloat(currentPrice.replace(/[₹,]/g, ''));
    if (isNaN(numericPrice)) return currentPrice;
    
    // Calculate 2-4% upside resistance
    const resistancePrice = Math.round(numericPrice * 1.03);
    return `₹${resistancePrice.toLocaleString('en-IN')}`;
  }

  private async fetchRealFinancialData(symbol: string): Promise<any> {
    try {
      // Use the comprehensive financial data provider with GPT-powered extraction
      const { financialDataProvider } = await import('./financialDataProvider.js');
      
      console.log(`Fetching comprehensive financial data for ${symbol} from multiple sources`);
      const financialData = await financialDataProvider.getFinancialData(symbol);
      
      if (financialData && (financialData.currentPrice || financialData.pe || financialData.marketCap)) {
        console.log(`Successfully retrieved authentic data for ${symbol} from ${financialData.source}:`, financialData);
        
        // Also fetch conference call data and merge it
        try {
          const { conferenceCallService } = await import('./conferenceCallService.js');
          console.log(`Fetching conference call data for ${symbol}...`);
          const conferenceData = await conferenceCallService.getConferenceCallData(symbol);
          if (conferenceData) {
            financialData.conferenceCallData = conferenceData;
            console.log(`Successfully added conference call data for ${symbol}:`, conferenceData);
          } else {
            console.log(`No conference call data available for ${symbol}`);
          }
        } catch (error) {
          console.log(`Error fetching conference call data for ${symbol}:`, error);
        }
        
        return financialData;
      }

      // Fallback to NSE conference call data for quarterly insights
      const conferenceData = await this.fetchNSEConferenceCallData(symbol);
      if (conferenceData) {
        console.log(`Retrieved NSE conference call data for ${symbol}:`, conferenceData);
        return { ...conferenceData, symbol, source: 'NSE Conference Calls' };
      }

      console.log(`No financial data available for ${symbol} from any source - returning testing phase data`);
      return {
        symbol: symbol,
        currentPrice: 'Market Price',
        pe: null,
        marketCap: null,
        source: 'Testing Phase',
        lastUpdated: new Date(),
        testingPhase: true
      };
    } catch (error) {
      console.log(`Error fetching financial data for ${symbol}:`, error);
      return {
        symbol: symbol,
        currentPrice: 'Market Price', 
        pe: null,
        marketCap: null,
        source: 'Testing Phase',
        lastUpdated: new Date(),
        testingPhase: true
      };
    }
  }

  private async fetchNSEConferenceCallData(symbol: string): Promise<any> {
    try {
      // NSE Corporate Actions and Announcements
      console.log(`Fetching NSE conference call data for ${symbol}`);
      
      const nseCorpResponse = await fetch(`https://www.nseindia.com/api/corporate-actions?index=equities&symbol=${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (nseCorpResponse.ok) {
        const corpData = await nseCorpResponse.json();
        console.log(`NSE Corporate data for ${symbol}:`, corpData);
        
        // Look for recent earnings calls, investor presentations
        const conferenceData = {
          earningsCallDates: [],
          investorPresentations: [],
          managementGuidance: [],
          quarterlyResults: []
        };

        return conferenceData;
      }

      // Alternative: Try NSE announcements API
      const announcementsResponse = await fetch(`https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json();
        console.log(`NSE Announcements data for ${symbol}:`, announcementsData);
        return announcementsData;
      }

      return null;
    } catch (error) {
      console.log(`Error fetching NSE conference call data for ${symbol}:`, error);
      return null;
    }
  }

  private async scrapeScreenerData(symbol: string): Promise<any> {
    try {
      // Direct company URL approach - try common symbol formats
      const possibleUrls = [
        `https://www.screener.in/company/${symbol.toUpperCase()}/`,
        `https://www.screener.in/company/${symbol.toLowerCase()}/`,
        `https://www.screener.in/company/${symbol}/`
      ];

      for (const companyUrl of possibleUrls) {
        try {
          console.log(`Trying to fetch: ${companyUrl}`);
          const companyResponse = await fetch(companyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache'
            }
          });

          if (companyResponse.ok) {
            const htmlContent = await companyResponse.text();
            console.log(`Successfully fetched HTML for ${symbol}, length: ${htmlContent.length}`);
            
            // Extract financial data from HTML
            const financialData = await this.extractFinancialDataFromHTML(htmlContent);
            
            if (Object.keys(financialData).length > 0) {
              return financialData;
            }
          }
        } catch (urlError: any) {
          console.log(`Failed to fetch ${companyUrl}:`, urlError?.message || 'Unknown error');
          continue;
        }
      }

      // Fallback: try search API
      const searchUrl = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(symbol)}`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.screener.in/'
        }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData && searchData.length > 0) {
          const companyId = searchData[0].id;
          console.log(`Found company ID: ${companyId} for ${symbol}`);
          
          const directUrl = `https://www.screener.in/company/${companyId}/`;
          const directResponse = await fetch(directUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (directResponse.ok) {
            const htmlContent = await directResponse.text();
            const financialData = this.extractFinancialDataFromHTML(htmlContent);
            return financialData;
          }
        }
      }

      return null;

    } catch (error) {
      console.log('Screener.in scraping failed:', error);
      return null;
    }
  }

  private async extractFinancialDataFromHTML(html: string): Promise<any> {
    try {
      const data: any = {};
      
      // Extract current price with enhanced screener.in patterns
      const pricePatterns = [
        /<span[^>]*class="[^"]*number[^"]*"[^>]*>₹\s*([\d,]+\.?\d*)/,
        /<div[^>]*class="[^"]*price-box[^"]*"[^>]*>.*?₹\s*([\d,]+\.?\d*)/,
        /₹\s*([\d,]+\.?\d*)\s*<\/span>/,
        /"current_price":\s*([\d.]+)/,
        /data-value="([\d.]+)"/,
        /<h1[^>]*>.*?₹\s*([\d,]+\.?\d*)/,
        /Current Price[^>]*>\s*₹\s*([\d,]+\.?\d*)/i,
        /<td[^>]*>\s*Current Price\s*<\/td>\s*<td[^>]*>\s*₹\s*([\d,]+\.?\d*)/i
      ];
      
      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match) {
          data.currentPrice = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      
      // Extract PE ratio with comprehensive patterns targeting screener.in structure
      const pePatterns = [
        /Stock P\/E.*?<span[^>]*class="[^"]*number[^"]*"[^>]*>([\d.]+)<\/span>/i,
        /<td[^>]*>\s*Stock P\/E\s*<\/td>\s*<td[^>]*>\s*([\d.]+)/i,
        /P\/E\s*<\/b>\s*<\/td>\s*<td[^>]*>\s*([\d.]+)/i,
        /<b>P\/E<\/b>.*?<td[^>]*>\s*([\d.]+)/i,
        /PE.*?<span[^>]*>\s*([\d.]+)\s*<\/span>/i,
        /"stock_pe":\s*([\d.]+)/,
        /Price to Earning.*?(\d+\.?\d*)/i,
        /P\/E Ratio.*?(\d+\.?\d*)/i
      ];
      
      for (const pattern of pePatterns) {
        const match = html.match(pattern);
        if (match) {
          data.pe = parseFloat(match[1]);
          break;
        }
      }
      
      // Extract Market Cap with screener.in specific patterns
      const mcapPatterns = [
        /Market Cap.*?<span[^>]*class="[^"]*number[^"]*"[^>]*>₹\s*([\d,]+(?:\.\d+)?)\s*Cr<\/span>/i,
        /<td[^>]*>\s*Market Cap\s*<\/td>\s*<td[^>]*>\s*₹\s*([\d,]+(?:\.\d+)?)\s*Cr/i,
        /Market Cap<\/b>.*?₹\s*([\d,]+(?:\.\d+)?)\s*Cr/i,
        /<b>Market Cap<\/b>.*?<td[^>]*>\s*₹\s*([\d,]+(?:\.\d+)?)\s*Cr/i,
        /Market Capitalisation.*?₹\s*([\d,]+(?:\.\d+)?)\s*Cr/i,
        /"market_cap":\s*([\d.]+)/,
        /Mkt\s*Cap.*?₹\s*([\d,]+(?:\.\d+)?)\s*Cr/i
      ];
      
      for (const pattern of mcapPatterns) {
        const match = html.match(pattern);
        if (match) {
          data.marketCap = parseFloat(match[1].replace(/,/g, '')) * 10000000;
          break;
        }
      }
      
      // Extract ROE
      const roePatterns = [
        /ROE[^>]*>\s*([\d.]+)%/i,
        /"roe":\s*([\d.]+)/,
        /Return on Equity[^>]*>\s*([\d.]+)/i
      ];
      
      for (const pattern of roePatterns) {
        const match = html.match(pattern);
        if (match) {
          data.roe = parseFloat(match[1]) / 100;
          break;
        }
      }
      
      // Extract Debt to Equity
      const debtPatterns = [
        /Debt to [Ee]quity[^>]*>\s*([\d.]+)/i,
        /"debt_to_equity":\s*([\d.]+)/,
        /D\/E[^>]*>\s*([\d.]+)/i
      ];
      
      for (const pattern of debtPatterns) {
        const match = html.match(pattern);
        if (match) {
          data.debtToEquity = parseFloat(match[1]);
          break;
        }
      }
      
      // Extract Revenue Growth
      const revenueGrowthPatterns = [
        /Sales Growth[^>]*>\s*([\d.-]+)%/i,
        /"revenue_growth":\s*([\d.-]+)/,
        /Revenue Growth[^>]*>\s*([\d.-]+)/i
      ];
      
      for (const pattern of revenueGrowthPatterns) {
        const match = html.match(pattern);
        if (match) {
          data.revenueGrowth = parseFloat(match[1]) / 100;
          break;
        }
      }
      
      // Extract Profit Margins
      const marginPatterns = [
        /OPM[^>]*>\s*([\d.]+)%/i,
        /"profit_margin":\s*([\d.]+)/,
        /Operating Margin[^>]*>\s*([\d.]+)/i
      ];
      
      for (const pattern of marginPatterns) {
        const match = html.match(pattern);
        if (match) {
          data.profitMargin = parseFloat(match[1]) / 100;
          break;
        }
      }
      
      console.log(`Extracted financial data for ${data.symbol || 'unknown'}:`, data);
      
      // If we have minimal data, try additional extraction methods
      if (Object.keys(data).length <= 2) {
        // Try to extract from JSON data embedded in the page
        const jsonMatches = html.match(/"ratios":\s*{[^}]+}/g);
        if (jsonMatches) {
          try {
            const ratiosData = JSON.parse(`{${jsonMatches[0]}}`);
            if (ratiosData.ratios) {
              data.pe = ratiosData.ratios.pe || data.pe;
              data.roe = ratiosData.ratios.roe || data.roe;
              data.debtToEquity = ratiosData.ratios.debt_to_equity || data.debtToEquity;
            }
          } catch (e) {
            console.log('Failed to parse embedded JSON data');
          }
        }
        
        // Try alternate API endpoints if available
        const companyIdMatch = html.match(/company\/(\d+)\//);
        if (companyIdMatch) {
          const companyId = companyIdMatch[1];
          console.log(`Found company ID: ${companyId}, attempting quarterly data fetch`);
          try {
            const quarterlyData = await this.getQuarterlyData(companyId);
            if (quarterlyData && quarterlyData.length > 0) {
              const latest = quarterlyData[0];
              data.quarterlyRevenue = latest.sales;
              data.quarterlyProfit = latest.profit;
              data.quarterlyGrowth = latest.sales_growth;
            }
          } catch (e) {
            console.log('Failed to fetch quarterly data');
          }
        }
      }
      
      return data;
    } catch (error) {
      console.log('Error extracting financial data:', error);
      return {};
    }
  }

  private async getQuarterlyData(companyId: string): Promise<any> {
    try {
      // Try to access quarterly results endpoint
      const quarterlyUrl = `https://www.screener.in/api/company/${companyId}/quarters/`;
      const response = await fetch(quarterlyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': `https://www.screener.in/company/${companyId}/`
        }
      });

      if (response.ok) {
        const quarterlyData = await response.json();
        return quarterlyData;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private getYahooSymbolMapping(symbol: string): string | null {
    const mappings: { [key: string]: string } = {
      'TCS': 'TCS.NS',
      'RELIANCE': 'RELIANCE.NS',
      'INFY': 'INFY.NS',
      'INFOSYS': 'INFY.NS',
      'HDFCBANK': 'HDFCBANK.NS',
      'HDFC BANK': 'HDFCBANK.NS',
      'ICICIBANK': 'ICICIBANK.NS',
      'ICICI BANK': 'ICICIBANK.NS',
      'WIPRO': 'WIPRO.NS',
      'SBIN': 'SBIN.NS',
      'SBI': 'SBIN.NS',
      'BHARTIARTL': 'BHARTIARTL.NS',
      'BHARTI AIRTEL': 'BHARTIARTL.NS',
      'ITC': 'ITC.NS',
      'AXISBANK': 'AXISBANK.NS',
      'AXIS BANK': 'AXISBANK.NS',
      'KOTAKBANK': 'KOTAKBANK.NS',
      'KOTAK BANK': 'KOTAKBANK.NS',
      'LT': 'LT.NS',
      'L&T': 'LT.NS',
      'HCLTECH': 'HCLTECH.NS',
      'HCL': 'HCLTECH.NS',
      'TECHM': 'TECHM.NS',
      'TECH MAHINDRA': 'TECHM.NS',
      'MARUTI': 'MARUTI.NS',
      'BAJFINANCE': 'BAJFINANCE.NS',
      'BAJAJ FINANCE': 'BAJFINANCE.NS'
    };
    
    return mappings[symbol.toUpperCase()] || null;
  }

  private async getCompanyOverview(companyName: string, symbol: string): Promise<string> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { 
              role: "system", 
              content: "You are a financial research assistant. Provide comprehensive company overviews by reading company websites and official sources."
            },
            { 
              role: "user", 
              content: `Read the official website of ${companyName} (${symbol}) and provide a comprehensive overview covering:

1. What the company does (core business model)
2. Main revenue streams and business segments
3. Key markets and geographic presence  
4. Recent business developments and strategic initiatives
5. Competitive positioning in the industry

Focus on factual information from the company's official website, annual reports, and recent press releases. Keep it concise but informative (300-400 words).`
            }
          ],
          max_tokens: 600,
          temperature: 0.1,
          search_recency_filter: "month",
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || "Company overview not available at this time.";
    } catch (error) {
      console.error("Error fetching company overview:", error);
      return "Company overview not available at this time.";
    }
  }

  private async getConferenceCallTranscript(companyName: string, symbol: string): Promise<string> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { 
              role: "system", 
              content: "You are a financial analyst specializing in earnings call analysis. Extract key insights from the latest quarterly conference call transcripts."
            },
            { 
              role: "user", 
              content: `Find and analyze the latest quarterly earnings conference call transcript for ${companyName} (${symbol}). Extract:

**KEY QUARTER HIGHLIGHTS:**
- Revenue and profit performance vs previous quarter and year-ago quarter
- Key business metrics and operational updates
- Major business wins, new contracts, or partnerships announced

**MANAGEMENT GROWTH OUTLOOK & COMMENTARY:**
- Forward guidance for next quarter and full year
- Growth targets and expansion plans mentioned
- Management's view on industry trends and market conditions
- Capital expenditure plans and strategic investments
- Any comments on margin outlook and cost management

**INVESTOR Q&A INSIGHTS:**
- Key concerns raised by analysts
- Management responses on competitive positioning
- Commentary on sectoral challenges or opportunities

Focus on the most recent quarter's call. Provide specific numbers, percentages, and quotes where mentioned. If no recent transcript is available, mention that clearly.`
            }
          ],
          max_tokens: 800,
          temperature: 0.1,
          search_recency_filter: "month",
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || "Recent conference call transcript not available.";
    } catch (error) {
      console.error("Error fetching conference call transcript:", error);
      return "Recent conference call transcript not available.";
    }
  }

  private async getInvestorPresentationInsights(companyName: string, symbol: string): Promise<string> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { 
              role: "system", 
              content: "You are a financial analyst specializing in investor presentation analysis. Extract strategic insights from company presentations."
            },
            { 
              role: "user", 
              content: `Find and analyze the latest investor presentation for ${companyName} (${symbol}). Look for:

**STRATEGIC HIGHLIGHTS:**
- Company's strategic priorities and focus areas
- Market opportunity size and growth projections
- Competitive advantages and differentiation factors

**FINANCIAL TARGETS & ROADMAP:**
- Medium to long-term financial targets (3-5 year outlook)
- Revenue growth aspirations and margin expansion plans
- Return ratios targets (ROE, ROCE) and capital allocation strategy

**KEY BUSINESS UPDATES:**
- New product launches or service offerings
- Geographic expansion plans or market entry strategies
- Technology investments and digital transformation initiatives
- ESG initiatives and sustainability commitments

**INVESTMENT THESIS:**
- Management's value proposition to investors
- Key investment highlights and growth drivers
- Risk factors and mitigation strategies mentioned

Focus on the most recent investor presentation or annual report. Provide specific targets, timelines, and strategic priorities mentioned. If no recent presentation is available, mention that clearly.`
            }
          ],
          max_tokens: 700,
          temperature: 0.1,
          search_recency_filter: "month", 
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || "Recent investor presentation not available.";
    } catch (error) {
      console.error("Error fetching investor presentation:", error);
      return "Recent investor presentation not available.";
    }
  }

  async analyzeStock(query: string): Promise<string> {
    try {
      const stockInfo = await this.identifyStock(query);
      
      // Get comprehensive company information
      console.log(`Fetching comprehensive analysis for ${stockInfo.symbol}...`);
      
      // Step 1: Company overview from website
      const companyOverview = await this.getCompanyOverview(stockInfo.fullName, stockInfo.symbol);
      
      // Step 2: Latest quarter conference call transcript
      const conferenceCallInsights = await this.getConferenceCallTranscript(stockInfo.fullName, stockInfo.symbol);
      
      // Step 3: Investor presentation insights
      const investorPresentationInsights = await this.getInvestorPresentationInsights(stockInfo.fullName, stockInfo.symbol);
      
      // Step 4: Cross-verify financial data from multiple sources
      console.log(`Cross-verifying financial data for ${stockInfo.symbol} across multiple sources...`);
      const verifiedData = await dataVerification.getVerifiedFinancialData(stockInfo.symbol);
      
      // Prepare authenticated financial metrics
      let authenticMetrics: any = {};
      let verificationSummary = '';
      
      // Filter only verified metrics (variance < 5%)
      for (const [metric, data] of Object.entries(verifiedData)) {
        if (data.verified) {
          authenticMetrics[metric] = data.value;
        }
      }
      
      const verifiedCount = Object.keys(authenticMetrics).length;
      const totalChecked = Object.keys(verifiedData).length;
      verificationSummary = verifiedCount > 0 ? 
        `${verifiedCount}/${totalChecked} metrics cross-verified (<5% variance)` : 
        'Unable to cross-verify data';
      
      // Try to fetch additional financial data as backup
      let marketDataText = "";
      const realFinancialData = await this.fetchRealFinancialData(stockInfo.symbol);
      
      // Check if we have sufficient data to proceed (either verified or fallback)
      const hasMinimumData = realFinancialData && !realFinancialData.testingPhase;
      
      if (hasMinimumData) {
        let dataSource = "Screener.in";
        if (!realFinancialData.pe && !realFinancialData.marketCap) {
          dataSource = "Yahoo Finance";
        }
        
        // Calculate intelligent PE ratios based on sector-specific logic
        let peAnalysis = '';
        if (realFinancialData.marketCap) {
          const peMetrics = await peRatioCalculator.calculatePE({
            marketCap: realFinancialData.marketCap,
            netProfit: realFinancialData.netProfit,
            lastQuarterProfit: realFinancialData.lastQuarterProfit,
            yearOverYearGrowth: realFinancialData.revenueGrowth,
            sector: realFinancialData.sector || 'default',
            symbol: stockInfo.symbol
          });
          
          const sectorInsights = peRatioCalculator.getSectorInsights(realFinancialData.sector || 'default');
          
          peAnalysis = `
INTELLIGENT PE ANALYSIS:
- Current PE: ${peMetrics.currentPE}x (${peMetrics.calculationMethod})
- Projected PE: ${peMetrics.projectedPE}x (Based on growth projections)
- Calculation Period: ${peMetrics.basedOnPeriod}
- Sector Context: ${sectorInsights}`;
        }

        // Use cross-verified data when available, fallback to single source
        const displayPE = authenticMetrics.pe ? authenticMetrics.pe.toFixed(1) + 'x ✓' : 
                         (realFinancialData.pe ? realFinancialData.pe.toFixed(1) + 'x' : 'N/A');
        const displayMarketCap = authenticMetrics.marketCap ? '₹' + (authenticMetrics.marketCap / 10000000).toFixed(0) + ' cr ✓' : 
                                (realFinancialData.marketCap ? '₹' + (realFinancialData.marketCap / 10000000).toFixed(0) + ' cr' : 'N/A');
        const displayProfitMargin = authenticMetrics.profitMargin ? (authenticMetrics.profitMargin * 100).toFixed(1) + '% ✓' : 
                                   (realFinancialData.profitMargin ? (realFinancialData.profitMargin * 100).toFixed(1) + '%' : 'N/A');
        const displayRevGrowth = authenticMetrics.revenueGrowth ? (authenticMetrics.revenueGrowth * 100).toFixed(1) + '% ✓' : 
                                (realFinancialData.revenueGrowth ? (realFinancialData.revenueGrowth * 100).toFixed(1) + '%' : 'N/A');
        const displayROE = authenticMetrics.roe ? (authenticMetrics.roe * 100).toFixed(1) + '% ✓' : 
                          (realFinancialData.roe ? (realFinancialData.roe * 100).toFixed(1) + '%' : 'N/A');
        const displayDebtEquity = authenticMetrics.debtToEquity ? authenticMetrics.debtToEquity.toFixed(2) + ' ✓' : 
                                 (realFinancialData.debtToEquity ? realFinancialData.debtToEquity.toFixed(2) : 'N/A');

        marketDataText = `
CROSS-VERIFIED FINANCIAL DATA (${verificationSummary}):
- Current Price: ${stockInfo.currentPrice}
- PE Ratio: ${displayPE}
- Market Cap: ${displayMarketCap}
- Profit Margin: ${displayProfitMargin}
- Revenue Growth: ${displayRevGrowth}
- ROE: ${displayROE}
- Debt/Equity: ${displayDebtEquity}${peAnalysis}

DATA VERIFICATION NOTES:
✓ = Cross-verified across multiple sources with <5% variance
Numbers without ✓ are from single source and should be independently verified`;

        // Only add conference call data if verified and sector-appropriate
        if (realFinancialData.conferenceCallData && this.isSectorAppropriateData(stockInfo.fullName, realFinancialData.conferenceCallData)) {
          const ccData = realFinancialData.conferenceCallData;
          marketDataText += `

RECENT QUARTER PERFORMANCE:
- Quarterly Highlights: ${ccData.quarterlyHighlights}
- Revenue Growth Target: ${ccData.revenueGrowthTarget}
- Management Outlook: ${ccData.managementOutlook}
- Recent News: ${ccData.recentNews}`;
        } else {
          marketDataText += `
- 52-Week High: ₹${realFinancialData.fiftyTwoWeekHigh || 'N/A'}
- 52-Week Low: ₹${realFinancialData.fiftyTwoWeekLow || 'N/A'}`;
        }
      } else {
        console.log(`Stock ${stockInfo.symbol} - insufficient data for analysis. Verified: ${verifiedCount}, Testing phase: ${realFinancialData?.testingPhase}`);
        marketDataText = `I am still in testing phase and unable to fetch correct numbers. Kindly look for another stock for now.`;
      }
      
      // If we have testing phase data, return it immediately without API call
      if (marketDataText.includes('testing phase')) {
        return marketDataText;
      }

      // Add timeout controller for API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { 
              role: "system", 
              content: "You are providing educational stock information only. Create a well-formatted, professional analysis with clear sections and visual hierarchy.\n\n# CRITICAL DATA POLICY:\n- If the provided data shows 'TESTING PHASE' or 'Unable to fetch correct numbers', DO NOT attempt to provide any analysis\n- Instead, return the exact testing phase message as provided in the data\n- NEVER create or estimate financial numbers when data is unavailable\n- Only proceed with analysis if authentic, cross-verified financial data is provided\n\n# FORMAT REQUIREMENTS (only if authentic data available):\n- Use clean markdown formatting with proper headings\n- Include bullet points and numbered lists for clarity\n- Highlight key metrics with **bold** text\n- Use line breaks and spacing for readability\n- Structure content logically with clear sections\n\n# ANALYSIS STRUCTURE (only if verified data available):\n\n## 📊 **[COMPANY NAME] - Educational Analysis**\n\n### 🏢 **Business Overview**\nExplain the company's core business model, revenue streams, and market position. Keep it educational and informative.\n\n### 📈 **Financial Performance**\n**Cross-Verified Metrics:**\n- Revenue: **₹X,XXX crores** (Growth: +X.X%)\n- Profit Margin: **X.X%**\n- Market Cap: **₹X,XXX crores**\n\n### 💡 **Management Insights**\nKey guidance and outlook from recent management commentary (use only authentic data provided).\n\n### 🎯 **Valuation Analysis**\n**Key Ratios:**\n- PE Ratio: **X.Xx** (Current) | **X.Xx** (Projected)\n- ROE: **X.X%**\n- Debt/Equity: **X.XX**\n\n### 📊 **Technical Context**\nCurrent price levels and technical patterns for educational reference.\n\n### 🎓 **Educational Summary**\nKey learning points about the company's financial profile and sector dynamics.\n\n---\n\n⚠️ **Educational Purpose Only** - This analysis is for learning purposes. Always verify data independently and consult SEBI-registered advisors for investment decisions.\n\n# CRITICAL REQUIREMENTS:\n- If data shows testing phase message, return it exactly as provided\n- Use ONLY cross-verified authentic numbers (marked with ✓)\n- Never estimate or create financial metrics\n- Format with clear visual hierarchy\n- Include proper spacing and bullet points\n- Mark all data sources clearly\n- Use educational language only\n- No investment recommendations"
            },
            { 
              role: "user", 
              content: `Provide comprehensive analysis for ${stockInfo.fullName} (${stockInfo.symbol}) - Current Price: ${stockInfo.currentPrice}.

## COMPANY OVERVIEW:
${companyOverview}

## LATEST QUARTER CONFERENCE CALL INSIGHTS:
${conferenceCallInsights}

## INVESTOR PRESENTATION HIGHLIGHTS:
${investorPresentationInsights}

## FINANCIAL DATA:
${marketDataText}

ANALYSIS INSTRUCTIONS:
- Start with what the company does based on the company overview section
- Include key insights from the latest conference call, especially management growth outlook and commentary
- Incorporate strategic highlights from investor presentations
- Use the authentic financial metrics provided
- Structure as: Company Business → Conference Call Key Points → Management Growth Outlook → Investor Presentation Strategy → Financial Analysis → Investment Summary
- Provide specific numbers, percentages, and quotes from the data sources
- Write in clear, educational format with proper headings` 
            }
          ],
          max_tokens: 1200,
          temperature: 0.1,
          top_p: 0.8,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: "month",
          stream: false
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();

      return data.choices[0].message.content || this.generateFallbackAnalysis(stockInfo);
      
    } catch (error: any) {
      console.error("Perplexity API error:", error);
      
      // If it was a timeout or abort error, return testing phase message for data integrity
      if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
        return 'I am still in testing phase and unable to fetch correct numbers. Kindly look for another stock for now.';
      }
      
      // For other errors, generate fallback analysis
      return this.generateFallbackAnalysis(stockInfo);
    }
  }

  private generateFallbackAnalysis(stockInfo: { fullName: string; symbol: string; currentPrice: string; category: string }): string {
    return `## 🔧 **System Status - Testing Phase**

### **${stockInfo.fullName} (${stockInfo.symbol})**

I am still in testing phase and unable to fetch correct numbers for ${stockInfo.fullName}. 

**Kindly look for another stock for now. However, I will be able to share verified financial details soon.**

### **Current Limitations:**
- Unable to cross-verify financial metrics from multiple sources
- PE ratios, market cap, and other fundamentals cannot be authenticated  
- Revenue growth and profit margins require verification
- Conference call data and management guidance need validation

### **What's Being Worked On:**
- Cross-verification system across NSE, Screener.in, MoneyControl, and Yahoo Finance
- 5% variance tolerance checking for data accuracy
- Intelligent PE ratio calculations based on sector patterns
- Real-time financial data integration

### **Recommendation:**
Please try analyzing a different stock or check back later when the data verification system is fully operational.

---

⚠️ **Educational Purpose Only** - This analysis is for learning purposes. Always verify data independently and consult SEBI-registered advisors for investment decisions.`;
  }

  private getSectorAnalysis(category: string) {
    type AnalysisCategory = 'large' | 'mid' | 'small' | 'micro';
    
    const analyses: Record<AnalysisCategory, {
      recommendation: string;
      thesis: string;
      business: string;
      valuation: string;
      quarterly: string;
      outlook: string;
      management: string;
      technical: string;
      verdict: string;
    }> = {
      'large': {
        recommendation: 'BUY',
        thesis: 'Strong fundamentals and market leadership',
        business: 'operates with established market position and diversified revenue streams across multiple business segments.',
        valuation: 'reasonable valuations with PE ratios aligned to sector averages, supported by consistent cash flows.',
        quarterly: 'steady revenue growth and margin expansion',
        outlook: 'continued growth momentum',
        management: 'Strategic focus on digital transformation and operational efficiency improvements.',
        technical: 'Strong momentum with bullish trend continuation expected.',
        verdict: 'Blue-chip quality offers stability with growth potential in current market environment.'
      },
      'mid': {
        recommendation: 'BUY',
        thesis: 'Growth potential with expanding market opportunities',
        business: 'demonstrates strong growth trajectory with expanding market presence and innovative product offerings.',
        valuation: 'premium valuations justified by higher growth rates and market expansion opportunities.',
        quarterly: 'robust revenue acceleration and improving profitability',
        outlook: 'sustained growth momentum',
        management: 'Aggressive expansion plans and strategic partnerships to capture market share.',
        technical: 'Positive momentum with breakout potential above resistance levels.',
        verdict: 'Mid-cap growth story with strong execution capabilities and market positioning.'
      },
      'small': {
        recommendation: 'HOLD',
        thesis: 'Niche positioning with selective growth opportunities',
        business: 'operates in specialized segments with focused business model and targeted customer base.',
        valuation: 'elevated valuations require careful monitoring of execution and growth delivery.',
        quarterly: 'volatile but improving operational performance',
        outlook: 'cautiously optimistic',
        management: 'Focus on operational excellence and market penetration in core segments.',
        technical: 'Consolidation phase with potential for directional move.',
        verdict: 'Suitable for risk-tolerant investors seeking exposure to emerging themes.'
      },
      'micro': {
        recommendation: 'HOLD',
        thesis: 'High-risk, high-reward investment with volatility',
        business: 'operates in emerging sectors with significant growth potential but higher execution risks.',
        valuation: 'speculative valuations based on future growth assumptions rather than current fundamentals.',
        quarterly: 'irregular performance patterns',
        outlook: 'uncertain near-term visibility',
        management: 'Developing strategic roadmap with focus on sustainable business model.',
        technical: 'High volatility with wide trading ranges.',
        verdict: 'Only for experienced investors with high risk tolerance. Monitor closely for fundamental improvements.'
      }
    };
    
    return analyses[category as AnalysisCategory] || analyses['large'];
  }

  private getSectorAnalysisWithNumbers(category: string) {
    type AnalysisCategory = 'large' | 'mid' | 'small' | 'micro';
    
    const analysesWithNumbers: Record<AnalysisCategory, {
      sector: string;
      revenue: string;
      profit: string;
      qoqGrowth: string;
      profitGrowthQoQ: string;
      revenueGrowth: string;
      profitGrowth: string;
      margins: string;
      roe: string;
      debtEquity: string;
      guidanceRevenue: string;
      guidanceMargin: string;
      guidanceCapex: string;
      marketSize: string;
      industryCagr: string;
      marketShare: string;
      currentPE: string;
      industryPE: string;
      forwardPE: string;
      valuation: string;
      technicalTrend: string;
      rsi: string;
      rsiInterpretation: string;
      shortTermOutlook: string;
      longTermOutlook: string;
      multibaggerPotential: string;
      multibaggerReasoning: string;
      riskReward: string;
      recommendation: string;
    }> = {
      'large': {
        sector: 'Large Cap',
        revenue: '12,450',
        profit: '2,180',
        qoqGrowth: '8.4',
        profitGrowthQoQ: '12.1',
        revenueGrowth: '12.3',
        profitGrowth: '15.7',
        margins: '17.5',
        roe: '16.8',
        debtEquity: '0.3',
        guidanceRevenue: '14',
        guidanceMargin: '50',
        guidanceCapex: '1,200',
        marketSize: '2,850',
        industryCagr: '12',
        marketShare: '8.5',
        currentPE: '22.4',
        industryPE: '21.8',
        forwardPE: '19.6',
        valuation: 'Fair to slightly expensive',
        technicalTrend: 'Bullish',
        rsi: '58',
        rsiInterpretation: 'Neutral to positive momentum',
        shortTermOutlook: 'Positive',
        longTermOutlook: 'Strong growth potential with market leadership',
        multibaggerPotential: 'Maybe',
        multibaggerReasoning: 'steady 2-3x returns possible over 3-5 years with consistent execution',
        riskReward: 'Favorable',
        recommendation: 'BUY'
      },
      'mid': {
        sector: 'Mid Cap',
        revenue: '3,850',
        profit: '680',
        qoqGrowth: '15.2',
        profitGrowthQoQ: '22.8',
        revenueGrowth: '24.8',
        profitGrowth: '31.4',
        margins: '17.7',
        roe: '19.2',
        debtEquity: '0.5',
        guidanceRevenue: '25',
        guidanceMargin: '75',
        guidanceCapex: '450',
        marketSize: '950',
        industryCagr: '18',
        marketShare: '4.1',
        currentPE: '28.6',
        industryPE: '24.2',
        forwardPE: '22.8',
        valuation: 'Premium but justified by growth',
        technicalTrend: 'Strong bullish',
        rsi: '65',
        rsiInterpretation: 'Momentum building',
        shortTermOutlook: 'Very positive',
        longTermOutlook: 'High growth potential with market expansion opportunities',
        multibaggerPotential: 'Yes',
        multibaggerReasoning: 'strong execution and market expansion could deliver 3-5x returns over 3-5 years',
        riskReward: 'Very favorable for growth investors',
        recommendation: 'BUY'
      },
      'small': {
        sector: 'Small Cap',
        revenue: '1,250',
        profit: '185',
        qoqGrowth: '12.3',
        profitGrowthQoQ: '18.5',
        revenueGrowth: '18.9',
        profitGrowth: '22.3',
        margins: '14.8',
        roe: '14.5',
        debtEquity: '0.7',
        guidanceRevenue: '20',
        guidanceMargin: '40',
        guidanceCapex: '120',
        marketSize: '420',
        industryCagr: '16',
        marketShare: '2.3',
        currentPE: '32.1',
        industryPE: '26.8',
        forwardPE: '26.8',
        valuation: 'Expensive, requires strong execution',
        technicalTrend: 'Consolidating',
        rsi: '52',
        rsiInterpretation: 'Neutral momentum',
        shortTermOutlook: 'Neutral',
        longTermOutlook: 'Selective growth opportunities in niche markets',
        multibaggerPotential: 'Maybe',
        multibaggerReasoning: 'niche positioning could deliver 2-4x returns if execution is strong over 4-5 years',
        riskReward: 'Moderate, suitable for selective investors',
        recommendation: 'HOLD'
      },
      'micro': {
        sector: 'Micro Cap',
        revenue: '425',
        profit: '45',
        qoqGrowth: '28.5',
        profitGrowthQoQ: '35.2',
        revenueGrowth: '42.8',
        profitGrowth: '51.4',
        margins: '10.6',
        roe: '12.3',
        debtEquity: '1.2',
        guidanceRevenue: '35',
        guidanceMargin: '50',
        guidanceCapex: '85',
        marketSize: '180',
        industryCagr: '25',
        marketShare: '1.8',
        currentPE: '45.2',
        industryPE: '28.5',
        forwardPE: '38.1',
        valuation: 'Speculative valuations based on future growth assumptions',
        technicalTrend: 'Volatile',
        rsi: '45',
        rsiInterpretation: 'High volatility momentum',
        shortTermOutlook: 'High risk',
        longTermOutlook: 'High growth potential but significant execution risks',
        multibaggerPotential: 'Maybe',
        multibaggerReasoning: 'early-stage growth story with 5-10x potential but high execution risk over 5-7 years',
        riskReward: 'High potential returns but extreme volatility',
        recommendation: 'HOLD'
      }
    };
    
    return analysesWithNumbers[category as AnalysisCategory] || analysesWithNumbers['large'];
  }

  private isSectorAppropriateData(companyName: string, conferenceData: any): boolean {
    const name = companyName.toLowerCase();
    
    // Asset management companies shouldn't have capex guidance
    if (name.includes('wealth') || name.includes('asset management') || name.includes('mutual fund') || name.includes('nuvama')) {
      return !conferenceData.capexGuidance || conferenceData.capexGuidance === '';
    }
    
    // Banks and financial services have different metrics
    if (name.includes('bank') || name.includes('financial')) {
      return true;
    }
    
    return true;
  }
}

export const stockAI = new StockAIService();