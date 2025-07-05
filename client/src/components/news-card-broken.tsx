import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Share2, TrendingUp, TrendingDown, BarChart3, ExternalLink, Copy, Lock, X } from "lucide-react";
import { formatTimeAgo, getSentimentColor, getTypeColor } from "@/lib/utils";
import { getContextualImage } from "@/lib/imageUtils";
import type { Article } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DirectLogin from "@/components/direct-login";
import ImageLightbox from "@/components/image-lightbox";

interface NewsCardProps {
  article: Article;
  onClick: () => void;
  onShare: (e: React.MouseEvent) => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export default function NewsCard({ article, onClick, onShare }: NewsCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  const sentimentColor = getSentimentColor(article.sentiment);
  const typeColor = getTypeColor(article.type || 'AI News');
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const articleLink = `${window.location.origin}/article/${article.id}`;
    try {
      await navigator.clipboard.writeText(articleLink);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleOpenArticle = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/article/${article.id}`, '_blank');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(e);
  };
  
  const getSentimentIcon = () => {
    switch ((article.sentiment || 'neutral').toLowerCase()) {
      case 'positive':
        return <TrendingUp className="text-success h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="text-danger h-3 w-3" />;
      default:
        return <BarChart3 className="text-primary h-3 w-3" />;
    }
  };

  const getSentimentBorderColor = () => {
    switch ((article.sentiment || 'neutral').toLowerCase()) {
      case 'positive':
        return 'border-l-green-500';
      case 'negative':
        return 'border-l-red-500';
      default:
        return 'border-l-primary';
    }
  };

  // Function to determine if content needs truncation 
  const shouldShowViewMore = () => {
    return article.content.length > 250;
  };

  // Function to get truncated content for preview
  const getTruncatedContent = (content: string) => {
    if (content.length <= 250) return content;
    
    const truncated = content.substring(0, 250);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    return lastSpaceIndex > 200 ? truncated.substring(0, lastSpaceIndex) : truncated;
  };

  const formatNewsContent = (content: string) => {
    return content
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        if (line.includes(':') || line.includes('-') || (line.length < 50 && line.trim().endsWith('.'))) {
          return `**${line.trim()}**`;
        }
        return line.trim();
      })
      .join('\n\n');
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
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
        onClick={onClick}
      >
        {/* Article Content Container - Inshorts Style */}
        <div className="flex flex-col h-full">
          {/* Special layout for locked StocksShorts Special articles */}
          {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
            <>
              {/* Login Section (Top) */}
              <div className="p-4 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 border-b border-blue-200 dark:border-blue-800">
                <div className="text-center space-y-4">
                  <Lock className="h-8 w-8 text-blue-600 mx-auto" />
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">{article.title}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-2 font-medium">
                      🔒 LOGIN REQUIRED TO READ
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                      StocksShorts Special articles require authentication
                    </p>
                  </div>
                  <DirectLogin />
                </div>
              </div>
              
              {/* Image Section (Bottom - Blurred for locked content) */}
              <div className="w-full h-48 relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img
                  src={imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article))}
                  alt={article.title}
                  className="w-full h-full object-contain filter blur-sm opacity-50"
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    setImageError(true);
                    e.currentTarget.src = getContextualImage(article);
                  }}
                />
                {/* Overlay to indicate locked content */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Preview - Login to view full content
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Normal layout for other articles */}
              {/* Image Section (Top - Full Width) */}
              <div className="w-full h-64 relative bg-gray-100 dark:bg-gray-800">
                <img
                  src={imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article))}
                  alt={article.title}
                  className="w-full h-full object-contain cursor-pointer"
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    setImageError(true);
                    e.currentTarget.src = getContextualImage(article);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                />
              </div>

              {/* Content Section (Bottom - Full Width) */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                    {shouldShowViewMore() ? (
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {getTruncatedContent(article.content)}...{' '}
                        <button
                          onClick={handleViewMore}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline"
                        >
                          View More
                        </button>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {article.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Source and time - positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 dark:from-gray-900/95 via-white/80 dark:via-gray-900/80 to-transparent p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  {getSentimentIcon()}
                  <span className="capitalize font-medium">{article.sentiment}</span>
                </span>
                <span className="text-gray-500">•</span>
                <span className="font-medium">{article.source}</span>
                <span className="text-gray-500">•</span>
                <span>{formatTimeAgo((article.time || new Date('2025-07-05T00:01:00Z')) as Date)}</span>
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
                
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Share article"
                >
                  <Share2 className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                </button>
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
      </div>

      {/* Full Article Modal - RESTORED ORIGINAL DESIGN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold pr-8">
              {article.title}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                onClick={handleCloseModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Article Image in Modal */}
            {(article.imageUrl || getContextualImage(article)) && (
              <div className="relative w-full h-80 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <img
                  src={imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article))}
                  alt={article.title}
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </div>
            )}
            
            {/* Article Content in Modal */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                {formatNewsContent(article.content)}
              </div>
            </div>
            
            {/* Meta Information */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  {getSentimentIcon()}
                  <span className="capitalize">{article.sentiment}</span>
                </span>
                <span>{article.source}</span>
                <span>{formatTimeAgo((article.time || new Date('2025-07-05T00:01:00Z')) as Date)}</span>
              </div>
              
              {/* Share Button in Modal */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="ml-4"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}