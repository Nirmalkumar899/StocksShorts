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
import NewsCard from '@/components/news-card';
import BottomNavigation from '@/components/bottom-navigation';
import { useReadArticles } from '@/hooks/useReadArticles';

import { VisitorStats } from '@/components/visitor-stats';
import Contact from '@/pages/contact';
import Profile from '@/pages/profile';
import Disclaimer from '@/pages/disclaimer';

function SpecialSection({ onBack }: { onBack: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();

  const { data: specialArticles = [], isLoading, error } = useQuery<Article[]>({
    queryKey: ['/api/special-articles'],
    queryFn: async () => {
      const response = await fetch('/api/special-articles', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch special articles');
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const handleArticleClick = (article: Article) => {
    // Modal is handled inside NewsCard - no navigation needed
  };

  const handleShare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: article.title, text: article.content, url: window.location.href });
    }
  };

  const handleToggleExpanded = (articleId: number) => {
    setExpandedArticles(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(articleId)) newExpanded.delete(articleId);
      else newExpanded.add(articleId);
      return newExpanded;
    });
  };

  return (
    <>
      <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-orange-500 p-4">
        <h1 className="text-xl font-bold text-white text-center">⭐ StocksShorts Special</h1>
        <p className="text-white/80 text-center text-sm">Exclusive insights & analysis</p>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-neutral-600 dark:text-neutral-400">Loading special articles...</p>
            </div>
          </div>
        ) : !specialArticles || specialArticles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">No special articles yet</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center">Check back soon for exclusive content!</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
            {specialArticles.map((article) => (
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
}

interface HomeProps {
  initialCategory?: string;
}

export default function Home({ initialCategory }: HomeProps = {}) {
  const [location, setLocation] = useLocation();
  // Remove category selection - show all articles in clean interface
  const [activeSection, setActiveSection] = useState('home');
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedArticles, setTranslatedArticles] = useState<{ [key: number]: Article }>({});
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { readArticleIds, markAsRead, clearReadHistory } = useReadArticles();

  const lastScrollTopRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Remove all category logic for clean Inshorts-style interface

  // Set active section based on URL
  useEffect(() => {
    if (location === '/disclaimer') {
      setActiveSection('disclaimer');
    } else if (location === '/special') {
      setActiveSection('special');
    } else if (location === '/profile') {
      setActiveSection('profile');
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
  }, []);

  // Fetch all articles without category filtering
  const {
    data: rawArticles = [],
    isLoading,
    error,
    refetch
  } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch('/api/articles', {
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      
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
      
      // Sort articles chronologically (latest first)
      const processedData = data.sort((a: Article, b: Article) => {
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
      
      return processedData;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply translations to articles and filter out read articles
  const articles = useMemo(() => {
    let result = rawArticles || [];
    
    if (isTranslated && Object.keys(translatedArticles).length > 0) {
      console.log("Applying translations to", rawArticles?.length, "articles");
      result = rawArticles.map(article => {
        const translated = translatedArticles[article.id];
        if (translated) {
          return translated;
        }
        return article;
      });
    }
    
    // Filter out articles that have been read
    const unreadArticles = result.filter(article => !readArticleIds.has(article.id));
    console.log("Showing", unreadArticles.length, "unread articles (filtered", result.length - unreadArticles.length, "read)");
    return unreadArticles;
  }, [rawArticles, isTranslated, translatedArticles, readArticleIds]);

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
      console.log("🔄 Translation API call starting with", articles.length, "articles");
      console.log("📄 Sample article for translation:", articles[0]);
      
      try {
        console.log("🌐 Making API request to /api/translate-articles");
        
        // Use direct fetch with longer timeout for translation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
        
        const response = await fetch('/api/translate-articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ articles }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log("📡 Raw response status:", response.status);
        console.log("📡 Raw response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error Response:", errorText);
          throw new Error(`${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("✅ Translation API response received", data.length, "translated articles");
        console.log("📝 Sample translated article:", data[0]);
        return data;
      } catch (error) {
        // Handle AbortError specifically
        if (error.name === 'AbortError') {
          console.error("⏰ Translation request timed out after 2 minutes");
          throw new Error('Translation is taking longer than expected. Please try again with fewer articles.');
        }
        
        // Handle quota exceeded errors with user-friendly message
        if (error.message && error.message.includes('quota exceeded')) {
          console.error("💰 OpenAI API quota exceeded");
          throw new Error('Hindi translation temporarily unavailable due to API limits. Please try again later.');
        }
        
        console.error("💥 Translation API error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
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
    console.log("🔘 TRANSLATE BUTTON CLICKED!");
    console.log("📊 Current state:", { 
      isTranslated, 
      articlesLength: articles?.length,
      mutationPending: translateMutation.isPending,
      mutationError: translateMutation.isError
    });
    
    if (isTranslated) {
      console.log("🔄 Switching back to original content");
      setIsTranslated(false);
      setTranslatedArticles({});
      toast({
        title: "Showing original content",
        description: "Articles are now displayed in English.",
      });
    } else {
      if (articles && articles.length > 0) {
        console.log("🚀 Starting translation for", articles.length, "articles");
        console.log("📋 First article:", articles[0]?.title);
        translateMutation.mutate(articles);
      } else {
        console.log("⚠️ No articles to translate - articles data:", articles);
        toast({
          title: "No articles to translate",
          description: "Please wait for articles to load first.",
          variant: "destructive",
        });
      }
    }
  };

  // Remove category handler for clean interface



  const handleArticleClick = (article: Article) => {
    // Modal is handled inside NewsCard - no navigation needed
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
      case 'contact':
        return <Contact onBack={() => setActiveSection('home')} />;
      case 'profile':
        return <Profile onBack={() => setActiveSection('home')} />;
      case 'disclaimer':
        return <Disclaimer onBack={() => setActiveSection('home')} />;
      case 'special':
        return <SpecialSection onBack={() => setActiveSection('home')} />;
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
        {/* Category filter removed for clean Inshorts-style interface */}
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
        ) : !articles || articles.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
              There are no articles available at the moment.
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
                  onMarkAsRead={markAsRead}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-950 pt-9">
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