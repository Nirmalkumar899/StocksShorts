import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Article } from '@shared/schema';
import { getContextualImage } from '@/lib/imageUtils';

interface SwipeNewsProps {
  articles: Article[];
  initialIndex?: number;
}

export default function SwipeNews({ articles, initialIndex = 0 }: SwipeNewsProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const currentArticle = articles[currentIndex];

  const goToNext = () => {
    if (currentIndex < articles.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const deltaY = touchStartY.current - touchEndY;
    const deltaTime = touchEndTime - touchStartTime.current;

    // Only trigger swipe if it's fast enough and long enough
    if (Math.abs(deltaY) > 50 && deltaTime < 300) {
      if (deltaY > 0) {
        goToNext(); // Swipe up - next article
      } else {
        goToPrevious(); // Swipe down - previous article
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleShare = async () => {
    if (navigator.share && currentArticle) {
      try {
        await navigator.share({
          title: currentArticle.title,
          text: currentArticle.content,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(`${currentArticle.title}\n\n${currentArticle.content}\n\nRead more at ${window.location.href}`);
      }
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'border-l-green-500';
      case 'negative': return 'border-l-red-500';
      default: return 'border-l-gray-400';
    }
  };

  if (!currentArticle) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <p className="text-neutral-600 dark:text-neutral-400">No articles available</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-hidden bg-gray-50 dark:bg-neutral-950 relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Article Content */}
      <div className={`h-full transition-transform duration-300 ${isTransitioning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
        
        {/* Image Section - Top 45% */}
        <div className="h-[45vh] relative overflow-hidden">
          <img
            src={currentArticle.imageUrl || getContextualImage(currentArticle)}
            alt={currentArticle.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          
          {/* Navigation Arrows */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="bg-black/30 hover:bg-black/50 text-white border-0 h-8 w-8 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex === articles.length - 1}
              className="bg-black/30 hover:bg-black/50 text-white border-0 h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Article Counter */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {articles.length}
          </div>

          {/* Source and Time */}
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-sm font-medium">{currentArticle.source}</p>
            {currentArticle.time && (
              <p className="text-xs opacity-80">
                {new Date(currentArticle.time).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
        </div>

        {/* Content Section - Bottom 55% */}
        <div className="h-[55vh] bg-white dark:bg-neutral-900 relative">
          <div className={`absolute left-0 top-0 w-1 h-full ${getSentimentColor(currentArticle.sentiment || '')}`} />
          
          <div className="p-6 h-full flex flex-col">
            {/* Title */}
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight line-clamp-3">
              {currentArticle.title}
            </h1>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-sm">
                {currentArticle.content}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-neutral-700">
              {/* Sentiment & Priority */}
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentArticle.sentiment === 'Positive' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : currentArticle.sentiment === 'Negative'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {currentArticle.sentiment || 'Neutral'}
                </span>
                
                {currentArticle.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentArticle.priority === 'High'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {currentArticle.priority}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe Indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-neutral-400 text-xs text-center">
        <div className="flex flex-col items-center">
          <ChevronUp className="h-3 w-3 opacity-50 animate-bounce" />
          <span>Swipe for next</span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-2 left-0 right-0 px-4">
        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / articles.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}