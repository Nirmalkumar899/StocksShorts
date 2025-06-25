// Dynamic image selection based on article content and type
export function getContextualImage(article: { title: string; content: string; type: string; id: number }): string {
  const { title, content, type, id } = article;
  const combinedText = (title + ' ' + content).toLowerCase();
  
  // Use article ID to ensure different articles get different images even with similar content
  const imageVariant = (id % 3) + 1;
  
  // Chart and technical analysis patterns
  if (combinedText.includes('chart') || combinedText.includes('technical') || combinedText.includes('analysis')) {
    const chartImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&h=600&fit=crop&auto=format&q=80'
    ];
    return chartImages[imageVariant - 1];
  }
  
  // Add warrants as a specific category before other checks
  if (type.toLowerCase().includes('warrants') || combinedText.includes('warrant')) {
    const warrantImages = [
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?w=800&h=600&fit=crop&auto=format&q=80'
    ];
    return warrantImages[imageVariant - 1];
  }
  
  // Ratio and financial metrics
  if (combinedText.includes('ratio') || combinedText.includes('pe') || combinedText.includes('debt') || combinedText.includes('margin')) {
    const ratioImages = [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80'
    ];
    return ratioImages[imageVariant - 1];
  }
  
  // IPO related
  if (type.toLowerCase().includes('ipo') || combinedText.includes('ipo') || combinedText.includes('listing')) {
    const ipoImages = [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&auto=format&q=80'
    ];
    return ipoImages[imageVariant - 1];
  }
  
  // Banking and financial services
  if (combinedText.includes('bank') || combinedText.includes('hdfc') || combinedText.includes('icici') || combinedText.includes('sbi')) {
    const bankImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&h=600&fit=crop&auto=format'
    ];
    return bankImages[imageVariant - 1];
  }
  
  // IT and technology
  if (combinedText.includes('it') || combinedText.includes('tech') || combinedText.includes('infosys') || combinedText.includes('tcs')) {
    const techImages = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=800&h=600&fit=crop&auto=format'
    ];
    return techImages[imageVariant - 1];
  }
  
  // Global markets and forex
  if (type.toLowerCase().includes('global') || combinedText.includes('global') || combinedText.includes('forex') || combinedText.includes('fed')) {
    const globalImages = [
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=800&h=600&fit=crop&auto=format'
    ];
    return globalImages[imageVariant - 1];
  }
  
  // Crypto and digital assets
  if (combinedText.includes('crypto') || combinedText.includes('bitcoin') || combinedText.includes('blockchain')) {
    const cryptoImages = [
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1518544866864-91a306d5ea1e?w=800&h=600&fit=crop&auto=format'
    ];
    return cryptoImages[imageVariant - 1];
  }
  
  // Mutual funds and investments
  if (combinedText.includes('mutual') || combinedText.includes('fund') || combinedText.includes('sip') || combinedText.includes('investment')) {
    const fundImages = [
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop&auto=format'
    ];
    return fundImages[imageVariant - 1];
  }
  
  // Index and market movements (Nifty, Sensex)
  if (combinedText.includes('nifty') || combinedText.includes('sensex') || combinedText.includes('index')) {
    const indexImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&h=600&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format'
    ];
    return indexImages[imageVariant - 1];
  }
  
  // Default market images for general content
  const defaultImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format'
  ];
  
  return defaultImages[imageVariant - 1];
}