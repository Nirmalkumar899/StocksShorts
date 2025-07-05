import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Share2, TrendingUp, TrendingDown, BarChart3, AlertTriangle, ExternalLink, Copy, Lock, LogIn, X } from "lucide-react";
import { formatTimeAgo, getSentimentColor, getTypeColor } from "@/lib/utils";
import { getContextualImage } from "@/lib/imageUtils";
import type { Article } from "@shared/schema";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DirectLogin from "@/components/direct-login";

interface NewsCardProps {
  article: Article;
  onClick: () => void;
  onShare: (e: React.MouseEvent) => void;
}

export default function NewsCard({ article, onClick, onShare }: NewsCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const sentimentColor = getSentimentColor(article.sentiment);
  const typeColor = getTypeColor(article.type || 'AI News');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Check if this is a Special article (no login required anymore)
  const isSpecialArticle = article.type === 'StocksShorts Special';
  const isLocked = false; // Removed login requirement for Special articles

  const reportMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/ai-articles/${article.id}/report`);
    },
    onSuccess: () => {
      toast({
        title: "Report submitted successfully!",
        description: "Thank you for flagging this content. Our team will investigate and take action if needed.",
        variant: "default",
      });
      // Refresh the articles list
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    },
    onError: (error) => {
      toast({
        title: "Report failed",
        description: error instanceof Error ? error.message : "Unable to report article",
        variant: "destructive",
      });
    },
  });

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmed = window.confirm(
      "Report this information as incorrect?\n\nThis will flag the article for our team to investigate. We'll review and remove if necessary.\n\nPress OK to confirm."
    );
    
    if (confirmed) {
      reportMutation.mutate();
    }
  };

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

  const handleLoginPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Login Required",
      description: "Please login to access StocksShorts Special content. Other articles are free to read.",
      variant: "default",
    });
    setLocation("/profile");
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

  const getBorderColor = () => {
    switch ((article.sentiment || 'neutral').toLowerCase()) {
      case 'positive':
        return 'border-l-success';
      case 'negative':
        return 'border-l-danger';
      default:
        return 'border-l-primary';
    }
  };

  // Function to determine if content needs truncation 
  const shouldShowViewMore = () => {
    return article.content.length > 250; // Set to 250 characters as requested
  };

  const getTruncatedContent = (text: string) => {
    // Truncate to 250 characters
    const maxChars = 250;
    if (text.length > maxChars) {
      return text.substring(0, maxChars);
    }
    return text;
  };

  // Format content with bold headings and proper alignment for long articles
  const formatLongContent = (content: string) => {
    if (content.length < 500) {
      return content;
    }

    // Split content into paragraphs and format headings
    return content
      .split('\n')
      .map(paragraph => {
        const trimmed = paragraph.trim();
        if (!trimmed) return '';
        
        // Check if line is a heading (short line followed by content, or contains emojis/special chars)
        const isHeading = (
          trimmed.length < 60 && 
          (trimmed.includes(':') || trimmed.includes('—') || 
           trimmed.match(/^[A-Z][a-zA-Z\s]+$/))
        );
        
        if (isHeading) {
          return `**${trimmed}**`;
        }
        return trimmed;
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
    <div 
      className={`h-full w-full snap-start flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden border-l-4 ${
        (article.sentiment || 'neutral').toLowerCase() === 'positive' ? 'border-l-green-500' :
        (article.sentiment || 'neutral').toLowerCase() === 'negative' ? 'border-l-red-500' :
        'border-l-gray-400'
      }`}
      onClick={onClick}
    >
      {/* Inshorts-style layout: Image top, content bottom */}
      
      {/* Article Image - Full container with proper scaling */}
      <div className="h-2/5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden relative flex items-center justify-center">
        {!imageError && (
          <img 
            src={article.imageUrl || getContextualImage(article)} 
            alt={article.title}
            className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              imageRendering: 'crisp-edges'
            }}
            loading="eager"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.log(`Image failed to load: ${article.imageUrl}`, e);
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        )}
        
        {/* Loading skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 dark:from-gray-700 via-gray-300 dark:via-gray-600 to-gray-200 dark:to-gray-700 animate-pulse"></div>
        )}
        
        {/* Fallback gradient for failed images */}
        {imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-sm font-semibold opacity-90">
              {(article.type || 'NEWS').toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Category badge on image */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/70 text-white border border-white/30 backdrop-blur-sm">
            {(article.type || 'NEWS').toUpperCase()}
          </span>
        </div>
        
        {/* Action buttons on image */}
        <div className="absolute top-3 right-3 flex space-x-2">
          {/* Report button for AI News only */}
          {article.type === 'AI News' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              disabled={reportMutation.isPending}
              className="text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
              title="Report incorrect information"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          
          {/* Individual article link buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
              title="Copy article link"
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenArticle}
              className="text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
              title="Open article page"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
              title="Share options"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Article Content - Expanded for better readability */}
      <div className="h-3/5 bg-white dark:bg-gray-900 p-4 flex flex-col">
        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-3">
          {article.title}
        </h2>
        
        {/* Content - More space for article text */}
        <div className="flex-1 text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
          {isLocked ? (
            <div className="space-y-2">
              <div className="text-gray-400 dark:text-gray-500 text-sm">
                {article.content}
              </div>
              <div className="p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-center mb-2">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-1" />
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                    🔒 LOGIN TO READ
                  </p>
                </div>
                <DirectLogin />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {shouldShowViewMore() ? (
                <div className="whitespace-pre-wrap">
                  {getTruncatedContent(article.content)}...{' '}
                  <button
                    onClick={handleViewMore}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline"
                  >
                    View More
                  </button>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-left leading-relaxed">
                  {article.content.length >= 500 ? (
                    <div className="space-y-3">
                      {formatLongContent(article.content).split('\n\n').map((paragraph, index) => {
                        if (!paragraph.trim()) return null;
                        
                        // Check if paragraph is marked as heading with **text**
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                          const headingText = paragraph.slice(2, -2);
                          return (
                            <div key={index} className="font-bold text-lg mt-4 mb-2 text-primary">
                              {headingText}
                            </div>
                          );
                        }
                        
                        return (
                          <div key={index} className="text-sm leading-relaxed">
                            {paragraph}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    article.content
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Source and time - moved below content */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate">{article.source}</span>
          <span className="ml-2 flex-shrink-0">
            {article.type === 'AI News' ? 
              formatTimeAgo(article.createdAt) : 
              formatTimeAgo(article.time)
            }
          </span>
        </div>
        
        <div className="flex flex-col space-y-2 text-white text-xs flex-shrink-0 drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{formatTimeAgo(article.time)}</span>
              <span>•</span>
              <span className="font-medium truncate max-w-[150px]">{article.source}</span>
            </div>
            <div className="flex items-center space-x-2">
              {/* Small sentiment color indicator with better visibility */}
              <div className={`w-3 h-3 rounded-full border-2 border-white/50 ${
                article.sentiment.toLowerCase() === 'positive' ? 'bg-green-400' :
                article.sentiment.toLowerCase() === 'negative' ? 'bg-red-400' :
                'bg-gray-400'
              }`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Article Modal */}
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
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {/* Article Image */}
            <div className="relative h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src={article.imageUrl || getContextualImage(article)} 
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-lg font-semibold opacity-90">
                  {(article.type || 'NEWS').toUpperCase()}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose max-w-none dark:prose-invert">
              <div className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                {article.content}
              </div>
            </div>

            {/* Article Metadata */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span className="font-medium">Source: {article.source}</span>
                <span>
                  {article.type === 'AI News' ? 
                    formatTimeAgo(article.createdAt) : 
                    formatTimeAgo(article.time)
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                    {article.type}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sentiment:</span>
                  <div className="flex items-center gap-1">
                    {getSentimentIcon()}
                    <span className="text-xs font-medium capitalize">
                      {article.sentiment}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
