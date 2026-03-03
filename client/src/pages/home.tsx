import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Search, ArrowLeft } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { Article } from '@shared/schema';
import { getContextualImage } from '@/lib/imageUtils';

import Header from '@/components/header';
import NewsCard from '@/components/news-card';
import BottomNavigation from '@/components/bottom-navigation';
import { useReadArticles } from '@/hooks/useReadArticles';
import Contact from '@/pages/contact';
import Profile from '@/pages/profile';
import Disclaimer from '@/pages/disclaimer';
import { Download } from "@/lib/icons";

function SpecialSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedArticles, setTranslatedArticles] = useState<{ [key: number]: Article }>({});
  const { toast } = useToast();

  const { data: specialArticles = [], isLoading } = useQuery<Article[]>({
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
          return translation ? { ...article, title: translation.titleHi, content: translation.contentHi } : article;
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
      const map: { [key: number]: Article } = {};
      data.forEach(a => { map[a.id] = a; });
      setTranslatedArticles(map);
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
    return specialArticles.map(a => translatedArticles[a.id] || a);
  }, [specialArticles, isTranslated, translatedArticles]);

  const getMobileInstructions = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return { title: "📱 Add to iPhone", steps: ["Tap Share (⬆️)", "Tap 'Add to Home Screen'"] };
    return { title: "📱 Add to Android", steps: ["Tap menu (⋮)", "Tap 'Add to Home screen'"] };
  };

  return (
    <>
      {/* Special section sub-header */}
      <div className="flex-shrink-0 bg-white dark:bg-black border-b border-gray-100 dark:border-neutral-900 px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-white">⭐ StocksShorts Specials</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => isTranslated && handleTranslate()}
            disabled={translateMutation.isPending || !isTranslated}
            className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${!isTranslated ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-transparent text-gray-400 border-gray-300'}`}
          >EN</button>
          <button
            onClick={() => !isTranslated && handleTranslate()}
            disabled={translateMutation.isPending || isTranslated}
            className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${isTranslated ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-transparent text-gray-400 border-gray-300'}`}
          >हिं</button>
          <button
            onClick={() => { const i = getMobileInstructions(); alert(`${i.title}\n\n${i.steps.join('\n')}`); }}
            className="text-xs font-bold px-3 py-1 rounded-full bg-green-500 text-white flex items-center gap-1"
          >
            <Download className="h-3 w-3" /> Save
          </button>
        </div>
      </div>
      {translateMutation.isPending && (
        <div className="bg-yellow-400 text-black text-center py-1.5 text-xs font-medium flex items-center justify-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Translating...
        </div>
      )}
      <div className="bg-gray-50 dark:bg-neutral-950 px-3 py-1 border-b border-gray-100 dark:border-neutral-900">
        <p className="text-[9px] text-gray-400 dark:text-neutral-600 text-center">Not investment advice. Consult your financial advisor before investing.</p>
      </div>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-orange-500" />
              <p className="text-gray-500 text-sm">Loading specials...</p>
            </div>
          </div>
        ) : !displayArticles || displayArticles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-5xl mb-3">⭐</div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">No special articles yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Check back soon!</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
            {displayArticles.map((article) => (
              <div key={article.id} className="h-full snap-start">
                <NewsCard
                  article={article}
                  onClick={() => {}}
                  onShare={(e) => e.stopPropagation()}
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

function SearchSection({ articles, onClose }: { articles: Article[]; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q) ||
      a.source?.toLowerCase().includes(q) ||
      a.type?.toLowerCase().includes(q)
    );
  }, [query, articles]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* Search header */}
      <div className="flex-shrink-0 border-b border-gray-100 dark:border-neutral-900 px-3 py-2 flex items-center gap-3">
        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, topic, stock..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white rounded-xl border-none outline-none placeholder:text-gray-400"
          />
        </div>
        {query && (
          <button onClick={() => setQuery('')} className="text-gray-400 text-xs px-2 py-1">Clear</button>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Search className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Search for any company, stock, or topic</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">e.g. "Reliance", "IPO", "Nifty"</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No results for "{query}"</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try a different company name or keyword</p>
          </div>
        ) : (
          <div>
            <p className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
            {results.map((article) => (
              <div key={article.id} className="border-b border-gray-50 dark:border-neutral-900">
                <NewsCard
                  article={article}
                  onClick={() => {}}
                  onShare={(e) => e.stopPropagation()}
                  section="allnews"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface HomeProps {
  initialCategory?: string;
}

export default function Home({ initialCategory }: HomeProps = {}) {
  const [location, setLocation] = useLocation();
  const getInitialSection = () => {
    if (initialCategory === 'special') return 'special';
    if (typeof window !== 'undefined' && window.location.pathname === '/special') return 'special';
    if (typeof window !== 'undefined' && window.location.pathname === '/disclaimer') return 'disclaimer';
    if (typeof window !== 'undefined' && window.location.pathname === '/profile') return 'profile';
    return 'home';
  };
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [showSearch, setShowSearch] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedArticles, setTranslatedArticles] = useState<{ [key: number]: Article }>({});
  const [showWhatsAppNotification, setShowWhatsAppNotification] = useState(() => {
    if (typeof window !== 'undefined') return !sessionStorage.getItem('whatsapp_notification_seen');
    return false;
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { readArticleIds, markAsRead } = useReadArticles();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dismissWhatsAppNotification = () => {
    setShowWhatsAppNotification(false);
    sessionStorage.setItem('whatsapp_notification_seen', 'true');
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/917738621246?text=Hi%20StocksShorts!%20I%20have%20a%20stock%20query.', '_blank');
    dismissWhatsAppNotification();
  };

  useEffect(() => {
    if (location === '/disclaimer') setActiveSection('disclaimer');
    else if (location === '/special') setActiveSection('special');
    else if (location === '/profile') setActiveSection('profile');
    else if (location === '/') setActiveSection('home');
  }, [location]);

  const {
    data: rawArticles = [],
    isLoading,
    error,
  } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch('/api/articles', { credentials: 'include', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(await response.text() || 'Failed to fetch articles');
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        return data;
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') throw new Error('Request timed out. Please try again.');
        throw error;
      }
    },
    retry: 2,
    staleTime: 30 * 1000,
    refetchInterval: 10 * 1000,
  });

  const articles = useMemo(() => {
    let result = rawArticles || [];
    if (isTranslated && Object.keys(translatedArticles).length > 0) {
      result = rawArticles.map(a => translatedArticles[a.id] || a);
    }
    return result.filter(a => !readArticleIds.has(a.id));
  }, [rawArticles, isTranslated, translatedArticles, readArticleIds]);

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/articles/refresh');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({ title: "Articles refreshed", description: "Latest articles have been loaded." });
    },
    onError: (error: Error) => {
      toast({ title: "Refresh failed", description: error.message, variant: "destructive" });
    },
  });

  const { data: cachedTranslations } = useQuery<{
    translations: { [key: number]: { titleHi: string; contentHi: string } };
    stats: { translatedCount: number; isTranslating: boolean };
  }>({
    queryKey: ['/api/translations'],
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const translateMutation = useMutation({
    mutationFn: async (articlesToTranslate: Article[]) => {
      const cached = cachedTranslations?.translations || {};
      const cachedCount = Object.keys(cached).length;
      const translatedCount = articlesToTranslate.filter(a => cached[a.id]).length;
      const coveragePercent = articlesToTranslate.length > 0 ? (translatedCount / articlesToTranslate.length) * 100 : 0;

      if (cachedCount > 0 && coveragePercent >= 50) {
        return articlesToTranslate.map(a => {
          const t = cached[a.id];
          return t ? { ...a, title: t.titleHi, content: t.contentHi } : a;
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      const response = await fetch('/api/translate-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ articles: articlesToTranslate }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
      return response.json();
    },
    onSuccess: (data: Article[]) => {
      const map: { [key: number]: Article } = {};
      data.forEach(a => { map[a.id] = a; });
      setTranslatedArticles(map);
      setIsTranslated(true);
      toast({ title: "हिंदी में देखें", description: "Articles translated to Hindi." });
    },
    onError: (error: Error) => {
      toast({ title: "Translation failed", description: error.message, variant: "destructive" });
    },
  });

  const handleTranslate = useCallback(() => {
    if (isTranslated) {
      setIsTranslated(false);
      setTranslatedArticles({});
      toast({ title: "Showing original content", description: "Articles now in English." });
    } else if (articles && articles.length > 0) {
      translateMutation.mutate(articles);
    }
  }, [isTranslated, articles, translateMutation, toast]);

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    if (section === 'home') setLocation('/');
    else if (section === 'special') setLocation('/special');
    else if (section === 'profile') setLocation('/profile');
  }, [setLocation]);

  const renderSection = () => {
    if (showSearch) {
      return <SearchSection articles={rawArticles} onClose={() => setShowSearch(false)} />;
    }
    switch (activeSection) {
      case 'contact':
        return <Contact onBack={() => setActiveSection('home')} />;
      case 'profile':
        return <Profile onBack={() => handleSectionChange('home')} />;
      case 'disclaimer':
        return <Disclaimer onBack={() => setActiveSection('home')} />;
      case 'special':
        return <SpecialSection />;
      default:
        return renderHomeContent();
    }
  };

  const renderHomeContent = () => (
    <>
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 text-sm">Loading articles...</p>
            </div>
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-5xl mb-4">📰</div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">No articles found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-5">No articles available at the moment.</p>
            <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending} size="sm">
              {refreshMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Refreshing...</> : <><RefreshCw className="mr-2 h-4 w-4" />Refresh</>}
            </Button>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
          >
            {articles.map((article) => (
              <div key={article.id} className="h-full snap-start">
                <NewsCard
                  article={article}
                  onClick={() => {}}
                  onShare={(e) => e.stopPropagation()}
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
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      {/* Header — only show when not in search mode and not in profile/disclaimer */}
      {!showSearch && activeSection !== 'profile' && activeSection !== 'disclaimer' && activeSection !== 'contact' && (
        <div className="flex-shrink-0">
          <Header
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onTranslate={activeSection === 'home' ? handleTranslate : undefined}
            isTranslated={isTranslated}
            isTranslating={translateMutation.isPending}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        {renderSection()}
      </div>

      {/* Bottom nav */}
      <div className="flex-shrink-0">
        <BottomNavigation
          activeTab={showSearch ? 'search' : activeSection}
          onTabChange={handleSectionChange}
          onSearchClick={() => { setShowSearch(true); }}
        />
      </div>

      {/* WhatsApp notification */}
      {showWhatsAppNotification && !showSearch && (
        <div className="fixed bottom-20 left-3 right-3 z-[200] animate-in slide-in-from-bottom duration-300">
          <div className="bg-green-600 rounded-2xl p-3 shadow-2xl relative">
            <button
              onClick={dismissWhatsAppNotification}
              className="absolute -top-2 -right-2 bg-white text-green-700 rounded-full w-5 h-5 flex items-center justify-center text-base font-bold shadow-md leading-none"
            >×</button>
            <div className="flex items-center gap-3">
              <div className="text-2xl">🙋‍♂️</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">Ask a HUMAN expert (10+ yrs exp) — FREE!</p>
                <p className="text-white/80 text-xs">Not AI. WhatsApp us for stock queries.</p>
              </div>
              <Button
                onClick={openWhatsApp}
                size="sm"
                className="bg-white hover:bg-gray-100 text-green-700 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md flex-shrink-0 text-xs"
                data-testid="button-whatsapp-chat"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
