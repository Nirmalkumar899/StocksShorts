import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatTimeAgo, getSentimentColor, getTypeColor } from "@/lib/utils";
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
      className="h-screen snap-start flex flex-col bg-white dark:bg-neutral-900 relative overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Article Image */}
      {article.imageUrl && (
        <div className="flex-1 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
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
      
      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            article.sentiment.toLowerCase() === 'positive' ? 'bg-green-500/20 text-green-400' :
            article.sentiment.toLowerCase() === 'negative' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {article.type.toUpperCase()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-xl font-bold text-white leading-tight mb-3">
          {article.title}
        </h2>
        
        <p className="text-white/90 text-sm leading-relaxed mb-4">
          {article.content}
        </p>
        
        <div className="flex items-center space-x-4 text-white/70 text-xs">
          <span>{formatTimeAgo(article.time)}</span>
          <span>•</span>
          <span>{article.source}</span>
        </div>
      </div>
    </div>
  );
}
