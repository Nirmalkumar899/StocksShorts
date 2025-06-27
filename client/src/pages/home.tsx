import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Article } from '@shared/schema';
import { getContextualImage } from '@/lib/imageUtils';

import Header from '@/components/header';
import CategoryFilter from '@/components/category-filter';
import NewsCard from '@/components/news-card';
import BottomNavigation from '@/components/bottom-navigation';
import AskAI from '@/components/ask-ai';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Preload investment advisors data for faster navigation
  useQuery({
    queryKey: ["/api/investment-advisors"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Preload images for visible articles
  const preloadImages = useCallback((articleList: Article[]) => {
    const imagesToPreload = articleList.slice(0, 8); // Preload first 8 images
    imagesToPreload.forEach(article => {
      const img = new Image();
      img.src = article.imageUrl || getContextualImage(article);
      img.loading = 'eager';
    });
  }, []);

  // Fetch articles based on selected category
  const {
    data: articles = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/articles', selectedCategory === 'all' ? undefined : selectedCategory],
    staleTime: 30 * 1000, // 30 seconds cache
    onSuccess: (data) => {
      if (data && data.length > 0) {
        preloadImages(data);
      }
    }
  });

  // Refresh articles mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/articles/refresh", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Articles Refreshed",
        description: "Latest articles have been loaded",
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh articles",
        variant: "destructive",
      });
    }
  });

  // Enhanced category change handler with preloading
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  // Enhanced refresh handler
  const handleRefresh = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  // Memoized filtered articles for performance
  const filteredArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];

    let filtered = articles;

    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryMap: { [key: string]: string[] } = {
        'trending': ['Nifty', 'Breakout Stock', 'Most Active'],
        'special': ['StocksShorts Special'],
        'breakout': ['Breakout Stock'],
        'index': ['Nifty'],
        'warrants': ['Warrants'],
        'educational': ['Educational'],
        'ipo': ['IPO'],
        'global': ['Global'],
        'active': ['Most Active'],
        'orders': ['Order Win'],
        'research': ['Research Report'],
        'ai-news': ['AI News']
      };
      
      const targetCategories = categoryMap[selectedCategory] || [selectedCategory];
      filtered = filtered.filter(article => 
        targetCategories.some(cat => 
          article.type?.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    // Sort by priority and creation date
    return filtered.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [articles, selectedCategory]);

  // Debug log
  console.log('Articles data:', articles, 'Loading:', isLoading, 'Error:', error);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-950">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header onRefresh={handleRefresh} isRefreshing={refreshMutation.isPending} />
        <div className="px-4">
          <AskAI isHighlighted={true} />
        </div>
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          // Loading State
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-neutral-600 dark:text-neutral-400">Loading articles...</p>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
              {selectedCategory === 'all' 
                ? 'Try refreshing or check back later for new articles'
                : `No articles available in the ${selectedCategory} category`}
            </p>
            <Button 
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {refreshMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Articles
                </>
              )}
            </Button>
          </div>
        ) : (
          // Articles List
          <div className="h-full overflow-y-auto px-4 pb-24">
            <div className="space-y-6">
              {filteredArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0">
        <BottomNavigation />
      </div>
    </div>
  );
}