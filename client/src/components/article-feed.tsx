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

interface GestureState {
  isGesturing: boolean;
  startY: number;
  currentY: number;
  deltaY: number;
  startTime: number;
  velocity: number;
}

export default function ArticleFeed({ 
  articles, 
  className = '', 
  priorityGroups,
  showPriorityDividers = false 
}: ArticleFeedProps) {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gesture, setGesture] = useState<GestureState>({
    isGesturing: false,
    startY: 0,
    currentY: 0,
    deltaY: 0,
    startTime: 0,
    velocity: 0
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const originalBodyOverflow = useRef<string>('');
  const originalDocumentOverscroll = useRef<string>('');

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

  // Navigate to specific index with animation
  const navigateToIndex = useCallback((newIndex: number) => {
    if (newIndex === currentIndex || isAnimating) return;
    if (newIndex < 0 || newIndex >= orderedArticles.length) return;
    
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    updateUrl(newIndex);
    
    // Clear animation state after transition
    setTimeout(() => setIsAnimating(false), 400);
  }, [currentIndex, isAnimating, orderedArticles.length, updateUrl]);

  // Navigate with swipe direction
  const navigateWithSwipe = useCallback((direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, orderedArticles.length - 1)
      : Math.max(currentIndex - 1, 0);
    navigateToIndex(newIndex);
  }, [currentIndex, orderedArticles.length, navigateToIndex]);

  // Body scroll lock for true Inshorts behavior
  useEffect(() => {
    // Store original values
    originalBodyOverflow.current = document.body.style.overflow || '';
    originalDocumentOverscroll.current = document.documentElement.style.overscrollBehavior || '';
    
    // Lock scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.overscrollBehavior = 'none';
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalBodyOverflow.current;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.documentElement.style.overscrollBehavior = originalDocumentOverscroll.current;
    };
  }, []);

  // Gesture handlers
  const handleGestureStart = useCallback((clientY: number) => {
    if (isAnimating) return;
    
    setGesture({
      isGesturing: true,
      startY: clientY,
      currentY: clientY,
      deltaY: 0,
      startTime: Date.now(),
      velocity: 0
    });
  }, [isAnimating]);

  const handleGestureMove = useCallback((clientY: number) => {
    if (!gesture.isGesturing || isAnimating) return;

    const deltaY = clientY - gesture.startY;
    const currentTime = Date.now();
    const deltaTime = currentTime - gesture.startTime;
    const velocity = deltaTime > 0 ? Math.abs(deltaY) / deltaTime : 0;

    setGesture(prev => ({
      ...prev,
      currentY: clientY,
      deltaY,
      velocity
    }));
  }, [gesture.isGesturing, gesture.startY, gesture.startTime, isAnimating]);

  const handleGestureEnd = useCallback(() => {
    if (!gesture.isGesturing || isAnimating) return;

    const { deltaY, velocity } = gesture;
    const swipeThreshold = 50; // minimum pixels for swipe
    const velocityThreshold = 0.3; // minimum velocity for quick swipe
    
    // Reset gesture state
    setGesture(prev => ({ ...prev, isGesturing: false }));
    
    // Determine if swipe should trigger navigation
    const shouldSwipe = Math.abs(deltaY) > swipeThreshold || velocity > velocityThreshold;
    
    if (shouldSwipe) {
      if (deltaY > 0) {
        // Swipe down - go to previous
        navigateWithSwipe('prev');
      } else {
        // Swipe up - go to next
        navigateWithSwipe('next');
      }
    }
  }, [gesture, isAnimating, navigateWithSwipe]);

  // Touch and mouse event handlers for vertical swiping only
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleGestureStart(touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Critical: prevent all native scrolling
      if (!gesture.isGesturing) return;
      const touch = e.touches[0];
      handleGestureMove(touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleGestureEnd();
    };

    // Mouse event handlers for desktop
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleGestureStart(e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gesture.isGesturing) {
        e.preventDefault();
        handleGestureMove(e.clientY);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gesture.isGesturing) {
        e.preventDefault();
        handleGestureEnd();
      }
    };

    // Prevent wheel scrolling completely
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add all event listeners with passive: false
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleGestureStart, handleGestureMove, handleGestureEnd, gesture.isGesturing]);

  // Render only 3 cards: previous, current, next
  const getCardsToRender = useCallback(() => {
    const cards = [];
    
    // Previous card (index - 1)
    if (currentIndex > 0) {
      cards.push({
        article: orderedArticles[currentIndex - 1],
        index: currentIndex - 1,
        position: 'previous' as const
      });
    }
    
    // Current card (index)
    if (currentIndex < orderedArticles.length) {
      cards.push({
        article: orderedArticles[currentIndex],
        index: currentIndex,
        position: 'current' as const
      });
    }
    
    // Next card (index + 1)
    if (currentIndex + 1 < orderedArticles.length) {
      cards.push({
        article: orderedArticles[currentIndex + 1],
        index: currentIndex + 1,
        position: 'next' as const
      });
    }
    
    return cards;
  }, [currentIndex, orderedArticles]);

  // Get card transform style for true stack positioning
  const getCardTransform = useCallback((position: 'previous' | 'current' | 'next') => {
    let translateY = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = 1;
    
    switch (position) {
      case 'previous':
        translateY = -100; // Above viewport
        scale = 0.95;
        opacity = 0.8;
        zIndex = 5;
        
        // Gesture offset for smooth drag
        if (gesture.isGesturing && gesture.deltaY > 0) {
          translateY = -100 + (gesture.deltaY * 0.8); // Move into view when dragging down
          opacity = 0.8 + (gesture.deltaY / 200); // Fade in
        }
        break;
        
      case 'current':
        translateY = 0; // Center of viewport
        scale = 1;
        opacity = 1;
        zIndex = 10;
        
        // Gesture offset
        if (gesture.isGesturing) {
          translateY = gesture.deltaY * 0.6; // Follow gesture
          opacity = 1 - Math.abs(gesture.deltaY) / 400; // Slight fade on drag
        }
        break;
        
      case 'next':
        translateY = 100; // Below viewport
        scale = 0.95;
        opacity = 0.8;
        zIndex = 5;
        
        // Gesture offset for smooth drag
        if (gesture.isGesturing && gesture.deltaY < 0) {
          translateY = 100 + (gesture.deltaY * 0.8); // Move into view when dragging up
          opacity = 0.8 + Math.abs(gesture.deltaY) / 200; // Fade in
        }
        break;
    }
    
    return {
      transform: `translateY(${translateY}vh) scale(${scale})`,
      opacity,
      zIndex,
      transition: gesture.isGesturing 
        ? 'none' // No transition during gesture for smooth follow
        : isAnimating 
        ? 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' // Smooth flip animation
        : 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: gesture.isGesturing || isAnimating ? 'transform, opacity' : 'auto'
    };
  }, [gesture.isGesturing, gesture.deltaY, isAnimating]);

  // URL restoration on page load
  useEffect(() => {
    const urlIndex = getCurrentIndexFromUrl();
    if (urlIndex >= 0 && urlIndex < orderedArticles.length && urlIndex !== currentIndex) {
      setCurrentIndex(urlIndex);
    }
  }, [orderedArticles.length, getCurrentIndexFromUrl, currentIndex]);

  // Keyboard navigation for flip system
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return;
      
      switch (e.key) {
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          navigateWithSwipe('next');
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateWithSwipe('prev');
          break;
        case 'Home':
          e.preventDefault();
          navigateToIndex(0);
          break;
        case 'End':
          e.preventDefault();
          navigateToIndex(orderedArticles.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating, navigateWithSwipe, navigateToIndex, orderedArticles.length]);

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

  const cardsToRender = getCardsToRender();

  return (
    <div 
      ref={containerRef}
      className={`inshorts-container relative h-[100svh] w-full overflow-hidden touch-none overscroll-none ${className}`}
      data-testid="article-feed"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none', // Critical: prevent all touch behaviors
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Card Stack - Only 3 cards maximum */}
      {cardsToRender.map(({ article, index, position }) => {
        const cardStyle = getCardTransform(position);
        const sectionMarker = getSectionMarker(article, index);
        
        return (
          <div
            key={`${article.id}-${index}`}
            className="absolute inset-0 w-full h-full will-change-transform"
            style={{
              ...cardStyle,
              pointerEvents: position === 'current' ? 'auto' : 'none'
            }}
            data-index={index}
            data-position={position}
          >
            {/* Priority Section Marker - only show for current card */}
            {sectionMarker && position === 'current' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 z-20">
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
            <NewsCard
              data-testid={`article-card-${article.id}`}
              article={article}
              variant="inshorts"
              onClick={() => handleArticleClick(article)}
              onShare={(e) => handleArticleShare(e, article)}
            />
          </div>
        );
      })}

      {/* Progress indicator */}
      <div className="fixed bottom-20 right-4 z-30 pointer-events-none">
        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
          {currentIndex + 1} / {orderedArticles.length}
        </div>
      </div>

      {/* Navigation hints */}
      {!gesture.isGesturing && (
        <>
          {currentIndex > 0 && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-30 pointer-events-none">
              <div className="bg-black/30 text-white px-2 py-1 rounded text-xs backdrop-blur-sm animate-pulse">
                ↑ Previous
              </div>
            </div>
          )}
          {currentIndex < orderedArticles.length - 1 && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 translate-y-full z-30 pointer-events-none">
              <div className="bg-black/30 text-white px-2 py-1 rounded text-xs backdrop-blur-sm animate-pulse">
                ↓ Next
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}