import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2 } from "lucide-react";
import { getContextualImage } from "@/lib/imageUtils";
import type { Article } from "@shared/schema";
import { Component, ErrorInfo, ReactNode, useState } from "react";
import ImageLightbox from "@/components/image-lightbox";
import CommentsSection from "@/components/comments-section";

// Error Boundary to catch JavaScript errors
class ArticleErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('Article page error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              Please try refreshing the page or go back to home.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ArticlePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Get all articles
  const { data: articles, isLoading, error } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    retry: 2,
  });

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

  if (error || !articles || articles.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Articles Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Unable to load articles. Please try again.
          </p>
          <Button onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Find the specific article
  const articleId = id ? parseInt(id) : 0;
  const article = articles.find(a => a.id === articleId);

  if (!article) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Article #{id} doesn't exist.
          </p>
          <Button onClick={() => setLocation('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'border-l-green-500';
      case 'negative': return 'border-l-red-500';
      default: return 'border-l-gray-400';
    }
  };

  const shareArticle = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.content,
          url: window.location.href
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      // Silent fallback - don't show errors to user
      console.log('Share failed, using fallback');
    }
  };

  return (
    <ArticleErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" onClick={shareArticle}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto p-4">
          <Card className={`${getSentimentColor(article.sentiment)} border-l-4`}>
            {/* Article Image */}
            <div className="relative h-64 overflow-hidden rounded-t-lg">
              <img
                src={article.imageUrl || getContextualImage(article)}
                alt={article.title}
                className={`w-full h-full object-cover ${
                  (article.type === 'Educational' || article.type === 'Trader View') ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''
                }`}
                onClick={() => {
                  if (article.type === 'Educational' || article.type === 'Trader View') {
                    setIsLightboxOpen(true);
                  }
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getContextualImage(article);
                }}
              />
              <div className="absolute top-4 left-4">
                <Badge variant="secondary">
                  {article.type?.toUpperCase() || 'NEWS'}
                </Badge>
              </div>
            </div>

            {/* Article Text */}
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
              <div className="prose max-w-none mb-6">
                <p className="text-lg leading-relaxed">{article.content}</p>
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

            {/* Comments Section - Only for Trader View articles */}
            {article.type === 'Trader View' && (
              <div className="px-6 pb-6">
                <CommentsSection 
                  articleId={article.id} 
                  articleTitle={article.title}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Image Lightbox for Educational and Trader View articles */}
        <ImageLightbox
          src={article.imageUrl || getContextualImage(article)}
          alt={article.title}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      </div>
    </ArticleErrorBoundary>
  );
}