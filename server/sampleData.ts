import type { Article } from "@shared/schema";

// Sample data for demonstration while Google Sheets is being set up
export const sampleArticles: Article[] = [
  {
    id: 1,
    title: "Nifty 50 Hits All-Time High Amid Strong FII Inflows",
    content: "The benchmark Nifty 50 index surged to a new record high of 25,445 points today, driven by robust foreign institutional investor inflows and positive global cues. Banking and IT stocks led the rally with HDFC Bank and Infosys contributing significantly to the gains.",
    type: "Index",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    source: "Economic Times",
    sentiment: "Positive",
    priority: "High",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "New IPO Alert: Tech Startup Files for ₹500 Crore Public Issue",
    content: "A leading fintech startup has filed draft papers with SEBI for an initial public offering worth ₹500 crores. The company plans to use the proceeds for technology upgrades and market expansion across tier-2 cities.",
    type: "IPO",
    time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    source: "Business Standard",
    sentiment: "Positive",
    priority: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: 3,
    title: "Understanding Stock Market Volatility: A Beginner's Guide",
    content: "Stock market volatility can be intimidating for new investors. Learn the key factors that drive market movements, how to analyze price fluctuations, and strategies to manage risk in your investment portfolio effectively.",
    type: "Educational",
    time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    source: "StockShorts Academy",
    sentiment: "Neutral",
    priority: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: 4,
    title: "Global Markets Rally as Fed Signals Rate Cut Pause",
    content: "International markets surged overnight following Federal Reserve Chairman's dovish comments about potential rate cuts. Asian markets opened higher with Japan's Nikkei gaining 2.3% and Hong Kong's Hang Seng up 1.8%.",
    type: "Global",
    time: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    source: "Reuters",
    sentiment: "Positive",
    priority: "High",
    imageUrl: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: 5,
    title: "Breakout Alert: Mid-Cap Stock Crosses Key Resistance",
    content: "ABC Industries has broken above its 200-day moving average with strong volumes, signaling a potential bullish breakout. The stock has formed a cup and handle pattern over the past three months, indicating further upside potential.",
    type: "Breakout Stocks",
    time: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    source: "StockShorts Analysis",
    sentiment: "Positive",
    priority: "High",
    imageUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: 6,
    title: "Weekly Warrants Update: Top Performers This Week",
    content: "Bank Nifty warrants showed exceptional performance this week with 15% average gains. Call warrants on IT stocks also performed well as the sector showed signs of recovery from recent lows.",
    type: "Warrants",
    time: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    source: "Warrant Weekly",
    sentiment: "Positive",
    priority: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: 7,
    title: "Most Active: High Volume Stocks to Watch Today",
    content: "Reliance Industries, HDFC Bank, and TCS are among the most actively traded stocks today with volumes exceeding 5x their average. Institutional buying activity suggests continued interest in these blue-chip names.",
    type: "Most Active",
    time: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
    source: "Market Tracker",
    sentiment: "Neutral",
    priority: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    createdAt: new Date(),
  },
  {
    id: 8,
    title: "Order Win Strategy: How Pro Traders Place Winning Orders",
    content: "Learn the advanced order placement techniques used by professional traders. From stop-loss strategies to profit booking methods, discover how to maximize your trading success rate with proper order management.",
    type: "Order Win",
    time: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
    source: "Trading Mastery",
    sentiment: "Positive",
    priority: "Medium",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
    createdAt: new Date(),
  }
];