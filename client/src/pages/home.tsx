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
import FlipArticleViewer from '@/components/flip-article-viewer';
import BottomNavigation from '@/components/bottom-navigation';

import { VisitorStats } from '@/components/visitor-stats';
import SebiRia from '@/pages/sebi-ria';
import Contact from '@/pages/contact';
import Profile from '@/pages/profile';
import Disclaimer from '@/pages/disclaimer';

interface HomeProps {
  initialCategory?: string;
}

export default function Home({ initialCategory }: HomeProps = {}) {
  const [location, setLocation] = useLocation();
  // Remove category selection - show all articles in clean interface
  const [activeSection, setActiveSection] = useState('home');
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedArticles, setTranslatedArticles] = useState<{ [key: number]: Article }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Remove all category logic for clean Inshorts-style interface

  // Set active section based on URL
  useEffect(() => {
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
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Apply translations to articles
  const articles = useMemo(() => {
    if (isTranslated && Object.keys(translatedArticles).length > 0) {
      console.log("Applying translations to", rawArticles?.length, "articles");
      console.log("Translation map has", Object.keys(translatedArticles).length, "entries");
      const result = rawArticles.map(article => {
        const translated = translatedArticles[article.id];
        if (translated) {
          console.log(`Article ${article.id} translated: ${article.title} → ${translated.title}`);
          return translated;
        }
        return article;
      });
      return result;
    }
    console.log("Showing original articles:", rawArticles?.length);
    return rawArticles || [];
  }, [rawArticles, isTranslated, translatedArticles]);

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
        if (error instanceof Error && error.name === 'AbortError') {
          console.error("⏰ Translation request timed out after 2 minutes");
          throw new Error('Translation is taking longer than expected. Please try again with fewer articles.');
        }
        
        // Handle quota exceeded errors with user-friendly message
        if (error instanceof Error && error.message.includes('quota exceeded')) {
          console.error("💰 OpenAI API quota exceeded");
          throw new Error('Hindi translation temporarily unavailable due to API limits. Please try again later.');
        }
        
        console.error("💥 Translation API error details:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown',
          cause: error instanceof Error ? error.cause : undefined
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
    // Navigate to individual article page where comments section will be visible
    console.log('Article clicked:', article);
    setLocation(`/article/${article.id}`);
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
      {/* Fixed Header with enhanced design */}
      <div className="flex-shrink-0 bg-white dark:bg-neutral-900 shadow-sm border-b border-neutral-100 dark:border-neutral-800">
        <Header 
          onRefresh={handleRefresh} 
          isRefreshing={refreshMutation.isPending}
          onTranslate={handleTranslate}
          isTranslated={isTranslated}
          isTranslating={translateMutation.isPending}
        />
        {/* Category filter removed for clean Inshorts-style interface */}
      </div>

      {/* Main Content Area with improved layout */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        {isLoading ? (
          // Enhanced Loading State
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500 dark:text-blue-400" />
                <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full border-2 border-blue-200 dark:border-blue-800 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">Loading Latest News</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                  Fetching the freshest stories from Indian markets...
                </p>
              </div>
              {/* Loading skeleton */}
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse w-3/4"></div>
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        ) : !articles || articles.length === 0 ? (
          // Enhanced Empty State
          <div className="h-full flex flex-col items-center justify-center px-6 py-12">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="relative">
                <div className="text-7xl mb-4 opacity-80">📰</div>
                <div className="absolute inset-0 top-2 text-6xl animate-bounce delay-1000">💭</div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-neutral-800 dark:text-white">
                  No Stories Yet
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-center leading-relaxed">
                  Our newsroom is brewing fresh content. Check back in a moment or tap refresh for the latest market updates.
                </p>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                  size="lg"
                  className="min-w-[160px] h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {refreshMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Refresh Stories
                    </>
                  )}
                </Button>
              </div>
              
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl"></div>
              </div>
            </div>
          </div>
        ) : (
          // Enhanced Inshorts-style flip interface - One article at a time
          <div className="h-full relative">
            <FlipArticleViewer
              articles={articles}
              onArticleClick={handleArticleClick}
            />
            {/* Subtle article counter */}
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white font-medium">
                {articles.length} stories
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative overflow-hidden">
      {/* Subtle background patterns */}
      <div className="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400 via-blue-400 to-purple-400 rounded-full filter blur-3xl"></div>
      </div>
      
      {/* Main content with relative positioning */}
      <div className="relative z-10 h-full flex flex-col">
        {renderSection()}
        
        {/* Visitor Stats - Only show on home section with improved styling */}
        {activeSection === 'home' && (
          <div className="relative z-20">
            <VisitorStats />
          </div>
        )}
        
        {/* Fixed Bottom Navigation with enhanced design */}
        <div className="flex-shrink-0 relative z-30">
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-t border-neutral-200/50 dark:border-neutral-700/50">
            <BottomNavigation activeTab={activeSection} onTabChange={handleTabChange} />
          </div>
        </div>
      </div>
    </div>
  );
}