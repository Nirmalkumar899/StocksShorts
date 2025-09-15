import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import type { Article } from '@shared/schema';
import NewsCard from '@/components/news-card';

interface ArticleFeedProps {
  articles: Article[];
  className?: string;
  priorityGroups?: {
    high: Article[];
    medium: Article[];
    low: Article[];
  };
  showPriorityDividers?: boolean;
}

interface SectionMarker {
  type: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  color: string;
}

const PRIORITY_SECTIONS: Record<string, SectionMarker> = {
  high: {
    type: 'high',
    title: 'Breaking',
    description: 'High Priority News',
    color: 'from-red-500 to-orange-500'
  },
  medium: {
    type: 'medium', 
    title: 'Important',
    description: 'Medium Priority News',
    color: 'from-yellow-500 to-orange-400'
  },
  low: {
    type: 'low',
    title: 'Updates',
    description: 'Additional Content',
    color: 'from-blue-500 to-blue-400'
  }
};

export default function ArticleFeed({ 
  articles, 
  className = '', 
  priorityGroups,
  showPriorityDividers = false 
}: ArticleFeedProps) {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const articleRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Create ordered articles with dividers if priority groups provided
  const orderedArticles = priorityGroups && showPriorityDividers
    ? [
        ...priorityGroups.high,
        ...priorityGroups.medium, 
        ...priorityGroups.low
      ]
    : articles;

  // Get current URL index parameter
  const getCurrentIndexFromUrl = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const indexParam = urlParams.get('i');
    return indexParam ? parseInt(indexParam, 10) : 0;
  }, []);

  // Initialize current index from URL
  useEffect(() => {
    const urlIndex = getCurrentIndexFromUrl();
    if (urlIndex >= 0 && urlIndex < orderedArticles.length) {
      setCurrentIndex(urlIndex);
    }
  }, [orderedArticles.length, getCurrentIndexFromUrl]);

  // Update URL when index changes
  const updateUrl = useCallback((index: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('i', index.toString());
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Scroll to specific article
  const scrollToArticle = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const articleElement = articleRefs.current[index];
    if (articleElement && containerRef.current) {
      articleElement.scrollIntoView({ behavior, block: 'start' });
    }
  }, []);

  // Performance windowing - only render visible articles
  const getVisibleRange = useCallback(() => {
    const windowSize = 4; // Render current ±4 items
    const start = Math.max(0, currentIndex - windowSize);
    const end = Math.min(orderedArticles.length, currentIndex + windowSize + 1);
    return { start, end };
  }, [currentIndex, orderedArticles.length]);

  // Intersection Observer to track current article
  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      root: containerRef.current,
      rootMargin: '-40% 0px -40% 0px', // Trigger when article is 40% visible
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const articleIndex = parseInt(entry.target.getAttribute('data-index') || '0', 10);
          if (articleIndex !== currentIndex) {
            setCurrentIndex(articleIndex);
            updateUrl(articleIndex);
          }
        }
      });
    }, options);

    // Observe all article elements
    articleRefs.current.forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [orderedArticles.length, currentIndex, updateUrl]);

  // Scroll restoration on page load
  useEffect(() => {
    const urlIndex = getCurrentIndexFromUrl();
    if (urlIndex > 0 && urlIndex < orderedArticles.length) {
      // Delay scroll restoration to ensure DOM is ready
      const timer = setTimeout(() => {
        scrollToArticle(urlIndex, 'auto');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [orderedArticles.length, scrollToArticle, getCurrentIndexFromUrl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          if (currentIndex < orderedArticles.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            scrollToArticle(nextIndex);
            updateUrl(nextIndex);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            scrollToArticle(prevIndex);
            updateUrl(prevIndex);
          }
          break;
        case 'Home':
          e.preventDefault();
          setCurrentIndex(0);
          scrollToArticle(0);
          updateUrl(0);
          break;
        case 'End':
          e.preventDefault();
          const lastIndex = orderedArticles.length - 1;
          setCurrentIndex(lastIndex);
          scrollToArticle(lastIndex);
          updateUrl(lastIndex);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, orderedArticles.length, scrollToArticle, updateUrl]);

  // Handle article click
  const handleArticleClick = (article: Article) => {
    setLocation(`/article/${article.id}`);
  };

  // Handle article share
  const handleArticleShare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/article/${article.id}`;
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.content.substring(0, 200) + '...',
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  // Get section marker for priority groups
  const getSectionMarker = (article: Article, index: number) => {
    if (!priorityGroups || !showPriorityDividers) return null;
    
    // Check if this is the first article of a new priority group
    const prevArticle = index > 0 ? orderedArticles[index - 1] : null;
    const currentPriority = article.priority?.toLowerCase() || 'low';
    const prevPriority = prevArticle?.priority?.toLowerCase() || null;
    
    if (currentPriority !== prevPriority) {
      const section = PRIORITY_SECTIONS[currentPriority];
      return section;
    }
    
    return null;
  };

  const { start, end } = getVisibleRange();

  return (
    <div 
      ref={containerRef}
      className={`h-screen overflow-y-auto scroll-smooth ${className}`}
      style={{ 
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth'
      }}
      data-testid="article-feed"
    >
      {orderedArticles.slice(start, end).map((article, virtualIndex) => {
        const actualIndex = start + virtualIndex;
        const sectionMarker = getSectionMarker(article, actualIndex);
        
        return (
          <div key={`${article.id}-${actualIndex}`}>
            {/* Priority Section Marker */}
            {sectionMarker && (
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 snap-start">
                <div className="text-center p-8 max-w-sm">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${sectionMarker.color} flex items-center justify-center`}>
                    <span className="text-2xl font-bold text-white">
                      {sectionMarker.type === 'high' ? '⚡' : sectionMarker.type === 'medium' ? '📰' : '📊'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {sectionMarker.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {sectionMarker.description}
                  </p>
                  <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
                    Swipe up to continue reading
                  </div>
                </div>
              </div>
            )}
            
            {/* Article Card */}
            <div
              ref={(el) => { articleRefs.current[actualIndex] = el; }}
              data-index={actualIndex}
              className="min-h-screen snap-start snap-always"
              style={{ scrollSnapAlign: 'start' }}
            >
              <NewsCard
                data-testid={`article-card-${article.id}`}
                article={article}
                variant="inshorts"
                onClick={() => handleArticleClick(article)}
                onShare={(e) => handleArticleShare(e, article)}
              />
            </div>
          </div>
        );
      })}

      {/* Progress indicator */}
      <div className="fixed bottom-20 right-4 z-10">
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
          {currentIndex + 1} / {orderedArticles.length}
        </div>
      </div>

      {/* Loading placeholder for windowed items */}
      {start > 0 && (
        <div className="min-h-screen snap-start flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-500 text-sm">Loading previous articles...</div>
        </div>
      )}
      
      {end < orderedArticles.length && (
        <div className="min-h-screen snap-start flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-500 text-sm">Loading more articles...</div>
        </div>
      )}
    </div>
  );
}