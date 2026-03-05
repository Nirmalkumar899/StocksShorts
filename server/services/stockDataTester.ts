import { stockAI } from './stockAI.js';

// Test 20 major Indian stocks to validate data extraction
const testStocks = [
  'TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'ITC', 'SBIN', 'BAJFINANCE', 'BHARTIARTL',
  'ASIANPAINT', 'MARUTI', 'KOTAKBANK', 'LT', 'AXISBANK',
  'NESTLEIND', 'HDFC', 'WIPRO', 'ULTRACEMCO', 'TITAN'
];

export async function testMultipleStocks() {
  console.log('Starting comprehensive stock data test for 20 major Indian stocks...');
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const stock of testStocks) {
    try {
      console.log(`\n=== Testing ${stock} ===`);
      const analysis = await stockAI.analyzeStock(stock);
      
      if (analysis && analysis.length > 500) {
        successCount++;
        console.log(`✅ ${stock}: Successfully analyzed (${analysis.length} characters)`);
        results.push({
          stock,
          status: 'success',
          analysisLength: analysis.length,
          hasData: analysis.includes('₹') && analysis.includes('PE')
        });
      } else {
        failureCount++;
        console.log(`❌ ${stock}: Failed or insufficient data`);
        results.push({
          stock,
          status: 'failure',
          analysisLength: analysis?.length || 0,
          hasData: false
        });
      }
    } catch (error) {
      failureCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ ${stock}: Error - ${errorMessage}`);
      results.push({
        stock,
        status: 'error',
        error: errorMessage,
        hasData: false
      });
    }
  }

  console.log(`\n=== TEST SUMMARY ===`);
  console.log(`Total stocks tested: ${testStocks.length}`);
  console.log(`Successful analyses: ${successCount}`);
  console.log(`Failed analyses: ${failureCount}`);
  console.log(`Success rate: ${((successCount / testStocks.length) * 100).toFixed(1)}%`);

  return results;
}

export async function testSpecificStock(symbol: string) {
  console.log(`Testing detailed analysis for ${symbol}...`);
  try {
    const analysis = await stockAI.analyzeStock(symbol);
    console.log(`Analysis for ${symbol}:`, analysis);
    return analysis;
  } catch (error) {
    console.log(`Error testing ${symbol}:`, error);
    return null;
  }
}