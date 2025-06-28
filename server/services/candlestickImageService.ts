import { createCanvas } from 'canvas';

interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ChartConfig {
  width: number;
  height: number;
  padding: number;
  backgroundColor: string;
  gridColor: string;
  textColor: string;
  bullishColor: string;
  bearishColor: string;
}

export class CandlestickImageService {
  private defaultConfig: ChartConfig = {
    width: 600,
    height: 400,
    padding: 50,
    backgroundColor: '#ffffff',
    gridColor: '#e0e0e0',
    textColor: '#333333',
    bullishColor: '#00C851', // Green for bullish
    bearishColor: '#ff4444'  // Red for bearish
  };

  // Generate educational candlestick patterns based on content
  private generateEducationalPattern(content: string): CandlestickData[] {
    const lowerContent = content.toLowerCase();
    
    // Detect pattern type from content
    if (lowerContent.includes('doji')) {
      return this.generateDojiPattern();
    } else if (lowerContent.includes('hammer')) {
      return this.generateHammerPattern();
    } else if (lowerContent.includes('engulfing')) {
      return this.generateEngulfingPattern();
    } else if (lowerContent.includes('support') && lowerContent.includes('resistance')) {
      return this.generateSupportResistancePattern();
    } else if (lowerContent.includes('trend')) {
      return this.generateTrendPattern();
    } else {
      return this.generateGenericPattern();
    }
  }

  private generateDojiPattern(): CandlestickData[] {
    const data: CandlestickData[] = [];
    let price = 1000;
    
    for (let i = 0; i < 15; i++) {
      const isDojiCandle = i === 12; // Doji at the end
      
      if (isDojiCandle) {
        // Doji: open = close, long wicks
        data.push({
          open: price,
          close: price,
          high: price * 1.015,
          low: price * 0.985,
          volume: Math.random() * 1000000 + 800000
        });
      } else {
        const change = (Math.random() - 0.5) * 0.02;
        const open = price;
        const close = price * (1 + change);
        data.push({
          open,
          close,
          high: Math.max(open, close) * (1 + Math.random() * 0.005),
          low: Math.min(open, close) * (1 - Math.random() * 0.005),
          volume: Math.random() * 1000000 + 500000
        });
        price = close;
      }
    }
    return data;
  }

  private generateHammerPattern(): CandlestickData[] {
    const data: CandlestickData[] = [];
    let price = 1000;
    
    for (let i = 0; i < 15; i++) {
      const isHammerCandle = i === 12;
      
      if (isHammerCandle) {
        // Hammer: small body, long lower wick
        const open = price;
        const close = price * 1.005; // Small bullish body
        data.push({
          open,
          close,
          high: close * 1.002,
          low: price * 0.97, // Long lower wick
          volume: Math.random() * 1000000 + 800000
        });
        price = close;
      } else {
        const change = i < 10 ? -Math.random() * 0.015 : (Math.random() - 0.3) * 0.02; // Downtrend then reversal
        const open = price;
        const close = price * (1 + change);
        data.push({
          open,
          close,
          high: Math.max(open, close) * (1 + Math.random() * 0.005),
          low: Math.min(open, close) * (1 - Math.random() * 0.005),
          volume: Math.random() * 1000000 + 500000
        });
        price = close;
      }
    }
    return data;
  }

  private generateEngulfingPattern(): CandlestickData[] {
    const data: CandlestickData[] = [];
    let price = 1000;
    
    for (let i = 0; i < 15; i++) {
      const isEngulfingSequence = i >= 11 && i <= 12;
      
      if (isEngulfingSequence) {
        if (i === 11) {
          // Small bearish candle
          const open = price;
          const close = price * 0.995;
          data.push({
            open,
            close,
            high: open * 1.002,
            low: close * 0.998,
            volume: Math.random() * 1000000 + 600000
          });
          price = close;
        } else {
          // Large bullish engulfing candle
          const open = price * 0.992; // Open below previous close
          const close = price * 1.015; // Close above previous open
          data.push({
            open,
            close,
            high: close * 1.002,
            low: open * 0.998,
            volume: Math.random() * 1000000 + 900000
          });
          price = close;
        }
      } else {
        const change = (Math.random() - 0.5) * 0.015;
        const open = price;
        const close = price * (1 + change);
        data.push({
          open,
          close,
          high: Math.max(open, close) * (1 + Math.random() * 0.005),
          low: Math.min(open, close) * (1 - Math.random() * 0.005),
          volume: Math.random() * 1000000 + 500000
        });
        price = close;
      }
    }
    return data;
  }

  private generateSupportResistancePattern(): CandlestickData[] {
    const data: CandlestickData[] = [];
    const basePrice = 1000;
    const resistance = basePrice * 1.05;
    const support = basePrice * 0.95;
    let price = basePrice;
    
    for (let i = 0; i < 20; i++) {
      let change = (Math.random() - 0.5) * 0.02;
      
      // Bounce off support/resistance
      if (price >= resistance * 0.99) {
        change = -Math.abs(change); // Force downward
      } else if (price <= support * 1.01) {
        change = Math.abs(change); // Force upward
      }
      
      const open = price;
      const close = price * (1 + change);
      data.push({
        open,
        close,
        high: Math.max(open, close) * (1 + Math.random() * 0.005),
        low: Math.min(open, close) * (1 - Math.random() * 0.005),
        volume: Math.random() * 1000000 + 500000
      });
      price = close;
    }
    return data;
  }

  private generateTrendPattern(): CandlestickData[] {
    const data: CandlestickData[] = [];
    let price = 1000;
    const trendDirection = Math.random() > 0.5 ? 1 : -1; // 1 for uptrend, -1 for downtrend
    
    for (let i = 0; i < 20; i++) {
      const trendStrength = 0.008 * trendDirection;
      const noise = (Math.random() - 0.5) * 0.015;
      const change = trendStrength + noise;
      
      const open = price;
      const close = price * (1 + change);
      data.push({
        open,
        close,
        high: Math.max(open, close) * (1 + Math.random() * 0.008),
        low: Math.min(open, close) * (1 - Math.random() * 0.008),
        volume: Math.random() * 1000000 + 500000
      });
      price = close;
    }
    return data;
  }

  private generateGenericPattern(): CandlestickData[] {
    return this.generateSupportResistancePattern(); // Default to support/resistance
  }

  // Generate sample candlestick data based on price movement described in article
  private generateCandlestickData(
    currentPrice: number,
    breakoutPrice: number,
    targetPrice: number,
    isBreakout: boolean = true
  ): CandlestickData[] {
    const data: CandlestickData[] = [];
    const numCandles = 20;
    
    // Calculate price range for realistic movement
    const priceRange = Math.abs(targetPrice - breakoutPrice);
    const volatility = priceRange * 0.02; // 2% volatility per candle
    
    let price = currentPrice - (priceRange * 0.3); // Start below breakout level
    
    for (let i = 0; i < numCandles; i++) {
      const isLastCandles = i >= numCandles - 3; // Last 3 candles show breakout
      const isBullish = Math.random() > 0.4 || (isBreakout && isLastCandles);
      
      const open = price;
      const changePercent = isLastCandles && isBreakout ? 
        Math.random() * 0.03 + 0.01 : // 1-4% move for breakout
        (Math.random() - 0.5) * 0.02; // Regular 1% movement
      
      const close = open * (1 + changePercent);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      // Ensure breakout candle crosses the breakout level
      if (isLastCandles && isBreakout && close < breakoutPrice) {
        const adjustedClose = breakoutPrice * (1 + Math.random() * 0.01);
        data.push({
          open,
          high: Math.max(open, adjustedClose) * 1.005,
          low: Math.min(open, adjustedClose) * 0.995,
          close: adjustedClose,
          volume: Math.random() * 1000000 + 500000
        });
      } else {
        data.push({
          open,
          high,
          low,
          close,
          volume: Math.random() * 1000000 + 500000
        });
      }
      
      price = close;
    }
    
    return data;
  }

  // Extract price information from article content
  private extractPriceInfo(content: string): {
    currentPrice: number | null;
    breakoutPrice: number | null;
    targetPrice: number | null;
    isBreakout: boolean;
  } {
    const priceRegex = /₹\s*([0-9,]+(?:\.[0-9]+)?)/g;
    const prices: number[] = [];
    let match;
    
    while ((match = priceRegex.exec(content)) !== null) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        prices.push(price);
      }
    }
    
    const isBreakout = content.toLowerCase().includes('breakout') || 
                      content.toLowerCase().includes('breaks above') ||
                      content.toLowerCase().includes('resistance');
    
    if (prices.length >= 2) {
      // Assume first price is breakout/current, second is target
      return {
        currentPrice: prices[0],
        breakoutPrice: prices[0],
        targetPrice: prices[1],
        isBreakout
      };
    }
    
    return {
      currentPrice: null,
      breakoutPrice: null,
      targetPrice: null,
      isBreakout
    };
  }

  // Create candlestick chart as SVG
  generateCandlestickSVG(
    articleContent: string,
    stockSymbol: string = 'STOCK',
    articleType?: string
  ): string {
    let candleData: CandlestickData[];
    const isEducational = articleType?.toLowerCase().includes('educational');
    
    // Use educational patterns for educational articles
    if (isEducational) {
      candleData = this.generateEducationalPattern(articleContent);
    } else {
      const priceInfo = this.extractPriceInfo(articleContent);
      
      // Use default values if prices not found
      const currentPrice = priceInfo.currentPrice || 1000;
      const breakoutPrice = priceInfo.breakoutPrice || currentPrice;
      const targetPrice = priceInfo.targetPrice || currentPrice * 1.1;
      
      candleData = this.generateCandlestickData(
        currentPrice,
        breakoutPrice,
        targetPrice,
        priceInfo.isBreakout
      );
    }
    
    const config = this.defaultConfig;
    const chartWidth = config.width - 2 * config.padding;
    const chartHeight = config.height - 2 * config.padding;
    
    // Calculate price range
    const allPrices = candleData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    
    // Price to Y coordinate
    const priceToY = (price: number) => {
      return config.padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };
    
    // Generate SVG
    let svg = `
      <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .chart-bg { fill: ${config.backgroundColor}; }
            .grid-line { stroke: ${config.gridColor}; stroke-width: 1; }
            .text { fill: ${config.textColor}; font-family: Arial, sans-serif; font-size: 12px; }
            .title { fill: ${config.textColor}; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; }
            .bullish { fill: ${config.bullishColor}; stroke: ${config.bullishColor}; }
            .bearish { fill: ${config.bearishColor}; stroke: ${config.bearishColor}; }
            .breakout-line { stroke: #FFA500; stroke-width: 2; stroke-dasharray: 5,5; }
            .target-line { stroke: #9C27B0; stroke-width: 2; stroke-dasharray: 3,3; }
          </style>
        </defs>
        
        <!-- Background -->
        <rect width="${config.width}" height="${config.height}" class="chart-bg"/>
        
        <!-- Title -->
        <text x="${config.width / 2}" y="25" text-anchor="middle" class="title">
          ${stockSymbol} - Candlestick Chart
        </text>
    `;
    
    // Grid lines
    for (let i = 0; i <= 5; i++) {
      const y = config.padding + (chartHeight * i) / 5;
      const price = maxPrice - (priceRange * i) / 5;
      svg += `
        <line x1="${config.padding}" y1="${y}" x2="${config.width - config.padding}" y2="${y}" class="grid-line"/>
        <text x="${config.padding - 10}" y="${y + 4}" text-anchor="end" class="text">₹${price.toFixed(0)}</text>
      `;
    }
    
    // Candlesticks
    const candleWidth = chartWidth / candleData.length * 0.6;
    const candleSpacing = chartWidth / candleData.length;
    
    candleData.forEach((candle, index) => {
      const x = config.padding + index * candleSpacing + candleSpacing / 2;
      const isBullish = candle.close > candle.open;
      const bodyTop = priceToY(Math.max(candle.open, candle.close));
      const bodyBottom = priceToY(Math.min(candle.open, candle.close));
      const bodyHeight = bodyBottom - bodyTop;
      
      const className = isBullish ? 'bullish' : 'bearish';
      
      // Wick (high-low line)
      svg += `
        <line x1="${x}" y1="${priceToY(candle.high)}" x2="${x}" y2="${priceToY(candle.low)}" class="${className}" stroke-width="1"/>
      `;
      
      // Body
      svg += `
        <rect x="${x - candleWidth/2}" y="${bodyTop}" width="${candleWidth}" height="${Math.max(bodyHeight, 1)}" class="${className}"/>
      `;
    });
    
    // For non-educational articles, add breakout and target lines
    if (!isEducational) {
      const priceInfo = this.extractPriceInfo(articleContent);
      
      // Breakout line
      if (priceInfo.breakoutPrice) {
        const breakoutY = priceToY(priceInfo.breakoutPrice);
        svg += `
          <line x1="${config.padding}" y1="${breakoutY}" x2="${config.width - config.padding}" y2="${breakoutY}" class="breakout-line"/>
          <text x="${config.width - config.padding - 5}" y="${breakoutY - 5}" text-anchor="end" class="text" fill="#FFA500">
            Breakout: ₹${priceInfo.breakoutPrice.toFixed(0)}
          </text>
        `;
      }
      
      // Target line
      if (priceInfo.targetPrice && priceInfo.targetPrice !== priceInfo.breakoutPrice) {
        const targetY = priceToY(priceInfo.targetPrice);
        svg += `
          <line x1="${config.padding}" y1="${targetY}" x2="${config.width - config.padding}" y2="${targetY}" class="target-line"/>
          <text x="${config.width - config.padding - 5}" y="${targetY - 5}" text-anchor="end" class="text" fill="#9C27B0">
            Target: ₹${priceInfo.targetPrice.toFixed(0)}
          </text>
        `;
      }
    }
    
    svg += '</svg>';
    
    return svg;
  }

  // Convert SVG to base64 data URL for embedding
  generateChartDataURL(articleContent: string, stockSymbol: string = 'STOCK'): string {
    const svg = this.generateCandlestickSVG(articleContent, stockSymbol);
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  // Check if article content suggests it needs a candlestick chart
  shouldGenerateChart(articleContent: string, articleType?: string): boolean {
    const content = articleContent.toLowerCase();
    
    // For educational articles, focus on technical analysis concepts
    if (articleType?.toLowerCase().includes('educational')) {
      const educationalKeywords = [
        'candlestick', 'chart', 'pattern', 'technical analysis',
        'bullish', 'bearish', 'doji', 'hammer', 'engulfing',
        'support', 'resistance', 'trend', 'volume',
        'moving average', 'rsi', 'macd'
      ];
      return educationalKeywords.some(keyword => content.includes(keyword));
    }
    
    // For other articles, require price information
    const keywords = [
      'breakout', 'resistance', 'support', 'technical', 'candlestick',
      'chart pattern', 'price action', 'target', 'stop loss',
      'breaks above', 'breaks below', 'volume surge'
    ];
    
    return keywords.some(keyword => content.includes(keyword)) &&
           /₹\s*[0-9,]+/.test(articleContent); // Contains price information
  }

  // Extract stock symbol from title or content
  extractStockSymbol(title: string, content: string): string {
    // Common Indian stock patterns
    const symbolPatterns = [
      /([A-Z]{2,})\s*:/,  // TCS: or RELIANCE:
      /([A-Z]{2,})\s+breaks?/i,  // TCS breaks or RELIANCE break
      /([A-Z]{2,})\s+surge/i,    // TCS surge
    ];
    
    const text = title + ' ' + content;
    
    for (const pattern of symbolPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback: look for any uppercase words
    const words = title.split(' ');
    for (const word of words) {
      if (/^[A-Z]{2,}$/.test(word) && word.length <= 10) {
        return word;
      }
    }
    
    return 'STOCK';
  }
}

export const candlestickImageService = new CandlestickImageService();