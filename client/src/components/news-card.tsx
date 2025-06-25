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
    <Card 
      className={`bg-white dark:bg-neutral-900 shadow-sm border-l-4 ${getBorderColor()} hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden`}
      onClick={onClick}
    >
      {/* Article Image */}
      {article.imageUrl && (
        <div className="w-full h-48 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
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
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-6 bg-${sentimentColor}/10 rounded-full flex items-center justify-center`}>
              {getSentimentIcon()}
            </div>
            <span className={`text-xs font-medium text-${sentimentColor} bg-${sentimentColor}/10 px-2 py-1 rounded-full`}>
              {article.type.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-medium ${
              article.sentiment.toLowerCase() === 'positive' ? 'text-success' :
              article.sentiment.toLowerCase() === 'negative' ? 'text-danger' :
              'text-neutral-600 dark:text-neutral-400'
            }`}>
              {article.sentiment}
            </span>
            <span className="text-xs text-neutral-400">
              {article.priority}
            </span>
          </div>
        </div>
        
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-white leading-tight mb-3">
          {article.title}
        </h2>
        
        <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed line-clamp-4">
          {article.content}
        </p>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatTimeAgo(article.time)}
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {article.source}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
