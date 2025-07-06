import { Card } from "@/components/ui/card";
import { Share2, TrendingUp, TrendingDown, BarChart3, ExternalLink, Copy, Lock } from "lucide-react";
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

export default function NewsCard({ article, onClick, onShare, isExpanded = false, onToggleExpanded }: NewsCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [, setLocation] = useLocation();
  const sentimentColor = getSentimentColor(article.sentiment);
  const typeColor = getTypeColor(article.type || 'AI News');
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const reportMutation = {
    mutate: async (articleId: number) => {
      // Mock implementation for reporting functionality
      console.log('Reported article:', articleId);
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
    return article.content.length > 250; // Set to 250 characters as requested
  };

  // Function to get truncated content for preview
  const getTruncatedContent = (content: string) => {
    if (content.length <= 250) return content;
    
    // Find the last complete word within 250 characters
    const truncated = content.substring(0, 250);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    // Return content up to the last complete word, or just truncate at 250 if no space found
    return lastSpaceIndex > 200 ? truncated.substring(0, lastSpaceIndex) : truncated;
  };

  const formatNewsContent = (content: string) => {
    return content
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        // Format headings (lines with colons, dashes, or short titles)
        if (line.includes(':') || line.includes('-') || (line.length < 50 && line.trim().endsWith('.'))) {
          return `**${line.trim()}**`;
        }
        return line.trim();
      })
      .join('\n\n');
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpanded) {
      onToggleExpanded();
    }
  };

  return (
    <div 
      className={`h-full w-full snap-start flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden border-l-4 ${
        getSentimentBorderColor()
      } hover:shadow-lg transition-shadow duration-200`}
      onClick={onClick}
    >
      {/* Article Content Container */}
      <div className="flex h-full">
        {/* Image Section (40% width) */}
        <div className="w-2/5 relative">
          <div className="absolute inset-0">
            <img
              src={imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article))}
              alt={article.title}
              className="w-full h-full object-cover cursor-pointer"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
            />
            
            {/* Image overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20"></div>
          </div>
        </div>

        {/* Content Section (60% width) */}
        <div className="w-3/5 p-4 flex flex-col justify-between">
          {/* Article content based on authentication status */}
          {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
              <Lock className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  🔒 LOGIN REQUIRED TO READ
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  StocksShorts Special articles require authentication. Other articles are free to read.
                </p>
                <DirectLogin />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {shouldShowViewMore() && !isExpanded ? (
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
                  {article.content}
                  {isExpanded && shouldShowViewMore() && (
                    <button
                      onClick={handleViewMore}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline ml-2"
                    >
                      View Less
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Source and time - moved below content */}
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
              <span>{formatTimeAgo(article.time)}</span>
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
                onClick={onShare}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Share article"
              >
                <Share2 className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox for Educational and Trader View articles */}
      <ImageLightbox
        src={imageError ? getContextualImage(article) : (article.imageUrl || getContextualImage(article))}
        alt={article.title}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}