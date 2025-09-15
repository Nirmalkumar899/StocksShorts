import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, Calendar } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@shared/schema';
import { getContextualImage } from '@/lib/imageUtils';

import NewsCard from '@/components/news-card';
import ArticleFeed from '@/components/article-feed';
import BottomNavigation from '@/components/bottom-navigation';

export default function Special() {
  const [, setLocation] = useLocation();
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Navigation state for bottom navigation
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'home':
        setLocation('/');
        break;
      case 'special':
        setLocation('/special');
        break;
      case 'sebi-ria':
        setLocation('/sebi-ria');
        break;
      case 'profile':
        setLocation('/profile');
        break;
      default:
        break;
    }
  };

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

  // Order articles: High → Medium → Low, then by time within each group
  const sortByTimeDesc = (articles: Article[]) => {
    return [...articles].sort((a, b) => {
      const aTime = new Date(a.time || a.createdAt).getTime();
      const bTime = new Date(b.time || b.createdAt).getTime();
      return bTime - aTime; // Most recent first
    });
  };

  const priorityOrderedArticles = [
    ...sortByTimeDesc(groupedArticles.high),
    ...sortByTimeDesc(groupedArticles.medium),
    ...sortByTimeDesc(groupedArticles.low)
  ];


  return (
    <>
    <div className="inshorts-container fixed inset-0 bg-gray-50 dark:bg-neutral-950">
      {isLoading ? (
        // Loading State - Full Screen
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-neutral-950 z-30">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-500" />
            <p className="text-gray-600 dark:text-gray-400">Loading special content...</p>
          </div>
        </div>
      ) : error ? (
        // Error State - Full Screen
        <div className="fixed inset-0 flex items-center justify-center px-4 bg-gray-50 dark:bg-neutral-950 z-30">
          <Card className="w-full max-w-md allow-scroll">
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
      ) : specialArticles.length === 0 ? (
        // Empty State - Full Screen
        <div className="fixed inset-0 flex items-center justify-center px-4 bg-gray-50 dark:bg-neutral-950 z-30">
          <Card className="w-full max-w-md allow-scroll">
            <CardContent className="text-center p-6">
              <div className="text-yellow-500 text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Special Content Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Articles haven't been published yet. Check back soon!
              </p>
              <Button onClick={handleRefresh} data-testid="refresh-empty">
                <RefreshCw className="mr-2 h-4 w-4" />
                Check for Updates
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Inshorts-style ArticleFeed with Priority Ordering - No containers
        <ArticleFeed
          articles={priorityOrderedArticles}
          priorityGroups={groupedArticles}
          showPriorityDividers={true}
          data-testid="special-article-feed"
        />
      )}

      {/* Floating Refresh Button - Above ArticleFeed */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          size="sm"
          className="bg-white/80 backdrop-blur-sm text-gray-900 hover:bg-white/90 shadow-lg border"
          data-testid="floating-refresh-button"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Fixed Bottom Navigation - Positioned above ArticleFeed */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <BottomNavigation activeTab="special" onTabChange={handleTabChange} />
      </div>
    </div>
  );
}