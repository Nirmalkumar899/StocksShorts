import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Copy, ExternalLink, Share2, Lock } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { getContextualImage } from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ImageLightbox from '@/components/image-lightbox';
import type { Article } from '@shared/schema';

interface NewsCardProps {
  article: Article;
  onClick: () => void;
  onShare: (e: React.MouseEvent) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export default function NewsCard({ article, onClick, onShare }: NewsCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const formatTimeAgo = (date: Date): string => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'unknown time';
    }
  };

  const getSentimentIcon = () => {
    switch (article.sentiment) {
      case 'Positive':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'Negative':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getSentimentBorderColor = () => {
    switch (article.sentiment) {
      case 'Positive':
        return 'border-l-green-500';
      case 'Negative':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-400';
    }
  };

  const shouldShowViewMore = () => {
    // Don't show View More for Special articles if not authenticated
    if (article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading) {
      return false;
    }
    if (!article.content) return false;
    
    // Count the number of lines by splitting on newlines and wrapping
    const lines = article.content.trim().split('\n');
    let totalLines = 0;
    
    lines.forEach(line => {
      // Estimate lines based on character count (assuming ~50 characters per line on mobile)
      const estimatedLinesForThisText = Math.ceil(line.length / 50) || 1;
      totalLines += estimatedLinesForThisText;
    });
    
    return totalLines > 10;
  };

  const getTruncatedContent = (content: string) => {
    if (!content || content.trim().length === 0) {
      return 'No content available';
    }
    
    const trimmed = content.trim();
    const lines = trimmed.split('\n');
    let totalLines = 0;
    let truncatedContent = '';
    
    for (const line of lines) {
      const estimatedLinesForThisText = Math.ceil(line.length / 50) || 1;
      
      if (totalLines + estimatedLinesForThisText <= 10) {
        truncatedContent += (truncatedContent ? '\n' : '') + line;
        totalLines += estimatedLinesForThisText;
      } else {
        // Add partial line if we can fit some characters
        const remainingLines = 10 - totalLines;
        if (remainingLines > 0) {
          const partialText = line.substring(0, remainingLines * 50);
          truncatedContent += (truncatedContent ? '\n' : '') + partialText;
        }
        break;
      }
    }
    
    return truncatedContent || trimmed.substring(0, 600); // Fallback to character limit
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Check if this is a special article that requires authentication
    if (article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading) {
      // Show login message instead of opening modal
      toast({
        title: "Login Required",
        description: "Please go to Profile section to login and read the full article",
        variant: "destructive",
      });
      return;
    }
    setIsModalOpen(true);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/article/${article.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied!",
        description: "Article link has been copied to your clipboard.",
      });
    });
  };

  const handleOpenArticle = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/article/${article.id}`, '_blank');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(e);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div 
        className={`h-full w-full snap-start flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden border-l-4 ${
          getSentimentBorderColor()
        } hover:shadow-lg transition-shadow duration-200`}
        onClick={(e) => {
          // Check if this is a special article that requires authentication
          if (article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading) {
            // Prevent navigation and show login message
            e.preventDefault();
            e.stopPropagation();
            toast({
              title: "Login Required",
              description: "Please go to Profile section to login and read the full article",
              variant: "destructive",
            });
            return;
          }
          // For other articles or authenticated users, proceed with normal click
          onClick();
        }}
      >
        {/* Article Content Container - Inshorts Style */}
        <div className="flex flex-col h-full">


          {/* Image Section (Top - Full Width) */}
          <div className="w-full h-64 relative bg-gray-100 dark:bg-gray-800">
            <img
              src={article.imageUrl || getContextualImage(article)}
              alt={article.title}
              className="w-full h-full object-cover object-center cursor-pointer"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                // Only use fallback image if the provided image fails to load
                if (!imageError) {
                  setImageError(true);
                  e.currentTarget.src = getContextualImage(article);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
            />
          </div>

          {/* Content Section (Bottom - Full Width) */}
          <div className="flex-1 p-3 pb-16 flex flex-col justify-between">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg flex-1 line-clamp-2 pr-2">{article.title}</h3>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
                    title="Share article"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Show only 150 characters with read more for Special articles */}
                {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
                  <div className="space-y-3 mb-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      {article.content.substring(0, 150)}...
                    </p>
                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 p-2.5 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-sm">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-1">
                        <Lock className="h-3 w-3" />
                        <span className="text-xs font-bold">🔒 LOGIN REQUIRED</span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        Go to Profile section to login and read full article
                      </p>
                    </div>
                  </div>
                ) : shouldShowViewMore() ? (
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {getTruncatedContent(article.content)}...{' '}
                    <button
                      onClick={handleViewMore}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline"
                    >
                      View More
                    </button>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {article.content?.trim() || 'No content available.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Source and time - positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/98 dark:from-gray-900/98 via-white/90 dark:via-gray-900/90 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                {getSentimentIcon()}
                <span className="capitalize font-medium">{article.sentiment}</span>
              </span>
              <span className="text-gray-500">•</span>
              <span className="font-medium">{article.source}</span>
              <span className="text-gray-500">•</span>
              <span className="font-normal">{formatTimeAgo((article.time || new Date('2025-07-05T00:01:00Z')) as Date)}</span>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Copy link"
              >
                <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
              
              <button
                onClick={handleOpenArticle}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Open article"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Image Lightbox */}
        <ImageLightbox
          src={imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article))}
          alt={article.title}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      </div>

      {/* Full Article Modal - Enhanced for all screens */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="modal-content w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle className="text-lg font-bold pr-8 line-clamp-2">
              {article.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full article content for {article.title}
            </DialogDescription>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-50">
                <span className="sr-only">Close</span>
                ×
              </Button>
            </DialogClose>
          </DialogHeader>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto modal-scroll">
            <div className="space-y-6 pb-6">
              {/* Article image in modal */}
              <div className="w-full max-h-80 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                <img
                  src={imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article))}
                  alt={article.title}
                  className="w-full h-auto object-contain transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = getContextualImage(article);
                  }}
                />
              </div>
              
              {/* Full article content */}
              <div className="prose dark:prose-invert max-w-none">
                {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      {article.content.substring(0, 150)}...
                    </div>
                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-sm">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm font-bold">🔒 LOGIN REQUIRED TO READ FULL ARTICLE</span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Please go to Profile section to login and read the complete article
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {article.content?.trim() || 'No content available.'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Fixed footer with actions */}
          <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            {/* Source and Date Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  {getSentimentIcon()}
                  <span className="capitalize font-medium">{article.sentiment}</span>
                </span>
                <span>•</span>
                <span className="font-medium">Source: {article.source}</span>
                <span>•</span>
                <span>Published: {formatTimeAgo((article.time || new Date('2025-07-05T00:01:00Z')) as Date)}</span>
              </div>
            </div>
            
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(e);
                  }}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}