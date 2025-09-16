import { useState, useRef, useEffect } from 'react';
import { Article } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

interface FlipArticleViewerProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

export default function FlipArticleViewer({ articles, onArticleClick }: FlipArticleViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Ensure currentIndex is within bounds
  useEffect(() => {
    if (articles.length > 0 && currentIndex >= articles.length) {
      setCurrentIndex(0);
    }
  }, [articles.length, currentIndex]);

  const currentArticle = articles[currentIndex] || null;

  const handleNavigation = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < articles.length && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(newIndex);
      
      // Brief animation delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const deltaY = touchStartY.current - touchEndY;
    const deltaTime = touchEndTime - touchStartTime.current;
    const velocity = Math.abs(deltaY) / deltaTime;

    // Swipe threshold: minimum distance or velocity
    const minDistance = 50;
    const minVelocity = 0.5;

    if (Math.abs(deltaY) > minDistance || velocity > minVelocity) {
      if (deltaY > 0) {
        // Swipe up - next article
        handleNavigation(currentIndex + 1);
      } else {
        // Swipe down - previous article
        handleNavigation(currentIndex - 1);
      }
    }
  };

  const handleShare = async (article: Article) => {
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
    
    const maxLength = 600;
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength) + '...';
  };

  const getContextualImage = (article: Article) => {
    const defaultImages = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop&auto=format&q=80',
      'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=600&fit=crop&auto=format&q=80'
    ];
    
    return article.imageUrl || defaultImages[currentIndex % 3];
  };

  if (!currentArticle) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">No articles available</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Total articles loaded: {articles.length}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`h-full w-full relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-all duration-300 ${isAnimating ? 'opacity-80' : 'opacity-100'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ perspective: '1000px' }}
    >
      {/* Article Counter */}
      <div className="absolute top-4 right-4 z-10 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {articles.length}
        </span>
      </div>

      {/* Navigation Hints */}
      {currentIndex < articles.length - 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center text-white/70 text-sm">
            <span>Swipe up for next</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </div>
      )}
      
      {currentIndex > 0 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center text-white/70 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Swipe down for previous</span>
          </div>
        </div>
      )}

      {/* Main Article Card */}
      <div className="h-full w-full bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        
        {/* Article Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          {!imageError[currentArticle.id] ? (
            <img
              src={getContextualImage(currentArticle)}
              alt={currentArticle.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                if (!imageError[currentArticle.id]) {
                  setImageError(prev => ({ ...prev, [currentArticle.id]: true }));
                  e.currentTarget.src = getContextualImage(currentArticle);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm mt-2">Image unavailable</p>
              </div>
            </div>
          )}
          
          {/* Article Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {currentArticle.type.charAt(0).toUpperCase() + currentArticle.type.slice(1).replace(/-/g, ' ')}
            </span>
          </div>
          
          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare(currentArticle);
            }}
            className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>

        {/* Article Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Title */}
          <h1 
            className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => handleArticleClick(currentArticle)}
          >
            {currentArticle.title}
          </h1>

          {/* Content */}
          <div className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6">
            {getTruncatedContent(currentArticle.content)}
          </div>

          {/* Article Metadata */}
          <div className="bg-black text-white p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{currentArticle.source}</span>
                <span>•</span>
                <span>{new Date(currentArticle.time || currentArticle.createdAt).toLocaleString()}</span>
              </div>
              {currentArticle.sourceUrl && (
                <a
                  href={currentArticle.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Read Full
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}