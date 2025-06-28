import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, ArrowLeft, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0 && !isScrolling) {
      setIsScrolling(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsScrolling(false), 300);
    }
  }, [currentIndex, isScrolling]);

  const handleNext = useCallback(() => {
    if (currentIndex < articles.length - 1 && !isScrolling) {
      setIsScrolling(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsScrolling(false), 300);
    }
  }, [currentIndex, articles.length, isScrolling]);

  // Touch and scroll handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startTouchY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentTouchY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaY = startTouchY.current - currentTouchY.current;
    const threshold = 50;

    if (Math.abs(deltaY) > threshold && !isScrolling) {
      if (deltaY > 0) {
        // Swipe up - next article
        handleNext();
      } else {
        // Swipe down - previous article
        handlePrevious();
      }
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 50 && !isScrolling) {
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious]);

  // Wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  if (!articles || articles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No articles available</p>
      </div>
    );
  }

  const currentArticle = articles[currentIndex];
  if (!currentArticle) return null;

  const shareableLink = `${window.location.origin}/article/${currentArticle.id}`;

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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {articles.length}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(shareableLink, "Article link")}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareableLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="pt-16 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <Card 
            className={`border-l-4 ${getSentimentColor(currentArticle.sentiment)} transition-all duration-300 ${
              isScrolling ? 'scale-95 opacity-80' : 'scale-100 opacity-100'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-4 leading-tight">
                    {currentArticle.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="secondary">{currentArticle.type}</Badge>
                    <Badge className={getPriorityBadge(currentArticle.priority || 'medium')}>
                      {currentArticle.priority || 'Medium'}
                    </Badge>
                    <Badge variant="outline">{currentArticle.sentiment}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {currentArticle.source} • {new Date(currentArticle.time || currentArticle.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {currentArticle.imageUrl && (
                  <img
                    src={currentArticle.imageUrl}
                    alt={currentArticle.title}
                    className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                  />
                )}
              </div>
              
              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                  {currentArticle.content}
                </p>
              </div>
              
              {/* Navigation hints */}
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>↑ Swipe up or scroll for next article</p>
                <p>↓ Swipe down or scroll for previous article</p>
                <p className="font-medium">URL: /article/{currentArticle.id}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation indicators */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center gap-1">
        {articles.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex ? 'bg-blue-500 scale-125' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}