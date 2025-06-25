import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import CategoryFilter from "@/components/category-filter";
import NewsCard from "@/components/news-card";
import BottomNavigation from "@/components/bottom-navigation";
import type { Article } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('home');
  const [showScrollTop, setShowScrollTop] = useState(false);
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
        title: "Success",
        description: "Articles refreshed successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh articles",
        variant: "destructive",
      });
    },
  });

  // Handle scroll events for showing/hiding scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleArticleClick = (article: Article) => {
    // TODO: Open article detail modal or navigate to detail page
    console.log('Opening article:', article.title);
  };

  const handleShare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.content,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback for browsers without native share
      navigator.clipboard.writeText(`${article.title}\n\n${article.content}\n\nSource: ${article.source}`);
      toast({
        title: "Copied to clipboard",
        description: "Article content copied to clipboard",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    // TODO: Implement pagination
    console.log('Loading more articles...');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header onRefresh={handleRefresh} isRefreshing={refreshMutation.isPending} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
              Failed to Load Articles
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {error instanceof Error ? error.message : 'Please check your Google Sheets integration settings.'}
            </p>
            <Button onClick={handleRefresh} disabled={refreshMutation.isPending}>
              {refreshMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
                No Articles Found
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {selectedCategory === 'all' 
                  ? 'No articles are available at the moment.'
                  : `No articles found for the ${selectedCategory} category.`
                }
              </p>
              <Button onClick={handleRefresh} variant="outline">
                Refresh Articles
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
