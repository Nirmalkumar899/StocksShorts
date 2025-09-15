import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ArrowLeft, Star, TrendingUp, Calendar } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@shared/schema';
import { getContextualImage } from '@/lib/imageUtils';

import NewsCard from '@/components/news-card';

interface SpecialProps {
  onBack?: () => void;
}

export default function Special({ onBack }: SpecialProps) {
  const [, setLocation] = useLocation();
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Fetch StocksShorts Special articles
  const {
    data: specialArticles = [],
    isLoading,
    error,
    refetch
  } = useQuery<Article[]>({
    queryKey: ['/api/articles/stocks-special'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch('/api/articles/stocks-special', {
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      
        if (!response.ok) {
          const errorText = await response.text();
          console.error('StocksShorts Special fetch error:', errorText);
          throw new Error(errorText || 'Failed to fetch StocksShorts Special articles');
        }
        
        const data = await response.json();
        console.log('Fetched StocksShorts Special articles:', data);
        
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', typeof data, data);
          return [];
        }
        
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Handle navigation and interactions
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      setLocation('/');
    }
  }, [onBack, setLocation]);

  const handleArticleClick = (article: Article) => {
    console.log('StocksShorts Special article clicked:', article);
    setLocation(`/article/${article.id}`);
  };

  const handleShare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.content,
        url: `${window.location.origin}/article/${article.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/article/${article.id}`);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard",
      });
    }
  };

  const handleToggleExpanded = (articleId: number) => {
    setExpandedArticles(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(articleId)) {
        newExpanded.delete(articleId);
      } else {
        newExpanded.add(articleId);
      }
      return newExpanded;
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  // Group articles by priority for better organization
  const groupedArticles = {
    high: specialArticles.filter(a => a.priority?.toLowerCase() === 'high'),
    medium: specialArticles.filter(a => a.priority?.toLowerCase() === 'medium'),
    low: specialArticles.filter(a => a.priority?.toLowerCase() === 'low')
  };

  const totalArticles = specialArticles.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {isLoading ? (
          // Loading State
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-500" />
              <p className="text-gray-600 dark:text-gray-400">Loading StocksShorts Special content...</p>
            </div>
          </div>
        ) : error ? (
          // Error State
          <div className="flex items-center justify-center py-20">
            <Card className="w-full max-w-md">
              <CardContent className="text-center p-6">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Failed to Load Content
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {error instanceof Error ? error.message : 'Something went wrong'}
                </p>
                <Button onClick={handleRefresh} data-testid="retry-button">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : totalArticles === 0 ? (
          // Empty State
          <div className="flex items-center justify-center py-20">
            <Card className="w-full max-w-md">
              <CardContent className="text-center p-6">
                <div className="text-yellow-500 text-5xl mb-4">⭐</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Special Content Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  StocksShorts Special articles haven't been published yet. Check back soon for exclusive content!
                </p>
                <Button onClick={handleRefresh} data-testid="refresh-empty">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check for Updates
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Articles List
          <div className="space-y-8">
            {/* High Priority Articles */}
            {groupedArticles.high.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    High Priority
                  </h2>
                  <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {groupedArticles.high.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {groupedArticles.high.map((article) => (
                    <div
                      key={article.id}
                      className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg shadow-md border-l-4 border-red-500"
                    >
                      <NewsCard
                        data-testid={`high-priority-article-${article.id}`}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                        onShare={(e) => handleShare(e, article)}
                        isExpanded={expandedArticles.has(article.id)}
                        onToggleExpanded={() => handleToggleExpanded(article.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medium Priority Articles */}
            {groupedArticles.medium.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Medium Priority
                  </h2>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {groupedArticles.medium.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {groupedArticles.medium.map((article) => (
                    <div
                      key={article.id}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg shadow-md border-l-4 border-yellow-500"
                    >
                      <NewsCard
                        data-testid={`medium-priority-article-${article.id}`}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                        onShare={(e) => handleShare(e, article)}
                        isExpanded={expandedArticles.has(article.id)}
                        onToggleExpanded={() => handleToggleExpanded(article.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Priority Articles */}
            {groupedArticles.low.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Additional Content
                  </h2>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                    {groupedArticles.low.length}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {groupedArticles.low.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-blue-400"
                    >
                      <NewsCard
                        data-testid={`low-priority-article-${article.id}`}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                        onShare={(e) => handleShare(e, article)}
                        isExpanded={expandedArticles.has(article.id)}
                        onToggleExpanded={() => handleToggleExpanded(article.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}