import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
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
import { VisitorStats } from '@/components/visitor-stats';
import SebiRia from '@/pages/sebi-ria';
import Contact from '@/pages/contact';
import Profile from '@/pages/profile';
import Disclaimer from '@/pages/disclaimer';

export default function Home() {
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeSection, setActiveSection] = useState('home');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const switchingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // Category order for auto-switching - Special first, then others
  const categoryOrder = [
    'stocksshorts-special',
    'all',
    'breakout-stocks',
    'kalkabazaar',
    'warrants',
    'educational',
    'ipo',
    'global',
    'others',
    'order-win',
    'research-report'
  ];

  // Map URLs to categories for subpage support
  const urlToCategoryMap: { [key: string]: string } = {
    '/': 'stocksshorts-special',
    '/home': 'stocksshorts-special',
    '/trending': 'all',
    '/special': 'stocksshorts-special',
    '/breakout': 'breakout-stocks',
    '/kalkabazaar': 'kalkabazaar',
    '/warrants': 'warrants',
    '/educational': 'educational',
    '/ipo': 'ipo',
    '/global': 'global',
    '/others': 'others',
    '/orders': 'order-win',
    '/research': 'research-report',
    '/disclaimer': 'all'
  };

  // Set category based on URL
  useEffect(() => {
    const categoryFromUrl = urlToCategoryMap[location] || 'all';
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
    queryKey: ['/api/articles', selectedCategory === 'all' ? 'trending' : selectedCategory],
    queryFn: async () => {
      let url = '/api/articles';
      
      if (selectedCategory !== 'all') {
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

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Auto-switch to next category when current one ends
  const switchToNextCategory = useCallback(() => {
    if (switchingRef.current) return; // Prevent multiple rapid switches
    
    switchingRef.current = true;
    const currentIndex = categoryOrder.indexOf(selectedCategory);
    const nextIndex = (currentIndex + 1) % categoryOrder.length;
    const nextCategory = categoryOrder[nextIndex];
    
    console.log(`Auto-switching from ${selectedCategory} to ${nextCategory}`);
    setSelectedCategory(nextCategory);
    
    // Reset switching flag after shorter delay for smoother experience
    setTimeout(() => {
      switchingRef.current = false;
    }, 1500);
  }, [selectedCategory, categoryOrder]);

  // Auto-switch to previous category when scrolling up from beginning
  const switchToPreviousCategory = useCallback(() => {
    if (switchingRef.current) return; // Prevent multiple rapid switches
    
    switchingRef.current = true;
    const currentIndex = categoryOrder.indexOf(selectedCategory);
    const previousIndex = (currentIndex - 1 + categoryOrder.length) % categoryOrder.length;
    const previousCategory = categoryOrder[previousIndex];
    
    console.log(`Auto-switching from ${selectedCategory} to ${previousCategory}`);
    setSelectedCategory(previousCategory);
    
    // Reset switching flag after shorter delay for smoother experience
    setTimeout(() => {
      switchingRef.current = false;
    }, 1500);
  }, [selectedCategory, categoryOrder]);

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
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
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
          <div 
            className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
            onScroll={(e) => {
              const element = e.target as HTMLElement;
              const currentScrollTop = element.scrollTop;
              const isAtEnd = currentScrollTop + element.clientHeight >= element.scrollHeight - 20;
              const isAtBeginning = currentScrollTop <= 10;
              const scrollDirection = currentScrollTop > lastScrollTopRef.current ? 'down' : 'up';
              
              // Update last scroll position
              lastScrollTopRef.current = currentScrollTop;
              
              // Auto-switch to next category when scrolling down and reaching end
              if (isAtEnd && articles.length > 0 && !switchingRef.current && scrollDirection === 'down') {
                setTimeout(() => {
                  switchToNextCategory();
                }, 300);
              }
              
              // Auto-switch to previous category when scrolling up and reaching beginning
              if (isAtBeginning && articles.length > 0 && !switchingRef.current && scrollDirection === 'up') {
                setTimeout(() => {
                  switchToPreviousCategory();
                }, 300);
              }
            }}
          >
            {articles.map((article) => (
              <div key={article.id} className="h-full snap-start">
                <NewsCard
                  article={article}
                  onClick={() => handleArticleClick(article)}
                  onShare={(e) => handleShare(e, article)}
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