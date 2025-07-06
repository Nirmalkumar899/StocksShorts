// Enhanced company extraction from article content
function extractCompanyFromContent(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Major Indian companies - extract the most prominent one mentioned
  const companies = [
    'reliance', 'tcs', 'tata consultancy', 'infosys', 'hdfc', 'icici', 'adani', 'bajaj',
    'maruti', 'suzuki', 'asian paints', 'wipro', 'hcl', 'titan', 'ultratech', 'grse',
    'cochin shipyard', 'coal india', 'ongc', 'ntpc', 'trent', 'indusind', 'blue star',
    'zensar', 'kaynes', 'kp green', 'nbcc', 'bharti airtel', 'hindalco', 'jsw steel',
    'mahindra', 'hero motocorp', 'kotak mahindra', 'axis bank', 'sun pharma', 'dr reddy',
    'cipla', 'lupin', 'biocon', 'divis', 'aurobindo pharma', 'vedanta', 'hindalco',
    'tata steel', 'jio', 'airtel', 'vodafone idea', 'bpcl', 'ioc', 'gail', 'power grid',
    'sail', 'bhel', 'hal', 'irctc', 'irfc', 'rvnl', 'pfc', 'rec', 'sjvn', 'nhpc',
    'chemkart', 'happy square', 'travel food', 'cryogenic'
  ];
  
  // Find the first company mentioned (most likely the main subject)
  for (const company of companies) {
    if (lowerText.includes(company)) {
      return company;
    }
  }
  
  return null;
}

// Dynamic image selection based on article content and type
export function getContextualImage(article: { title: string; content: string; type: string; id: number }): string {
  try {
    const { title = '', content = '', type = '', id = 1 } = article || {};
    const combinedText = (title + ' ' + content).toLowerCase();
    
    // Extract the main company being discussed
    const mainCompany = extractCompanyFromContent(combinedText);
    
    // Use article ID to ensure different articles get different images even with similar content
    const imageVariant = (id % 3) + 1;
  
  // Generate images based on the main company being discussed
  if (mainCompany === 'reliance' || combinedText.includes('ril')) {
    const relianceImages = [
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop&auto=format&q=80', // Oil refinery
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Industrial/Petrochemical
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&auto=format&q=80'  // Energy
    ];
    return relianceImages[imageVariant - 1];
  }
  
  if (mainCompany === 'tcs' || mainCompany === 'tata consultancy') {
    const tcsImages = [
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&auto=format&q=80', // Office building
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80', // Business analytics
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format&q=80'  // Corporate
    ];
    return tcsImages[imageVariant - 1];
  }
  
  if (mainCompany === 'infosys') {
    const infosysImages = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Software development
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80', // Technology
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80'  // IT services
    ];
    return infosysImages[imageVariant - 1];
  }
  
  if (mainCompany === 'hdfc') {
    const hdfcImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // Bank building
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop&auto=format&q=80', // Banking
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop&auto=format&q=80'  // Finance
    ];
    return hdfcImages[imageVariant - 1];
  }
  
  if (mainCompany === 'icici') {
    const iciciImages = [
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format&q=80', // Banking services
      'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&h=600&fit=crop&auto=format&q=80', // Financial
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format&q=80'  // Investment
    ];
    return iciciImages[imageVariant - 1];
  }
  
  if (mainCompany === 'adani') {
    const adaniImages = [
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop&auto=format&q=80', // Power plant
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Infrastructure
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Energy
    ];
    return adaniImages[imageVariant - 1];
  }

  // IPO companies
  if (mainCompany === 'chemkart') {
    const chemkartImages = [
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=600&fit=crop&auto=format&q=80', // Chemical laboratory
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format&q=80', // Pharmaceutical/chemical
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Industrial
    ];
    return chemkartImages[imageVariant - 1];
  }

  if (mainCompany === 'travel food') {
    const travelFoodImages = [
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=600&fit=crop&auto=format&q=80', // Food service
      'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=800&h=600&fit=crop&auto=format&q=80', // Restaurant/catering
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format&q=80'  // Food industry
    ];
    return travelFoodImages[imageVariant - 1];
  }

  if (mainCompany === 'happy square') {
    const happySquareImages = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80', // Construction/real estate
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format&q=80', // Business/corporate
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Infrastructure
    ];
    return happySquareImages[imageVariant - 1];
  }

  if (mainCompany === 'cryogenic') {
    const cryogenicImages = [
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Industrial/technology
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Technical equipment
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format&q=80'  // Scientific/industrial
    ];
    return cryogenicImages[imageVariant - 1];
  }
  
  if (combinedText.includes('bajaj')) {
    const bajajImages = [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format&q=80', // Motorcycle
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop&auto=format&q=80', // Finance
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&auto=format&q=80'  // Automotive
    ];
    return bajajImages[imageVariant - 1];
  }
  
  if (combinedText.includes('maruti') || combinedText.includes('suzuki')) {
    const marutiImages = [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&auto=format&q=80', // Cars
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=600&fit=crop&auto=format&q=80', // Automotive
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80'  // Vehicle
    ];
    return marutiImages[imageVariant - 1];
  }
  
  if (combinedText.includes('asian paints')) {
    const asianPaintsImages = [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop&auto=format&q=80', // Paint colors
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80', // Home improvement
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80'  // Construction
    ];
    return asianPaintsImages[imageVariant - 1];
  }
  
  // Educational content specific images
  if (type.toLowerCase().includes('educational') || combinedText.includes('learn') || combinedText.includes('understand')) {
    // Trading and investment education
    if (combinedText.includes('dividend') || combinedText.includes('share') || combinedText.includes('stock')) {
      const educationImages = [
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format&q=80', // Investment concept
        'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop&auto=format&q=80', // Financial planning
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80'  // Business analytics
      ];
      return educationImages[imageVariant - 1];
    }
    
    // Market cap education
    if (combinedText.includes('market cap') || combinedText.includes('large cap') || combinedText.includes('mid cap')) {
      const marketCapImages = [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80', // Market analysis
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80', // Stock charts
        'https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?w=800&h=600&fit=crop&auto=format&q=80'  // Financial data
      ];
      return marketCapImages[imageVariant - 1];
    }
    
    // Candlestick patterns education
    if (combinedText.includes('candlestick') || combinedText.includes('doji') || combinedText.includes('hammer') || combinedText.includes('engulfing')) {
      const candlestickImages = [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80', // Trading charts
        'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&h=600&fit=crop&auto=format&q=80', // Technical analysis
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80'  // Stock patterns
      ];
      return candlestickImages[imageVariant - 1];
    }
  }
  
  // Additional major companies
  if (combinedText.includes('wipro')) {
    const wiproImages = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Technology
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80', // IT consulting
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80'  // Software
    ];
    return wiproImages[imageVariant - 1];
  }
  
  if (combinedText.includes('hcl') || combinedText.includes('hcl tech')) {
    const hclImages = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // IT services
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80', // Technology consulting
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format&q=80'  // Corporate tech
    ];
    return hclImages[imageVariant - 1];
  }
  
  if (combinedText.includes('titan') || combinedText.includes('jewelry')) {
    const titanImages = [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&auto=format&q=80', // Jewelry
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80', // Luxury goods
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=600&fit=crop&auto=format&q=80'  // Retail
    ];
    return titanImages[imageVariant - 1];
  }
  
  if (combinedText.includes('ultratech') || combinedText.includes('cement')) {
    const ultratechImages = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80', // Construction
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Infrastructure
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Industrial
    ];
    return ultratechImages[imageVariant - 1];
  }
  
  if (combinedText.includes('grse') || combinedText.includes('cochin shipyard') || combinedText.includes('shipyard') || combinedText.includes('tug order') || combinedText.includes('marine')) {
    const shipyardImages = [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80', // Naval ship
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&auto=format&q=80', // Shipbuilding
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop&auto=format&q=80'  // Maritime industry
    ];
    return shipyardImages[imageVariant - 1];
  }
  
  if (combinedText.includes('coal india') || combinedText.includes('coal')) {
    const coalImages = [
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Mining
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Energy
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop&auto=format&q=80'  // Industrial
    ];
    return coalImages[imageVariant - 1];
  }
  
  if (combinedText.includes('ongc') || combinedText.includes('oil') || combinedText.includes('gas')) {
    const ongcImages = [
      'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop&auto=format&q=80', // Oil rig
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Petrochemical
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&auto=format&q=80'  // Energy
    ];
    return ongcImages[imageVariant - 1];
  }
  
  if (combinedText.includes('ntpc') || combinedText.includes('power')) {
    const ntpcImages = [
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop&auto=format&q=80', // Power plant
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Energy infrastructure
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Industrial
    ];
    return ntpcImages[imageVariant - 1];
  }
  
  // Focus on target companies, not brokerages
  if (combinedText.includes('trent')) {
    const trentImages = [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=600&fit=crop&auto=format&q=80', // Fashion retail
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80', // Clothing store
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&auto=format&q=80'  // Retail shopping
    ];
    return trentImages[imageVariant - 1];
  }
  
  if (combinedText.includes('indusind bank') || combinedText.includes('indusind')) {
    const indusBankImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // Bank building
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format&q=80', // Banking services
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&auto=format&q=80'  // Financial services
    ];
    return indusBankImages[imageVariant - 1];
  }
  
  if (combinedText.includes('blue star')) {
    const blueStarImages = [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop&auto=format&q=80', // Air conditioning/cooling
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Industrial equipment
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Manufacturing
    ];
    return blueStarImages[imageVariant - 1];
  }
  
  if (combinedText.includes('zensar')) {
    const zensarImages = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Software/IT
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80', // Technology consulting
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80'  // Digital services
    ];
    return zensarImages[imageVariant - 1];
  }
  
  if (combinedText.includes('kaynes technology') || combinedText.includes('kaynes')) {
    const kaynesImages = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Electronics/tech
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80', // EMS manufacturing
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Industrial tech
    ];
    return kaynesImages[imageVariant - 1];
  }
  
  if (combinedText.includes('kp green') || combinedText.includes('solar') || combinedText.includes('renewable')) {
    const solarImages = [
      'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=600&fit=crop&auto=format&q=80', // Solar panels
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop&auto=format&q=80', // Green energy
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&auto=format&q=80'  // Infrastructure
    ];
    return solarImages[imageVariant - 1];
  }
  
  if (combinedText.includes('metro') || combinedText.includes('railway') || combinedText.includes('transport')) {
    const transportImages = [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=600&fit=crop&auto=format&q=80', // Metro/train
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Infrastructure
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80'  // Construction
    ];
    return transportImages[imageVariant - 1];
  }
  
  if (combinedText.includes('garment') || combinedText.includes('textile') || combinedText.includes('export')) {
    const textileImages = [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=600&fit=crop&auto=format&q=80', // Retail/fashion
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80', // Manufacturing
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80'  // Industrial
    ];
    return textileImages[imageVariant - 1];
  }
  
  if (combinedText.includes('nbcc') || combinedText.includes('construction') || combinedText.includes('building')) {
    const constructionImages = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80', // Construction
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Infrastructure
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Industrial
    ];
    return constructionImages[imageVariant - 1];
  }
  
  // Additional Indian companies commonly featured in research reports
  if (combinedText.includes('axis bank') || combinedText.includes('axis direct')) {
    const axisBankImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // Banking
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format&q=80', // Financial services
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&auto=format&q=80'  // Bank building
    ];
    return axisBankImages[imageVariant - 1];
  }
  
  if (combinedText.includes('kotak bank') || combinedText.includes('kotak mahindra')) {
    const kotakImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // Banking
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format&q=80', // Financial services
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80'  // Business analytics
    ];
    return kotakImages[imageVariant - 1];
  }
  
  if (combinedText.includes('sbi cards') || combinedText.includes('state bank')) {
    const sbiImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // Banking
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&auto=format&q=80', // Credit cards
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format&q=80'  // Financial services
    ];
    return sbiImages[imageVariant - 1];
  }
  
  if (combinedText.includes('max india') || combinedText.includes('antara') || combinedText.includes('senior care')) {
    const maxIndiaImages = [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format&q=80', // Healthcare
      'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=800&h=600&fit=crop&auto=format&q=80', // Senior care
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80'  // Healthcare services
    ];
    return maxIndiaImages[imageVariant - 1];
  }
  
  if (combinedText.includes('v2 retail') || combinedText.includes('retail')) {
    const v2RetailImages = [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=600&fit=crop&auto=format&q=80', // Retail shopping
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80', // Store
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&auto=format&q=80'  // Fashion retail
    ];
    return v2RetailImages[imageVariant - 1];
  }
  
  // Order Win and Research Report specific companies
  if (combinedText.includes('kalpataru') || combinedText.includes('transmission') || combinedText.includes('t&d order')) {
    const kalpataruImages = [
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop&auto=format&q=80', // Power transmission
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Electrical infrastructure
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Power lines
    ];
    return kalpataruImages[imageVariant - 1];
  }
  
  if (combinedText.includes('reliance') || combinedText.includes('ril')) {
    const relianceImages = [
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Oil refinery
      'https://images.unsplash.com/photo-1562792399-9b6f94b6bb01?w=800&h=600&fit=crop&auto=format&q=80', // Petrochemicals
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80'  // Retail/Jio
    ];
    return relianceImages[imageVariant - 1];
  }
  
  if (combinedText.includes('infosys') || combinedText.includes('infy')) {
    const infosysImages = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Software development
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80', // Technology consulting
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80'  // Digital services
    ];
    return infosysImages[imageVariant - 1];
  }
  
  if (combinedText.includes('tcs') || combinedText.includes('tata consultancy')) {
    const tcsImages = [
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80', // IT consulting
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80', // Technology
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80'  // Software
    ];
    return tcsImages[imageVariant - 1];
  }
  
  if (combinedText.includes('wipro')) {
    const wiproImages = [
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80', // IT services
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Technology
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80'  // Digital transformation
    ];
    return wiproImages[imageVariant - 1];
  }
  
  if (combinedText.includes('larsen') || combinedText.includes('l&t') || combinedText.includes('lt')) {
    const ltImages = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80', // Construction
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Infrastructure
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format&q=80'  // Engineering
    ];
    return ltImages[imageVariant - 1];
  }
  
  if (combinedText.includes('maruti') || combinedText.includes('suzuki')) {
    const marutiImages = [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop&auto=format&q=80', // Automobile
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=600&fit=crop&auto=format&q=80', // Car manufacturing
      'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=600&fit=crop&auto=format&q=80'  // Automotive
    ];
    return marutiImages[imageVariant - 1];
  }
  
  if (combinedText.includes('bajaj') && (combinedText.includes('finance') || combinedText.includes('housing'))) {
    const bajajFinanceImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // Finance building
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&auto=format&q=80', // Banking
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&auto=format&q=80'  // Financial services
    ];
    return bajajFinanceImages[imageVariant - 1];
  }
  
  if (combinedText.includes('adani') && !combinedText.includes('power')) {
    const adaniImages = [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80', // Ports/shipping
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop&auto=format&q=80', // Infrastructure
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&auto=format&q=80'  // Maritime/logistics
    ];
    return adaniImages[imageVariant - 1];
  }
  
  if (combinedText.includes('hdfc bank') || combinedText.includes('hdfc')) {
    const hdfcImages = [
      'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&h=600&fit=crop&auto=format&q=80', // Banking
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop&auto=format&q=80', // Financial services
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format&q=80'  // Banking hall
    ];
    return hdfcImages[imageVariant - 1];
  }
  
  if (combinedText.includes('icici') || combinedText.includes('icici bank')) {
    const iciciImages = [
      'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=800&h=600&fit=crop&auto=format&q=80', // Modern banking
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&auto=format&q=80', // Digital banking
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&auto=format&q=80'  // Financial institution
    ];
    return iciciImages[imageVariant - 1];
  }
  
  if (combinedText.includes('sun pharma') || combinedText.includes('pharmaceutical')) {
    const sunPharmaImages = [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format&q=80', // Pharmaceutical
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&auto=format&q=80', // Medicine/drugs
      'https://images.unsplash.com/photo-1582560469781-1965b9af903d?w=800&h=600&fit=crop&auto=format&q=80'  // Healthcare
    ];
    return sunPharmaImages[imageVariant - 1];
  }
  
  if (combinedText.includes('titan') || combinedText.includes('jewelry')) {
    const titanImages = [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop&auto=format&q=80', // Luxury retail
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80', // Jewelry/watches
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=600&fit=crop&auto=format&q=80'  // Premium retail
    ];
    return titanImages[imageVariant - 1];
  }
  
  if (combinedText.includes('bharti airtel') || combinedText.includes('airtel')) {
    const airtelImages = [
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=600&fit=crop&auto=format&q=80', // Telecom towers
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop&auto=format&q=80', // Digital communication
      'https://images.unsplash.com/photo-1596522354195-e84ae3c98731?w=800&h=600&fit=crop&auto=format&q=80'  // Network/connectivity
    ];
    return airtelImages[imageVariant - 1];
  }
  
  if (combinedText.includes('servotech') || combinedText.includes('ev charger') || combinedText.includes('electric vehicle')) {
    const servotechImages = [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // EV charging
      'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=600&fit=crop&auto=format&q=80', // Electric vehicle
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80'  // Technology
    ];
    return servotechImages[imageVariant - 1];
  }
  
  if (combinedText.includes('ahluwalia') || combinedText.includes('residential') || combinedText.includes('infra orders')) {
    const ahluwaliaImages = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80', // Construction
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Residential building
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format&q=80'  // Real estate
    ];
    return ahluwaliaImages[imageVariant - 1];
  }
  
  if (combinedText.includes('parin enterprises') || combinedText.includes('edu deal') || combinedText.includes('education')) {
    const parinImages = [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&auto=format&q=80', // Education
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&auto=format&q=80', // Learning
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=600&fit=crop&auto=format&q=80'  // Educational technology
    ];
    return parinImages[imageVariant - 1];
  }
  
  // Move chart patterns to later in the priority order
  
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
  
  // Chart and technical analysis patterns (lower priority)
  if (combinedText.includes('chart') || combinedText.includes('technical') || combinedText.includes('analysis')) {
    const chartImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&h=600&fit=crop&auto=format&q=80'
    ];
    return chartImages[imageVariant - 1];
  }
  
  // Enhanced fallback system based on article type to prevent white/blank images
  if (article.type === 'Order Win') {
    const orderWinFallback = [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format&q=80', // Construction/infrastructure
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80', // Industrial projects
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&h=600&fit=crop&auto=format&q=80'  // Manufacturing
    ];
    return orderWinFallback[imageVariant - 1];
  }

  if (article.type === 'Research Report' || article.type === 'Research Report ') {
    const researchFallback = [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80', // Financial analysis
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80', // Business building
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80'  // Corporate research
    ];
    return researchFallback[imageVariant - 1];
  }

  if (article.type === 'Educational') {
    const educationalFallback = [
      'https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?w=800&h=600&fit=crop&auto=format&q=80', // Trading charts
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80', // Financial analysis
      'https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=800&h=600&fit=crop&auto=format&q=80'  // Learning
    ];
    return educationalFallback[imageVariant - 1];
  }

  if (article.type === 'Crypro') {
    const cryptoFallback = [
      'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80', // Cryptocurrency
      'https://images.unsplash.com/photo-1643116774075-acc00caa9a7b?w=800&h=600&fit=crop&auto=format&q=80', // Digital finance
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format&q=80'  // Blockchain
    ];
    return cryptoFallback[imageVariant - 1];
  }

  // Ultimate fallback - guaranteed to work with more reliable URLs
  const ultimateFallbackImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format', // Stock charts
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format', // Business analytics
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format'  // Financial graphs
  ];
  
  // Ensure imageVariant is always valid (1, 2, or 3)
  const safeVariant = Math.max(1, Math.min(3, imageVariant || 1));
  const finalImage = ultimateFallbackImages[safeVariant - 1];
  
  // Double-check we have a valid URL
  if (!finalImage || finalImage === '') {
    return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80';
  }
  
  return finalImage;
  } catch (error) {
    console.error('Error in getContextualImage:', error);
    // Emergency fallback - always return a working image
    return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format&q=80';
  }
}