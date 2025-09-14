import { storage } from '../storage';

async function addMissingArticles() {
  const today = new Date('2025-09-14');
  const yesterday = new Date('2025-09-13');
  
  const articles = [
    // Breakout articles for today
    {
      title: "Technical Breakout: Reliance Industries Surges Above ₹3000, Targets ₹3200",
      content: "Reliance Industries (RIL) witnessed a strong technical breakout today, surging above the crucial ₹3000 resistance level on heavy volumes. Technical analysts suggest the stock could target ₹3200 in the near term. The breakout was supported by robust buying interest from institutional investors and positive sentiment around the company's new energy ventures.",
      type: "breakout-stocks",
      source: "Technical Times",
      sentiment: "Positive",
      priority: "High",
      newsDate: today
    },
    {
      title: "Chart Pattern Alert: TCS Shows Strong Momentum Breakout Above ₹4100",
      content: "Tata Consultancy Services (TCS) has broken above its 20-day moving average at ₹4100 with significant volume expansion. The IT giant's stock is showing bullish momentum after consolidating for several weeks. Analysts expect the stock to test ₹4300 levels if the breakout sustains above current levels.",
      type: "breakout-stocks", 
      source: "Market Watch",
      sentiment: "Positive",
      priority: "Medium",
      newsDate: today
    },
    
    // Crypto articles for today
    {
      title: "Bitcoin Rallies Above $65,000 as Fed Rate Cut Expectations Rise",
      content: "Bitcoin surged past $65,000 mark today as investors bet on potential Federal Reserve interest rate cuts. The cryptocurrency gained 4.2% in the last 24 hours, with trading volumes hitting $45 billion. Ethereum also showed strength, climbing 3.8% to trade above $3,500. DeFi tokens witnessed renewed interest from institutional players.",
      type: "crypto",
      source: "Crypto Daily",
      sentiment: "Positive", 
      priority: "High",
      newsDate: today
    },
    {
      title: "Indian Crypto Exchange Sees Record Trading Volumes Amid Global Rally",
      content: "Leading Indian cryptocurrency exchanges reported record trading volumes as global crypto markets rallied. WazirX and CoinDCX saw 40% surge in daily trading activity. The rally was driven by renewed institutional interest and positive regulatory developments in the US market. Altcoins including Solana and Cardano gained significantly.",
      type: "crypto",
      source: "Blockchain India",
      sentiment: "Positive",
      priority: "Medium", 
      newsDate: today
    },
    
    // US Market articles for today  
    {
      title: "Wall Street Gains as Fed Rate Cut Hopes Drive Technology Stocks Higher",
      content: "US stock markets closed higher today with the Dow Jones gaining 250 points and Nasdaq up 1.2%. Technology stocks led the rally as investors positioned for potential Federal Reserve rate cuts. Apple, Microsoft, and Google parent Alphabet were among top performers. The S&P 500 touched new weekly highs on optimistic economic data.",
      type: "us-market",
      source: "Wall Street Journal",
      sentiment: "Positive",
      priority: "High",
      newsDate: today
    },
    
    // Breakout articles for yesterday
    {
      title: "HDFC Bank Breaks Key Resistance at ₹1650, Eyes ₹1750 Target",
      content: "HDFC Bank successfully broke above the key resistance level of ₹1650 yesterday with strong volume support. The private sector lender's stock closed at ₹1672, marking a 2.1% gain. Technical charts suggest the next target could be ₹1750 if the breakout sustains. Banking sector showed renewed strength on improved NIM expectations.",
      type: "breakout-stocks",
      source: "Banking Today",
      sentiment: "Positive",
      priority: "High", 
      newsDate: yesterday
    },
    {
      title: "Infosys Momentum Breakout: Stock Surges Above 200-Day Moving Average",
      content: "Infosys demonstrated strong technical momentum yesterday, breaking above its 200-day moving average at ₹1580. The IT services giant gained 1.8% to close at ₹1595. This breakout signals potential trend reversal after months of consolidation. Analysts expect the stock to test ₹1650 resistance in coming sessions.",
      type: "breakout-stocks",
      source: "IT Tracker", 
      sentiment: "Positive",
      priority: "Medium",
      newsDate: yesterday
    },
    
    // Crypto articles for yesterday
    {
      title: "Ethereum Jumps 5% as Layer 2 Solutions Gain Institutional Traction",
      content: "Ethereum posted impressive gains yesterday, rising 5% to $3,480 as major financial institutions showed interest in Layer 2 scaling solutions. Polygon and Arbitrum tokens also surged on increased adoption. The rally came amid reports of several banks exploring Ethereum-based settlement systems for cross-border payments.",
      type: "crypto",
      source: "DeFi Weekly",
      sentiment: "Positive",
      priority: "High",
      newsDate: yesterday
    },
    
    // US Market articles for yesterday
    {
      title: "Dow Jones Ends 180 Points Higher on Strong Consumer Spending Data",
      content: "Wall Street concluded yesterday's session in positive territory with the Dow Jones Industrial Average gaining 180 points. Strong consumer spending data and falling jobless claims boosted investor confidence. The Nasdaq Composite rose 0.8% while the S&P 500 gained 0.6%. Energy stocks outperformed on rising crude oil prices.",
      type: "us-market", 
      source: "Market News",
      sentiment: "Positive",
      priority: "Medium",
      newsDate: yesterday
    }
  ];

  console.log(`Adding ${articles.length} missing articles for today and yesterday...`);
  await storage.storeAiArticles(articles);
  console.log('Successfully added missing articles!');
  
  return articles;
}

// Execute the function
addMissingArticles().catch(console.error);