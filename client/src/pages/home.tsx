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

import { Download, Languages, Loader2 as Loader2Icon } from "@/lib/icons";

function SpecialSection({ onBack }: { onBack: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedArticles, setTranslatedArticles] = useState<{ [key: number]: Article }>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: specialArticles = [], isLoading, error } = useQuery<Article[]>({
    queryKey: ['/api/special-articles'],
    queryFn: async () => {
      const response = await fetch('/api/special-articles', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch special articles');
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const { data: cachedTranslations } = useQuery<{
    translations: { [key: number]: { titleHi: string; contentHi: string } };
  }>({
    queryKey: ['/api/translations'],
    staleTime: 30 * 1000,
  });

  const translateMutation = useMutation({
    mutationFn: async (articles: Article[]) => {
      const cached = cachedTranslations?.translations || {};
      const translatedCount = articles.filter(a => cached[a.id]).length;
      
      if (translatedCount > 0) {
        return articles.map(article => {
          const translation = cached[article.id];
          if (translation) {
            return { ...article, title: translation.titleHi, content: translation.contentHi };
          }
          return article;
        });
      }
      
      const response = await fetch('/api/translate-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ articles }),
      });
      if (!response.ok) throw new Error('Translation failed');
      return response.json();
    },
    onSuccess: (data: Article[]) => {
      const translatedMap: { [key: number]: Article } = {};
      data.forEach(article => { translatedMap[article.id] = article; });
      setTranslatedArticles(translatedMap);
      setIsTranslated(true);
      toast({ title: "हिंदी में देखें", description: "Articles translated to Hindi." });
    },
  });

  const handleTranslate = () => {
    if (isTranslated) {
      setIsTranslated(false);
      setTranslatedArticles({});
      toast({ title: "English", description: "Showing original content." });
    } else if (specialArticles.length > 0) {
      translateMutation.mutate(specialArticles);
    }
  };

  const displayArticles = useMemo(() => {
    if (!isTranslated) return specialArticles;
    return specialArticles.map(article => translatedArticles[article.id] || article);
  }, [specialArticles, isTranslated, translatedArticles]);

  const getMobileInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    if (isIOS) {
      return { title: "📱 Add to iPhone", steps: ["Tap Share (⬆️)", "Tap 'Add to Home Screen'"] };
    }
    return { title: "📱 Add to Android", steps: ["Tap menu (⋮)", "Tap 'Add to Home screen'"] };
  };

  const handleInstallClick = () => {
    const instructions = getMobileInstructions();
    alert(`${instructions.title}\n\n${instructions.steps.join('\n')}`);
  };

  const handleArticleClick = (article: Article) => {};

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">⭐ StocksShorts Special</h1>
            <p className="text-white/80 text-sm">Exclusive insights & analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTranslate}
              disabled={translateMutation.isPending}
              className={`rounded-full px-3 py-2 text-sm font-bold shadow-lg transition-all ${
                isTranslated 
                  ? 'bg-white/90 text-orange-600 hover:bg-white' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              data-testid="button-special-translate"
            >
              {translateMutation.isPending ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Languages className="h-4 w-4 mr-1" />
                  {isTranslated ? 'हिंदी' : 'EN'}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInstallClick}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-2 text-sm font-bold"
              data-testid="button-special-save"
            >
              <Download className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-neutral-600 dark:text-neutral-400">Loading special articles...</p>
            </div>
          </div>
        ) : !displayArticles || displayArticles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white mb-2">No special articles yet</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center">Check back soon for exclusive content!</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
            {displayArticles.map((article) => (
              <div key={article.id} className="min-h-[400px] h-full snap-start">
                <NewsCard
                  article={article}
                  onClick={() => handleArticleClick(article)}
                  onShare={(e) => handleShare(e, article)}
                  isExpanded={expandedArticles.has(article.id)}
                  onToggleExpanded={() => handleToggleExpanded(article.id)}
                  section="special"
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
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
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

  // Fetch cached translations for instant toggle
  const { data: cachedTranslations, refetch: refetchTranslations } = useQuery<{
    translations: { [key: number]: { titleHi: string; contentHi: string } };
    stats: { translatedCount: number; isTranslating: boolean };
  }>({
    queryKey: ['/api/translations'],
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const translateMutation = useMutation({
    mutationFn: async (articles: Article[]) => {
      console.log("🔄 Checking cached translations first...");
      
      // First try to use cached translations (instant)
      const cached = cachedTranslations?.translations || {};
      const cachedCount = Object.keys(cached).length;
      
      // Count how many articles have translations
      const translatedCount = articles.filter(a => cached[a.id]).length;
      const coveragePercent = articles.length > 0 ? (translatedCount / articles.length) * 100 : 0;
      
      console.log(`📊 Translation coverage: ${translatedCount}/${articles.length} (${coveragePercent.toFixed(0)}%)`);
      
      // Use cached if we have at least 50% coverage
      if (cachedCount > 0 && coveragePercent >= 50) {
        console.log(`✅ Found ${cachedCount} cached translations - using instantly!`);
        
        // Apply cached translations to articles
        const translatedArticles = articles.map(article => {
          const translation = cached[article.id];
          if (translation) {
            return {
              ...article,
              title: translation.titleHi,
              content: translation.contentHi
            };
          }
          return article;
        });
        
        return translatedArticles;
      }
      
      // Fallback: Call API for uncached translations
      console.log("🌐 No cached translations, calling API for all articles...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      
      const response = await fetch('/api/translate-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ articles }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
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
        title: "हिंदी में देखें",
        description: "Articles translated to Hindi.",
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
                  section="allnews"
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