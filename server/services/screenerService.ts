import axios from 'axios';

interface ScreenerStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  pb: number;
  roe: number;
  debtToEquity: number;
  sector: string;
  industry: string;
  dayHigh: number;
  dayLow: number;
  volume: number;
}

interface ScreenerSearchResult {
  id: number;
  name: string;
  url: string;
}

export class ScreenerService {
  private baseUrl = 'https://www.screener.in/api';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.screener.in/',
    'X-Requested-With': 'XMLHttpRequest',
  };

  async searchStock(query: string): Promise<ScreenerSearchResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/company/search/`, {
        params: { q: query.trim() },
        headers: this.headers,
        timeout: 5000,
      });

      return response.data || [];
    } catch (error) {
      console.error(`Error searching stock ${query}:`, error);
      return [];
    }
  }

  async getStockData(stockId: number): Promise<ScreenerStockData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/company/${stockId}/`, {
        headers: this.headers,
        timeout: 5000,
      });

      const data = response.data;
      if (!data) return null;

      return {
        symbol: data.bse_code || data.nse_code || '',
        name: data.name || '',
        currentPrice: data.current_price || 0,
        change: data.change || 0,
        changePercent: data.change_percent || 0,
        marketCap: data.market_cap || 0,
        pe: data.pe || 0,
        pb: data.pb || 0,
        roe: data.roe || 0,
        debtToEquity: data.debt_to_equity || 0,
        sector: data.sector || '',
        industry: data.industry || '',
        dayHigh: data.day_high || 0,
        dayLow: data.day_low || 0,
        volume: data.volume || 0,
      };
    } catch (error) {
      console.error(`Error fetching stock data for ID ${stockId}:`, error);
      return null;
    }
  }

  async getStockByName(stockName: string): Promise<ScreenerStockData | null> {
    try {
      const searchResults = await this.searchStock(stockName);
      if (searchResults.length === 0) return null;

      // Take the first (most relevant) result
      const stockData = await this.getStockData(searchResults[0].id);
      return stockData;
    } catch (error) {
      console.error(`Error getting stock data for ${stockName}:`, error);
      return null;
    }
  }

  async getMultipleStocks(stockNames: string[]): Promise<{ [key: string]: ScreenerStockData }> {
    const results: { [key: string]: ScreenerStockData } = {};
    
    for (const stockName of stockNames) {
      const data = await this.getStockByName(stockName);
      if (data) {
        results[stockName.toLowerCase()] = data;
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  // Get top performers from popular stocks
  async getTopPerformers(): Promise<ScreenerStockData[]> {
    const popularStocks = [
      'Reliance Industries', 'TCS', 'HDFC Bank', 'Infosys', 
      'ICICI Bank', 'Bharti Airtel', 'State Bank of India',
      'ITC', 'Hindustan Unilever', 'Kotak Mahindra Bank'
    ];

    const results: ScreenerStockData[] = [];
    
    for (const stock of popularStocks) {
      const data = await this.getStockByName(stock);
      if (data && data.changePercent > 0) {
        results.push(data);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results.sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  }
}

export const screenerService = new ScreenerService();