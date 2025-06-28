import { useEffect } from 'react';
import type { Article } from '@shared/schema';

interface ArticleSchemaProps {
  article: Article;
}

export function ArticleSchema({ article }: ArticleSchemaProps) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": article.content.substring(0, 160) + "...",
      "articleBody": article.content,
      "datePublished": article.time || article.createdAt,
      "dateModified": article.createdAt,
      "author": {
        "@type": "Organization",
        "name": article.source || "StocksShorts"
      },
      "publisher": {
        "@type": "Organization",
        "name": "StocksShorts",
        "logo": {
          "@type": "ImageObject",
          "url": "https://stocksshorts.com/favicon.ico"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://stocksshorts.com/article/${article.id}`
      },
      "articleSection": article.type || "Stock Market News",
      "keywords": getKeywordsFromArticle(article),
      "about": {
        "@type": "Thing",
        "name": "Indian Stock Market",
        "description": "Stock market news and analysis for Indian equities"
      }
    };

    // Add schema to head
    const scriptId = `article-schema-${article.id}`;
    let existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [article]);

  return null;
}

function getKeywordsFromArticle(article: Article): string {
  const keywords = [];
  
  // Add category-based keywords
  switch (article.type?.toLowerCase()) {
    case 'nifty':
      keywords.push('Nifty 50', 'NSE', 'Indian stock index');
      break;
    case 'breakout stock':
      keywords.push('stock breakout', 'technical analysis', 'trading signals');
      break;
    case 'ipo':
      keywords.push('IPO', 'initial public offering', 'new listings');
      break;
    case 'global':
      keywords.push('global markets', 'international impact', 'foreign investment');
      break;
    default:
      keywords.push('Indian stocks', 'stock market news');
  }

  // Add sentiment-based keywords
  if (article.sentiment) {
    keywords.push(`${article.sentiment.toLowerCase()} market sentiment`);
  }

  // Extract stock symbols from title/content
  const stockSymbols = extractStockSymbols(article.title + ' ' + article.content);
  keywords.push(...stockSymbols);

  return keywords.join(', ');
}

function extractStockSymbols(text: string): string[] {
  // Common Indian stock patterns
  const patterns = [
    /\b(TCS|RELIANCE|HDFC|ICICI|INFY|WIPRO|BAJAJ|MARUTI|SBI|LT)\b/gi,
    /\b([A-Z]{2,6})\s*(?:Ltd|Limited|Bank|Industries|Motors|Steel|Oil|Gas)\b/gi
  ];
  
  const symbols = new Set<string>();
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => symbols.add(match.toUpperCase()));
    }
  });
  
  return Array.from(symbols).slice(0, 5); // Limit to 5 symbols
}