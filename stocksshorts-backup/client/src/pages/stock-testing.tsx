import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';

interface TestResult {
  symbol: string;
  success: boolean;
  price?: number;
  pe?: number;
  marketCap?: number;
  roe?: number;
  sector?: string;
  source?: string;
  error?: string;
}

interface TestSummary {
  totalStocks: number;
  successfulTests: number;
  successRate: string;
  averagePrice: string;
  averagePE: string;
  sectorsFound: number;
  sectorBreakdown: { [key: string]: number };
}

export default function StockTesting() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  
  const queryClient = useQueryClient();

  // Test all 20 stocks mutation
  const testAllStocks = useMutation({
    mutationFn: () => apiRequest('/api/stock-testing/test-all', 'POST'),
    onSuccess: (data) => {
      setTestResults(data.results);
      setTestSummary(data.summary);
    },
  });

  // Test specific stocks mutation
  const testSpecificStocks = useMutation({
    mutationFn: (symbols: string[]) => 
      apiRequest('/api/stock-testing/test-stocks', 'POST', { symbols }),
    onSuccess: (data) => {
      setTestResults(data.results);
      setTestSummary(null); // Clear summary for specific tests
    },
  });

  const testTop5Stocks = () => {
    testSpecificStocks.mutate(['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK']);
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap > 100000) {
      return `₹${(marketCap / 100000).toFixed(1)}L Cr`;
    }
    return `₹${marketCap.toLocaleString('en-IN')} Cr`;
  };

  const formatROE = (roe?: number) => {
    if (!roe) return 'N/A';
    return `${(roe * 100).toFixed(1)}%`;
  };

  const getSuccessRate = () => {
    if (testResults.length === 0) return 0;
    const successful = testResults.filter(r => r.success).length;
    return (successful / testResults.length) * 100;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">20-Stock Financial Data Testing</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive testing system for major Indian stocks using GPT-powered financial data extraction
        </p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Controls</CardTitle>
          <CardDescription>
            Test financial data extraction across multiple stocks and data sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => testAllStocks.mutate()}
              disabled={testAllStocks.isPending}
              size="lg"
            >
              {testAllStocks.isPending ? 'Testing All 20 Stocks...' : 'Test All 20 Stocks'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={testTop5Stocks}
              disabled={testSpecificStocks.isPending}
            >
              {testSpecificStocks.isPending ? 'Testing Top 5...' : 'Test Top 5 Stocks'}
            </Button>
          </div>

          {(testAllStocks.isPending || testSpecificStocks.isPending) && (
            <div className="space-y-2">
              <Progress value={33} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Extracting financial data using GPT-3.5-turbo and multiple APIs...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Summary */}
      {testSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{testSummary.successRate}</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{testSummary.averagePrice}</div>
                <div className="text-sm text-muted-foreground">Avg Price</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{testSummary.averagePE}</div>
                <div className="text-sm text-muted-foreground">Avg PE</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{testSummary.sectorsFound}</div>
                <div className="text-sm text-muted-foreground">Sectors</div>
              </div>
            </div>

            {/* Sector Breakdown */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Sector Distribution</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(testSummary.sectorBreakdown).map(([sector, count]) => (
                  <Badge key={sector} variant="secondary">
                    {sector}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Financial data extraction results ({testResults.filter(r => r.success).length}/{testResults.length} successful)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {testResults.map((result) => (
                <div 
                  key={result.symbol}
                  className={`p-4 border rounded-lg ${
                    result.success ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                                   : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.symbol}
                      </Badge>
                      {result.sector && (
                        <Badge variant="outline">{result.sector}</Badge>
                      )}
                    </div>
                    
                    {result.success ? (
                      <Badge variant="default">✓ Success</Badge>
                    ) : (
                      <Badge variant="destructive">✗ Failed</Badge>
                    )}
                  </div>

                  {result.success ? (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Price</div>
                        <div className="text-muted-foreground">{formatPrice(result.price)}</div>
                      </div>
                      <div>
                        <div className="font-medium">PE Ratio</div>
                        <div className="text-muted-foreground">{result.pe?.toFixed(2) || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Market Cap</div>
                        <div className="text-muted-foreground">{formatMarketCap(result.marketCap)}</div>
                      </div>
                      <div>
                        <div className="font-medium">ROE</div>
                        <div className="text-muted-foreground">{formatROE(result.roe)}</div>
                      </div>
                      <div>
                        <div className="font-medium">Source</div>
                        <div className="text-muted-foreground text-xs">{result.source}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading States */}
      {(testAllStocks.isPending || testSpecificStocks.isPending) && testResults.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Testing in Progress...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}