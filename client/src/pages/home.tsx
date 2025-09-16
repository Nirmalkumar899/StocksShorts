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

  // Article share handler
  const handleShare = useCallback(async (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/article/${article.id}`;
    const shareText = `${article.title}\n\n${article.content.substring(0, 200)}...`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // Fall back to clipboard
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share this article.",
        variant: "destructive",
      });
    }
  }, [toast]);

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
      
      // Add console log after fetch
      console.log('articles length =', processedData.length);
      
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
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              Showing {Math.min(100, articles.length)} articles
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12
            }}>
              {articles.slice(0, 100).map(a => (
                <article key={a.id} style={{ border:'1px solid #e5e5e5', borderRadius:8, overflow:'hidden' }}>
                  <div style={{ height: 160, background:'#f3f4f6' }}>
                    <img src={a.imageUrl} alt={a.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3 }}>{a.title}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#555' }}>{a.content ? a.content.substring(0, 120) + '...' : ''}</p>
                  </div>
                </article>
              ))}
            </div>
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