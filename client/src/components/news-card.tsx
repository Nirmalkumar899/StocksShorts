import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Copy, ExternalLink, Share2, Lock } from '@/lib/icons';
import { useAuth } from '@/hooks/useAuth';
import { getContextualImage } from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ImageLightbox from '@/components/image-lightbox';
import { trackEvent } from '@/lib/analytics';
import type { Article } from '@shared/schema';

interface NewsCardProps {
  article: Article;
  onClick: () => void;
  onShare: (e: React.MouseEvent) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  variant?: 'default' | 'inshorts';
}

export default function NewsCard({ article, onClick, onShare, variant = 'default' }: NewsCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
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

  // Safely convert article time to Date object
  const getArticleDate = () => {
    try {
      return new Date(article.time || Date.now());
    } catch (error) {
      return new Date();
    }
  };

  const getSentimentIcon = () => {
    // Icons removed as requested - returning empty for cleaner interface
    return null;
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
      // Track copy link event
      trackEvent('article_copy_link', 'engagement', article.type, article.id);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to your clipboard.",
      });
    });
  };

  const handleOpenArticle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Track article view event
    trackEvent('article_view', 'engagement', article.type, article.id);
    window.open(`/article/${article.id}`, '_blank');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Track share event
    trackEvent('article_share', 'engagement', article.type, article.id);
    
    const shareUrl = `${window.location.origin}/article/${article.id}`;
    const shareText = `${article.title}\n\n${article.content.substring(0, 200)}...`;
    
    // Try native sharing first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // Fall back to custom sharing if native sharing fails
      }
    }
    
    // Open React share dialog instead of DOM manipulation
    setIsShareDialogOpen(true);
  };

  // Safe share function for social platforms
  const handleShareTo = (platform: string, url: string) => {
    window.open(url, '_blank');
    setIsShareDialogOpen(false);
  };

  // Safe copy to clipboard
  const handleCopyToClipboard = () => {
    const shareUrl = `${window.location.origin}/article/${article.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Article link has been copied to your clipboard.",
      });
      setIsShareDialogOpen(false);
    });
  };

  // Generate safe share URLs
  const getShareUrls = () => {
    const shareUrl = `${window.location.origin}/article/${article.id}`;
    const shareText = `${article.title}\n\n${article.content.substring(0, 200)}...`;
    
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    };
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Inshorts variant - minimal full-screen layout
  if (variant === 'inshorts') {
    return (
      <div 
        className="min-h-screen bg-white dark:bg-gray-900 flex flex-col relative"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        {/* Hero Image */}
        <div className="relative h-2/5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <img
            src={article.imageUrl || getContextualImage(article)}
            alt={article.title}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              if (!imageError) {
                setImageError(true);
                e.currentTarget.src = getContextualImage(article);
              }
            }}
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-6 pb-safe">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
            {article.title}
          </h1>

          {/* Content Summary */}
          <div className="flex-1 mb-6">
            <div className="relative">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base line-clamp-6">
                {article.content?.substring(0, 300) || 'No content available'}
                {article.content && article.content.length > 300 && '...'}
              </p>
              {/* Fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Source and Time */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="font-medium">{article.source}</span>
            <span>
              {formatTimeAgo(getArticleDate())}
            </span>
          </div>

          {/* Read More Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
            data-testid="read-more-button"
          >
            Read Full Article
          </button>
        </div>

        {/* Share button (floating) */}
        <button
          onClick={(e) => onShare(e)}
          className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors duration-200"
          data-testid="share-button"
        >
          <Share2 className="h-5 w-5" />
        </button>

        {/* Premium lock overlay for special articles */}
        {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading && (
          <div className="absolute inset-x-6 bottom-32">
            <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-semibold">Premium Content</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Login to read the complete article with detailed analysis
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant - existing layout
  return (
    <>
      <div 
        className={`w-full flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden border-l-4 ${
          getSentimentBorderColor()
        } hover:shadow-lg transition-shadow duration-200 rounded-lg`}
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
        {/* Article Content Container - Traditional feed style */}
        <div className="flex flex-col">


          {/* Image Section (Top - Full Width) */}
          <div className="w-full h-48 relative bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
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
          <div className="p-4 flex flex-col">
            <div className="flex flex-col">
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
                  <div className="mb-3">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-2 min-h-[80px] p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {article.content?.trim() || 'No content available.'}
                    </div>
                    {article.content && article.content.trim().length < 150 && (
                      <div className="text-blue-600 dark:text-blue-400 text-sm font-medium text-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                        👆 Tap article to read more details
                      </div>
                    )}
                  </div>
                )}
                
                {/* Source and Date in Black Highlighted Section */}
                <div className="bg-black dark:bg-black text-white p-3 rounded-lg mt-3">
                  <div className="flex items-center justify-between text-sm">
                    {/* Left - Exact Date and Time */}
                    <div className="text-white/90">
                      {new Date((article.time || new Date()) as string | Date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })} • {new Date((article.time || new Date()) as string | Date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                    
                    {/* Right - Source Link */}
                    <div>
                      {(article as any).sourceUrl ? (
                        <a 
                          href={(article as any).sourceUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-100 underline font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {article.source}
                        </a>
                      ) : (
                        <span className="text-white font-medium">
                          {article.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                <span>Published: {formatTimeAgo(getArticleDate())}</span>
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

      {/* Safe Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="share-dialog">
          <DialogHeader>
            <DialogTitle>Share Article</DialogTitle>
            <DialogDescription>
              Share this article with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleShareTo('WhatsApp', getShareUrls().whatsapp)}
              data-testid="share-whatsapp"
            >
              Share on WhatsApp
            </Button>
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleShareTo('Twitter', getShareUrls().twitter)}
              data-testid="share-twitter"
            >
              Share on Twitter
            </Button>
            <Button
              className="w-full bg-blue-400 hover:bg-blue-500 text-white"
              onClick={() => handleShareTo('Telegram', getShareUrls().telegram)}
              data-testid="share-telegram"
            >
              Share on Telegram
            </Button>
            <Button
              className="w-full bg-blue-700 hover:bg-blue-800 text-white"
              onClick={() => handleShareTo('LinkedIn', getShareUrls().linkedin)}
              data-testid="share-linkedin"
            >
              Share on LinkedIn
            </Button>
            <Button
              className="w-full bg-gray-500 hover:bg-gray-600 text-white"
              onClick={handleCopyToClipboard}
              data-testid="share-copy"
            >
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsShareDialogOpen(false)}
              data-testid="share-cancel"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}