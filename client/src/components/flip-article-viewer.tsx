import { useState, useEffect, useCallback } from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { Share2 } from '@/lib/icons';
import { getContextualImage } from '@/lib/imageUtils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import type { Article } from '@shared/schema';

interface FlipArticleViewerProps {
  articles: Article[];
  initialIndex?: number;
  onArticleClick: (article: Article) => void;
}

export default function FlipArticleViewer({ 
  articles, 
  initialIndex = 0, 
  onArticleClick 
}: FlipArticleViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const currentArticle = articles[currentIndex] || null;

  // Spring animation for smooth transitions - optimized for Inshorts-like feel
  const [{ y }, api] = useSpring(() => ({ 
    y: 0,
    config: { 
      tension: 300, 
      friction: 30,
      mass: 0.8
    }
  }));

  // Navigate to next/previous article
  const navigateToArticle = useCallback((index: number) => {
    if (index >= 0 && index < articles.length) {
      setCurrentIndex(index);
      // Reset image error state for new article
      setImageError(prev => ({ ...prev, [articles[index].id]: false }));
    }
  }, [articles]);

  // Gesture handling - optimized for smooth Inshorts-like feel
  const bind = useDrag(
    ({ last, movement: [, my], direction: [, dy], velocity: [, vy], active }) => {
      // More sensitive trigger for smoother experience
      const trigger = Math.abs(my) > 30 || Math.abs(vy) > 0.3;
      
      if (last && trigger) {
        if (dy > 0 && currentIndex > 0) {
          // Swipe down - go to previous article
          navigateToArticle(currentIndex - 1);
        } else if (dy < 0 && currentIndex < articles.length - 1) {
          // Swipe up - go to next article
          navigateToArticle(currentIndex + 1);
        }
        api.start({ 
          y: 0, 
          immediate: false,
          config: { tension: 300, friction: 30 }
        });
      } else if (active) {
        // During drag, follow the finger with reduced movement for better control
        api.start({ 
          y: my * 0.5, // Reduce movement sensitivity 
          immediate: true 
        });
      }
    },
    {
      axis: 'y',
      bounds: { top: -80, bottom: 80 },
      rubberband: true,
      filterTaps: true,
    }
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        navigateToArticle(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < articles.length - 1) {
        navigateToArticle(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, articles.length, navigateToArticle]);

  const handleShare = async (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    
    trackEvent('article_share', 'engagement', article.type, article.id);
    
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
  };

  const handleArticleClick = (article: Article) => {
    // Check authentication for special articles
    if (article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading) {
      toast({
        title: "Login Required",
        description: "Please go to Profile section to login and read the full article",
        variant: "destructive",
      });
      return;
    }
    
    trackEvent('article_view', 'engagement', article.type, article.id);
    onArticleClick(article);
  };

  const getTruncatedContent = (content: string) => {
    if (!content || content.trim().length === 0) {
      return 'No content available';
    }
    
    // For Inshorts-style, show optimal amount of content for the smaller layout
    const maxLength = 600; // Reduced for better UX
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength) + '...';
  };

  if (!currentArticle) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-400">No articles available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-white dark:bg-gray-900">



      {/* Article content */}
      <animated.div
        {...bind()}
        style={{ y }}
        className="h-full w-full touch-pan-y cursor-grab active:cursor-grabbing"
        onClick={() => handleArticleClick(currentArticle)}
      >
        <div className="h-full w-full flex flex-col">
          {/* Article image - smaller, only takes 35% of viewport */}
          <div className="h-[35vh] relative">
            <img
              src={currentArticle.imageUrl || getContextualImage(currentArticle)}
              alt={currentArticle.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                if (!imageError[currentArticle.id]) {
                  setImageError(prev => ({ ...prev, [currentArticle.id]: true }));
                  e.currentTarget.src = getContextualImage(currentArticle);
                }
              }}
            />
            
            {/* Light gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {/* Article content - takes remaining space */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden">
            {/* Share button */}
            <button
              onClick={(e) => handleShare(e, currentArticle)}
              className="absolute top-3 right-3 z-10 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
              aria-label="Share article"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <div className="flex-1 p-4 overflow-y-auto">
              {/* Title */}
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pr-12 leading-tight">
                {currentArticle.title}
              </h1>

              {/* Content */}
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">
                {currentArticle.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
                  <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-300">
                      {currentArticle.content.substring(0, 200)}...
                    </p>
                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
                      <p className="text-blue-800 dark:text-blue-200 font-semibold text-center text-sm">
                        🔒 Login required to read full article
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs text-center mt-1">
                        Go to Profile section to login
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {getTruncatedContent(currentArticle.content)}
                  </div>
                )}
              </div>

              {/* Tap to read more hint */}
              {currentArticle.content && currentArticle.content.length > 600 && (
                <div className="text-blue-600 dark:text-blue-400 text-sm font-medium text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg mt-4">
                  👆 Tap to read full article
                </div>
              )}

              {/* Source and date - with two line gap after content */}
              <div className="mt-8 bg-black text-white p-4 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-white/90 font-medium">
                    {new Date(currentArticle.time || new Date()).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })} • {new Date(currentArticle.time || new Date()).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                  
                  <div>
                    {(currentArticle as any).sourceUrl ? (
                      <a 
                        href={(currentArticle as any).sourceUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-100 underline font-medium transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {currentArticle.source}
                      </a>
                    ) : (
                      <span className="text-white font-medium">
                        {currentArticle.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </animated.div>

      {/* Swipe instruction overlay (shown briefly) */}
      {currentIndex === 0 && articles.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white px-4 py-2 rounded-full text-sm animate-pulse">
          Swipe up for next article
        </div>
      )}
    </div>
  );
}