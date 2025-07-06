import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, ArrowLeft, ExternalLink, Lock, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import DirectLogin from "@/components/direct-login";
import CommentsSection from "@/components/comments-section";
import type { Article } from "@shared/schema";

interface InfiniteArticleScrollProps {
  articles: Article[];
  initialArticleId?: number;
  onBack?: () => void;
}

export default function InfiniteArticleScroll({ articles, initialArticleId, onBack }: InfiniteArticleScrollProps) {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const startTouchY = useRef<number>(0);
  const currentTouchY = useRef<number>(0);

  // Find initial article index
  useEffect(() => {
    if (initialArticleId && articles.length > 0) {
      const index = articles.findIndex(article => article.id === initialArticleId);
      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  }, [initialArticleId, articles]);

  // Update URL when current article changes
  useEffect(() => {
    if (articles[currentIndex]) {
      const newUrl = `/article/${articles[currentIndex].id}`;
      setLocation(newUrl, { replace: true });
    }
  }, [currentIndex, articles, setLocation]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'border-l-green-500 bg-green-50';
      case 'negative': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const navigateArticle = useCallback((direction: 'next' | 'prev') => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    
    if (direction === 'next' && currentIndex < articles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    
    setTimeout(() => setIsScrolling(false), 300);
  }, [currentIndex, articles.length, isScrolling]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startTouchY.current = e.touches[0].clientY;
    currentTouchY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentTouchY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaY = startTouchY.current - currentTouchY.current;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        navigateArticle('next');
      } else {
        navigateArticle('prev');
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        navigateArticle('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateArticle('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateArticle]);

  // Mouse wheel handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      navigateArticle('next');
    } else {
      navigateArticle('prev');
    }
  }, [navigateArticle]);

  // Wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleLoginPrompt = () => {
    toast({
      title: "Login Required",
      description: "Please login to access StocksShorts Special content. Other articles are free to read.",
      variant: "default",
    });
    setLocation("/profile");
  };

  if (!articles || articles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No articles available</p>
      </div>
    );
  }

  const article = articles[currentIndex];
  if (!article) return null;

  const isSpecialArticle = article.type === 'StocksShorts Special';
  const isLocked = isSpecialArticle && !isAuthenticated;
  const shareableLink = `${window.location.origin}/article/${article.id}`;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur border-b z-50">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {currentIndex + 1} of {articles.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(shareableLink)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareableLink)}`, '_blank')}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="pt-20 pb-8 px-4 min-h-screen flex flex-col">
        <Card className={`flex-1 ${getSentimentColor(article.sentiment || 'neutral')} border-l-4`}>
          <div className="p-6">
            {/* Article Type Badge */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-xs">
                {article.type || 'NEWS'}
              </Badge>
              {isSpecialArticle && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                  StocksShorts Special
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Content */}
            <div className="text-foreground/80 leading-relaxed mb-6">
              {isLocked ? (
                <div className="space-y-3">
                  <div className="text-gray-400 dark:text-gray-500 text-sm">
                    {article.content.substring(0, 120)}...
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-3">
                    <div className="flex items-center justify-center mb-3">
                      <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                      <p className="text-base font-bold text-amber-800 dark:text-amber-200">
                        🔒 LOGIN TO READ this Special content
                      </p>
                    </div>
                    <DirectLogin />
                  </div>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} />
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <span>{article.source}</span>
              <span>
                {new Date(article.time || article.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Comments Section - Only for Trader View articles */}
            {article.type === 'Trader View' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Chart Discussion</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Share your analysis and discuss this chart with other traders
                  </p>
                </div>
                <CommentsSection articleId={article.id} articleTitle={article.title} />
              </div>
            )}
          </div>
        </Card>

        {/* Navigation hints */}
        <div className="text-center text-xs text-muted-foreground mt-4 space-y-1">
          <p>Swipe up/down or use arrow keys to navigate</p>
          <div className="flex justify-center space-x-4">
            {currentIndex > 0 && (
              <span>↑ Previous article</span>
            )}
            {currentIndex < articles.length - 1 && (
              <span>↓ Next article</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}