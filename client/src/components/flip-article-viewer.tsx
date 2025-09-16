import { useState, useEffect, useCallback } from 'react';
import { useSpring, animated, useTransition, to } from 'react-spring';
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
  const [isFlipping, setIsFlipping] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const currentArticle = articles[currentIndex] || null;
  const nextArticle = articles[currentIndex + 1] || null;
  const prevArticle = articles[currentIndex - 1] || null;

  // Force re-render when articles change
  useEffect(() => {
    if (articles.length > 0 && currentIndex >= articles.length) {
      setCurrentIndex(0);
    }
  }, [articles.length, currentIndex]);

  // Paper flip animation with realistic physics
  const [{ rotateX, y, scale, opacity }, api] = useSpring(() => ({ 
    rotateX: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    config: { 
      tension: 120, 
      friction: 40,
      mass: 1,
      precision: 0.001
    }
  }));

  // Transitions for paper-like stacking effect
  const transitions = useTransition(currentIndex, {
    from: { 
      transform: 'rotateX(-90deg) translateZ(-50px)',
      opacity: 0,
      zIndex: 0
    },
    enter: { 
      transform: 'rotateX(0deg) translateZ(0px)',
      opacity: 1,
      zIndex: 1
    },
    leave: { 
      transform: 'rotateX(90deg) translateZ(-50px)',
      opacity: 0,
      zIndex: 0
    },
    config: {
      tension: 200,
      friction: 25,
      mass: 0.8
    }
  });

  // Navigate to next/previous article with paper flip animation
  const navigateToArticle = useCallback((index: number, direction: 'up' | 'down') => {
    if (index >= 0 && index < articles.length && !isFlipping) {
      setIsFlipping(true);
      
      // Update current index immediately for instant response
      setCurrentIndex(index);
      setImageError(prev => ({ ...prev, [articles[index].id]: false }));
      
      // Paper flip animation sequence - start flip
      api.start({
        rotateX: direction === 'up' ? -90 : 90,
        scale: 0.95,
        opacity: 0.8,
        config: { tension: 200, friction: 25 },
        onRest: () => {
          // Complete the flip
          api.start({
            rotateX: 0,
            scale: 1,
            opacity: 1,
            y: 0,
            config: { tension: 150, friction: 30 },
            onRest: () => {
              setIsFlipping(false);
            }
          });
        }
      });
    }
  }, [articles, api, isFlipping]);

  // Enhanced gesture handling for paper-like flip experience
  const bind = useDrag(
    ({ last, movement: [, my], direction: [, dy], velocity: [, vy], active }) => {
      const trigger = Math.abs(my) > 50 || Math.abs(vy) > 0.5;
      const flipThreshold = Math.abs(my) > 100 || Math.abs(vy) > 1;
      
      
      if (last && trigger && !isFlipping) {
        if (dy > 0 && currentIndex > 0) {
          // Swipe down - go to previous article
          navigateToArticle(currentIndex - 1, 'down');
        } else if (dy < 0 && currentIndex < articles.length - 1) {
          // Swipe up - go to next article  
          navigateToArticle(currentIndex + 1, 'up');
        } else {
          // Snap back if can't navigate
          api.start({ 
            y: 0,
            rotateX: 0,
            scale: 1,
            opacity: 1,
            config: { tension: 250, friction: 30 }
          });
        }
      } else if (active && !isFlipping) {
        // Paper lift effect during drag
        const progress = Math.min(Math.abs(my) / 200, 1);
        const rotateAmount = my > 0 ? progress * 15 : -progress * 15;
        const scaleAmount = 1 - progress * 0.05;
        const opacityAmount = 1 - progress * 0.2;
        
        api.start({ 
          y: my * 0.3,
          rotateX: rotateAmount,
          scale: scaleAmount,
          opacity: opacityAmount,
          immediate: true 
        });
      }
    },
    {
      axis: 'y',
      bounds: { top: -200, bottom: 200 },
      rubberband: 0.3,
      filterTaps: true,
    }
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        navigateToArticle(currentIndex - 1, 'down');
      } else if (e.key === 'ArrowDown' && currentIndex < articles.length - 1) {
        navigateToArticle(currentIndex + 1, 'up');
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
    <div className="h-full w-full relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950" style={{ perspective: '1000px' }}>
      
      {/* Paper stack effect - show glimpse of next/previous articles */}
      {prevArticle && (
        <div className="absolute inset-0 transform translate-y-1 scale-98 opacity-30 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg" style={{ zIndex: -2 }} />
      )}
      {nextArticle && (
        <div className="absolute inset-0 transform -translate-y-1 scale-98 opacity-30 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg" style={{ zIndex: -1 }} />
      )}

      {/* Main article with paper flip animation */}
      <animated.div
        {...bind()}
        style={{ 
          transform: to([y, rotateX], (yVal, rotVal) => `translateY(${yVal}px) rotateX(${rotVal}deg)`),
          scale,
          opacity,
          transformOrigin: 'center center'
        }}
        className="h-full w-full touch-pan-y cursor-grab active:cursor-grabbing relative"
        onClick={() => handleArticleClick(currentArticle)}
      >
        {/* Paper-like container with shadow and border */}
        <div className="h-full w-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative">
          
          {/* Paper texture overlay */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23000' fill-opacity='0.1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
          }} />
          
          <div className="h-full w-full flex flex-col relative z-10">
            {/* Article image - 35% viewport */}
            <div className="h-[35vh] relative overflow-hidden">
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
              
              {/* Elegant gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Article content with paper-like styling */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
              
              {/* Share button with paper-like styling */}
              <button
                onClick={(e) => handleShare(e, currentArticle)}
                className="absolute top-4 right-4 z-20 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                aria-label="Share article"
              >
                <Share2 className="h-4 w-4" />
              </button>

              <div className="flex-1 p-5 overflow-y-auto">
                {/* Title with paper typography */}
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pr-16 leading-tight tracking-tight">
                  {currentArticle.title}
                </h1>

                {/* Content with newspaper-like styling */}
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-base font-light">
                  {currentArticle.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
                    <div className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        {currentArticle.content.substring(0, 200)}...
                      </p>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 p-4 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
                        <p className="text-blue-800 dark:text-blue-200 font-semibold text-center">
                          🔒 Login required to read full article
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 text-sm text-center mt-1">
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

                {/* Read more hint with paper styling */}
                {currentArticle.content && currentArticle.content.length > 600 && (
                  <div className="text-blue-600 dark:text-blue-400 text-sm font-medium text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl mt-6 border border-blue-100 dark:border-blue-800">
                    👆 Tap to read full article
                  </div>
                )}

                {/* Source and date with newspaper-like footer */}
                <div className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-800 text-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-200 font-medium">
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
        </div>
      </animated.div>

    </div>
  );
}