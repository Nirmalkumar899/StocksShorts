import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Article } from "@shared/schema";
import InfiniteArticleScroll from "@/components/infinite-article-scroll";

export default function ArticlePage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  
  // Get all articles for infinite scroll
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

  return (
    <InfiniteArticleScroll
      articles={articles}
      initialArticleId={id ? parseInt(id) : undefined}
      onBack={() => setLocation('/')}
    />
  );
}