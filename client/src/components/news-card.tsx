import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatTimeAgo, getSentimentColor, getTypeColor } from "@/lib/utils";
import { getContextualImage } from "@/lib/imageUtils";
import type { Article } from "@shared/schema";

interface NewsCardProps {
  article: Article;
  onClick: () => void;
  onShare: (e: React.MouseEvent) => void;
}

export default function NewsCard({ article, onClick, onShare }: NewsCardProps) {
  const sentimentColor = getSentimentColor(article.sentiment);
  const typeColor = getTypeColor(article.type);
  
  const getSentimentIcon = () => {
    switch (article.sentiment.toLowerCase()) {
      case 'positive':
        return <TrendingUp className="text-success h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="text-danger h-3 w-3" />;
      default:
        return <BarChart3 className="text-primary h-3 w-3" />;
    }
  };

  const getBorderColor = () => {
    switch (article.sentiment.toLowerCase()) {
      case 'positive':
        return 'border-l-success';
      case 'negative':
        return 'border-l-danger';
      default:
        return 'border-l-primary';
    }
  };

  return (
    <div 
      className="h-full w-full snap-start flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden"
      onClick={onClick}
    >
      {/* Inshorts-style layout: Image top, content bottom */}
      
      {/* Article Image - Reduced height for more content space */}
      <div className="h-2/5 bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
        <img 
          src={article.imageUrl || getContextualImage(article)} 
          alt={article.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getContextualImage(article);
          }}
        />
        
        {/* Category badge on image */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-black/70 text-white border border-white/30 backdrop-blur-sm">
            {article.type.toUpperCase()}
          </span>
        </div>
        
        {/* Share button on image */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Article Content - Expanded for better readability */}
      <div className="h-3/5 bg-white dark:bg-gray-900 p-4 flex flex-col">
        {/* Header with sentiment and source */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              article.sentiment.toLowerCase() === 'positive' ? 'bg-green-500' :
              article.sentiment.toLowerCase() === 'negative' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {article.source}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatTimeAgo(article.time)}
          </span>
        </div>
        
        {/* Title */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-3">
          {article.title}
        </h2>
        
        {/* Content */}
        <div className="flex-1 text-gray-700 dark:text-gray-300 text-sm leading-relaxed overflow-y-auto">
          {article.content}
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
    </div>
  );
}
