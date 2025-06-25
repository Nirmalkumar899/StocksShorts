import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Article } from '@shared/schema';

import Header from '@/components/header';
import CategoryFilter from '@/components/category-filter';
import NewsCard from '@/components/news-card';
import BottomNavigation from '@/components/bottom-navigation';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch articles based on selected category
  const {
    data: articles = [],
    isLoading,
    error,
    refetch
  } = useQuery<Article[]>({
    queryKey: ['/api/articles', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory !== 'all' ? `/api/articles?category=${selectedCategory}` : '/api/articles';
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch articles');
      }
      
      const data = await response.json();
      console.log('Fetched articles:', data); // Debug log
      
      // Sort articles by priority when in 'all' (trending) category
      if (selectedCategory === 'all') {
        return data.sort((a: Article, b: Article) => {
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
          return bPriority - aPriority; // High priority first
        });
      }
      
      return data;
    },
  });

  // Refresh articles mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/articles/refresh');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Articles refreshed",
        description: "Latest articles have been loaded from Google Sheets.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleArticleClick = (article: Article) => {
    // Handle article click - could open modal or navigate
    console.log('Article clicked:', article);
  };

  const handleShare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    // Handle share functionality
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.content,
        url: window.location.href,
      });
    }
  };

  const handleTabChange = (tab: string) => {
    console.log('Tab clicked:', tab);
    if (tab === 'home') {
      // Already on home, do nothing
      return;
    } else if (tab === 'sebi-ria') {
      console.log('Navigating to SEBI RIA');
      window.location.href = '/sebi-ria';
    } else if (tab === 'contact') {
      console.log('Navigating to Contact');
      window.location.href = '/contact';
    } else if (tab === 'profile') {
      console.log('Navigating to Profile');
      window.location.href = '/profile';
    }
  };

  // Debug log
  console.log('Articles data:', articles, 'Loading:', isLoading, 'Error:', error);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-950">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header onRefresh={handleRefresh} isRefreshing={refreshMutation.isPending} />
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
        ) : articles.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
              {selectedCategory === 'all' 
                ? "There are no articles available at the moment." 
                : `No articles found in the ${selectedCategory} category.`
              }
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleRefresh}
                disabled={refreshMutation.isPending}
                className="min-w-[140px]"
              >
                {refreshMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Articles
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // News Cards - Inshorts style full-screen layout
          <div className="h-full overflow-y-auto snap-y snap-mandatory">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={() => handleArticleClick(article)}
                onShare={(e) => handleShare(e, article)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0">
        <BottomNavigation activeTab="home" onTabChange={() => {}} />
      </div>
    </div>
  );
}