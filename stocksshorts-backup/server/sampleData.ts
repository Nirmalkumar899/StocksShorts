import type { Article } from "@shared/schema";

// Sample data for demonstration while Google Sheets is being set up
export const sampleArticles: Article[] = [
  {
    id: 1,
    title: "Nifty jumps 200 pts on June 25 amid ceasefire relief",
    content: "Nifty 50 surged 200.40 pts to close at 25,244.75 on June 25, 2025, buoyed by global optimism after tentative Israel-Iran ceasefire. IT, auto, and media stocks rallied. Volume fell to 260.6 mn vs 450.2 mn on June 24, showing quiet strength. Broader market gains in midcaps and metals also supported sentiment.",
    type: "Trending",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    source: "Economic Times, NSE, ET Now",
    sentiment: "Positive",
    priority: "High",
    imageUrl: null,
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "High-wave Doji signals indecision despite rally",
    content: "Nifty formed a High-Wave Doji on June 25, 2025, settling 25,244.75 (+200 pts). Despite strong gains from ceasefire optimism, lack of sustainable breakout near 25,300 suggests short-term consolidation likely before fresh upmove.",
    type: "Trending",
    time: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    source: "LiveMint",
    sentiment: "Neutral",
    priority: "High",
    imageUrl: null,
    createdAt: new Date(),
  },
  {
    id: 3,
    title: "Understanding Stock Market Volatility: A Beginner's Guide",
    content: "Stock market volatility can be intimidating for new investors. Learn the key factors that drive market movements, how to analyze price fluctuations, and strategies to manage risk in your investment portfolio effectively.",
    type: "Educational",
    time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    source: "StocksShorts Academy",
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
    source: "StocksShorts Analysis",
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