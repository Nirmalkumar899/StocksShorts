import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, RefreshCw, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ArticleWithMeta {
  id: number;
  title: string;
  content: string;
  type: string;
  time: string;
  source: string;
  sentiment: string;
  priority: string;
  imageUrl?: string;
  lastUpdated: string;
  shareableLink: string;
  apiLink: string;
  totalArticlesInSheet: number;
  slug: string;
}

export default function ArticlePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: article, isLoading, error, refetch } = useQuery<ArticleWithMeta>({
    queryKey: ['/api/articles', id],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds when enabled
  });

  // Auto-refresh when new articles are added
  useEffect(() => {
    if (article) {
      const interval = setInterval(async () => {
        const response = await fetch('/api/articles');
        const allArticles = await response.json();
        if (allArticles.length > article.totalArticlesInSheet) {
          refetch();
          toast({
            title: "Content Updated",
            description: `${allArticles.length - article.totalArticlesInSheet} new articles added`,
          });
        }
      }, 60000); // Check for new articles every minute

      return () => clearInterval(interval);
    }
  }, [article, refetch, toast]);

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'border-l-green-500 bg-green-50';
      case 'negative': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
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
            The article you're looking for doesn't exist or may have been removed.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(article.shareableLink, "Article link")}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Card className={`border-l-4 ${getSentimentColor(article.sentiment)}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-3">{article.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="secondary">{article.type}</Badge>
                  <Badge className={getPriorityBadge(article.priority)}>{article.priority}</Badge>
                  <Badge variant="outline">{article.sentiment}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {article.source} • {new Date(article.time).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose prose-gray max-w-none">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {article.content}
              </p>
            </div>
            
            {/* Article Metadata */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold mb-4">Article Links</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Shareable Link</p>
                    <p className="text-sm text-muted-foreground">Share this article with others</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(article.shareableLink, "Shareable link")}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">API Endpoint</p>
                    <p className="text-sm text-muted-foreground">Direct JSON access for developers</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(article.apiLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Last updated: {new Date(article.lastUpdated).toLocaleString()}</p>
                <p>Total articles in sheet: {article.totalArticlesInSheet}</p>
                <p>Article ID: {article.id}</p>
                <p>URL Slug: {article.slug}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}