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
      className="h-full snap-start flex flex-col bg-white dark:bg-neutral-900 relative overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Article Image - Takes most of the space */}
      <div className="flex-1 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
        <img 
          src={article.imageUrl || getContextualImage(article)} 
          alt={article.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Fallback to contextual image if original fails
            target.src = getContextualImage(article);
          }}
        />
      </div>
      
      {/* Content Overlay - Enhanced readability */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-black/60 p-4 text-white min-h-[60%] flex flex-col justify-end backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-sm drop-shadow-lg">
              {article.type.toUpperCase()}
            </span>
            {/* Sentiment color indicator with better contrast */}
            <div className={`w-3 h-3 rounded-full border-2 border-white/50 drop-shadow-lg ${
              article.sentiment.toLowerCase() === 'positive' ? 'bg-green-400' :
              article.sentiment.toLowerCase() === 'negative' ? 'bg-red-400' :
              'bg-gray-400'
            }`}></div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-lg font-bold text-white leading-tight mb-2 flex-shrink-0 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          {article.title}
        </h2>
        
        <div className="text-white text-sm leading-relaxed mb-4 flex-1 overflow-y-auto drop-shadow-md" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
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
