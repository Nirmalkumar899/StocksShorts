import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, Copy, ExternalLink, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

import type { Article } from "@shared/schema";

export default function ArticlePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get specific article by ID
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [`/api/articles/${id}`],
    retry: 2,
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'negative': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'trader view': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      case 'stocksshorts special': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'educational': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: article?.title,
      text: article?.content,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard",
      });
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Article link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="h-64 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className={`${getSentimentColor(article.sentiment)} border-l-4 overflow-hidden`}>
          {/* Article Image */}
          {article.imageUrl && (
            <div className="relative h-64 md:h-80 bg-gray-100 dark:bg-gray-800">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="p-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className={getTypeColor(article.type || '')}>
                {article.type}
              </Badge>
              {article.priority && (
                <Badge variant="outline">
                  {article.priority}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Content */}
            <div className="text-foreground/80 leading-relaxed mb-6">
              {article.type === 'StocksShorts Special' && !isAuthenticated && !authLoading ? (
                <div className="space-y-4">
                  <div dangerouslySetInnerHTML={{ 
                    __html: article.content.substring(0, 150).replace(/\n/g, '<br />') + '...' 
                  }} />
                  <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 p-6 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-sm">
                    <div className="flex items-center gap-3 text-blue-800 dark:text-blue-200 mb-3">
                      <Lock className="h-5 w-5" />
                      <span className="text-lg font-bold">🔒 LOGIN REQUIRED TO READ FULL ARTICLE</span>
                    </div>
                    <p className="text-blue-700 dark:text-blue-300 font-medium mb-4">
                      This is a premium StocksShorts Special article. Please login to read the complete content with detailed analysis and insights.
                    </p>
                    <Button 
                      onClick={() => setLocation('/profile')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Go to Profile & Login
                    </Button>
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


          </div>
        </Card>
      </div>
    </div>
  );
}