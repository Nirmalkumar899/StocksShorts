import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Article } from '@shared/schema';
import { getContextualImage } from '@/lib/imageUtils';

import Header from '@/components/header';
import CategoryFilter from '@/components/category-filter';
import NewsCard from '@/components/news-card';
import BottomNavigation from '@/components/bottom-navigation';

import { VisitorStats } from '@/components/visitor-stats';
import SebiRia from '@/pages/sebi-ria';
import Contact from '@/pages/contact';
import Profile from '@/pages/profile';
import Disclaimer from '@/pages/disclaimer';
import AISection from '@/pages/ai-section';

export default function Home() {
  const [location, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [activeSection, setActiveSection] = useState('home');
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedArticles, setTranslatedArticles] = useState<{ [key: number]: Article }>({});
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const lastScrollTopRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Category order for auto-switching - Trending → Special → KalkaBazaar → IPO → ... → Educational → US Market → Crypto
  const categoryOrder = [
    'trending',
    'stocksshorts-special',
    'kalkabazaar',
    'ipo',
    'breakout-stocks',
    'warrants',
    'order-win',
    'research-report',
    'educational',
    'us-market',
    'crypto'
  ];

  // Map URLs to categories for subpage support
  const urlToCategoryMap: { [key: string]: string } = {
    '/': 'trending',
    '/home': 'trending',
    '/trending': 'trending',
    '/special': 'stocksshorts-special',
    '/breakout': 'breakout-stocks',
    '/kalkabazaar': 'kalkabazaar',
    '/warrants': 'warrants',
    '/educational': 'educational',
    '/ipo': 'ipo',
    '/global': 'global',
    '/orders': 'order-win',
    '/research': 'research-report',
    '/us-market': 'us-market',
    '/crypto': 'crypto',
    '/disclaimer': 'trending'
  };

  // Set category based on URL - start with Trending by default
  useEffect(() => {
    const categoryFromUrl = urlToCategoryMap[location] || 'trending';
    setSelectedCategory(categoryFromUrl);
    
    // Set active section based on URL
    if (location === '/disclaimer') {
      setActiveSection('disclaimer');
    } else {
      setActiveSection('home');
    }
  }, [location]);

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

  // Fast section switching handler
  const handleSectionChange = useCallback((section: string) => {
    console.log('Tab clicked:', section);
    setActiveSection(section);
    if (section === 'sebi-ria') {
      console.log('Navigating to SEBI RIA');
    }
  }, []);

  // Fetch articles based on selected category
  const {
    data: articles = [],
    isLoading,
    error,
    refetch
  } = useQuery<Article[]>({
    queryKey: ['/api/articles', selectedCategory === 'trending' ? undefined : selectedCategory],
    queryFn: async () => {
      let url = '/api/articles';
      
      if (selectedCategory !== 'trending') {
        url = `/api/articles?category=${selectedCategory}`;
      }
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error:', errorText);
        throw new Error(errorText || 'Failed to fetch articles');
      }
      
      const data = await response.json();
      console.log('Fetched articles:', data);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', typeof data, data);
        return [];
      }
      
      // Sort articles chronologically when in 'trending' category (latest first)
      let processedData = data;
      if (selectedCategory === 'trending') {
        processedData = data.sort((a: Article, b: Article) => {
          // Parse timestamps, default to 12:01 AM (start of day) if missing
          const getTimestamp = (article: Article) => {
            if (!article.time) {
              // Articles without timestamp are considered uploaded at 12:01 AM start of day
              return new Date('2025-07-05T00:01:00Z').getTime();
            }
            return new Date(article.time).getTime();
          };
          
          const aTime = getTimestamp(a);
          const bTime = getTimestamp(b);
          
          // Sort by most recent first (descending order)
          return bTime - aTime;
        });
      }
      
      // Apply translations if available
      if (isTranslated) {
        return processedData.map(article => translatedArticles[article.id] || article);
      }
      
      return processedData;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        description: "Latest articles have been loaded successfully.",
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

  const translateMutation = useMutation({
    mutationFn: async (articles: Article[]) => {
      console.log("Translation API call starting with", articles.length, "articles");
      try {
        const response = await apiRequest('POST', '/api/translate-articles', { articles });
        const data = await response.json();
        console.log("Translation API response received", data.length, "translated articles");
        return data;
      } catch (error) {
        console.error("Translation API error:", error);
        throw error;
      }
    },
    onSuccess: (data: Article[]) => {
      console.log("Translation success, processing", data.length, "articles");
      const translatedMap: { [key: number]: Article } = {};
      data.forEach(article => {
        translatedMap[article.id] = article;
      });
      setTranslatedArticles(translatedMap);
      setIsTranslated(true);
      toast({
        title: "Content translated",
        description: "All articles have been translated to Hindi.",
      });
    },
    onError: (error: Error) => {
      console.error("Translation mutation error:", error);
      toast({
        title: "Translation failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleTranslate = () => {
    console.log("Translate button clicked", { isTranslated, articlesLength: articles?.length });
    if (isTranslated) {
      setIsTranslated(false);
      setTranslatedArticles({});
      toast({
        title: "Showing original content",
        description: "Articles are now displayed in English.",
      });
    } else {
      if (articles && articles.length > 0) {
        console.log("Starting translation for", articles.length, "articles");
        translateMutation.mutate(articles);
      } else {
        console.log("No articles to translate");
        toast({
          title: "No articles to translate",
          description: "Please wait for articles to load first.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };



  const handleArticleClick = (article: Article) => {
    // Navigate to individual article page where comments section will be visible
    console.log('Article clicked:', article);
    setLocation(`/article/${article.id}`);
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

  // Fast client-side navigation - no page reloads
  const handleTabChange = (tab: string) => {
    handleSectionChange(tab);
  };

  // Debug log
  console.log('Articles data:', articles, 'Loading:', isLoading, 'Error:', error);

  // Render different sections based on activeSection
  const renderSection = () => {
    switch (activeSection) {
      case 'sebi-ria':
        return <SebiRia onBack={() => setActiveSection('home')} />;
      case 'contact':
        return <Contact onBack={() => setActiveSection('home')} />;
      case 'profile':
        return <Profile onBack={() => setActiveSection('home')} />;
      case 'disclaimer':
        return <Disclaimer onBack={() => setActiveSection('home')} />;
      case 'ai-section':
        return <AISection onBack={() => setActiveSection('home')} />;
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header 
          onRefresh={handleRefresh} 
          isRefreshing={refreshMutation.isPending}
          onTranslate={handleTranslate}
          isTranslated={isTranslated}
          isTranslating={translateMutation.isPending}
        />
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
          // News Cards - Inshorts style full-screen layout with seamless transitions
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide transition-all duration-200 ease-in-out"
            onScroll={(e) => {
              const element = e.target as HTMLElement;
              const currentScrollTop = element.scrollTop;
              
              // Store scroll position for reference
              lastScrollTopRef.current = currentScrollTop;
            }}
          >
            {articles.map((article) => (
              <div key={article.id} className="min-h-[400px] h-full snap-start">
                <NewsCard
                  article={article}
                  onClick={() => handleArticleClick(article)}
                  onShare={(e) => handleShare(e, article)}
                  isExpanded={expandedArticles.has(article.id)}
                  onToggleExpanded={() => handleToggleExpanded(article.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-950">
      {renderSection()}
      
      {/* Visitor Stats - Only show on home section */}
      {activeSection === 'home' && <VisitorStats />}
      
      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0">
        <BottomNavigation activeTab={activeSection} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}