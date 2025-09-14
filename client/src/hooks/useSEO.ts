import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
}

const seoPages: Record<string, SEOConfig> = {
  '/': {
    title: 'StocksShorts - Real-time Indian Stock Market News',
    description: 'Get instant Indian stock market updates, live Nifty/Sensex tracking, IPO insights, and connect with SEBI registered investment advisors.',
    keywords: 'Indian stock market news, Nifty 50, Bank Nifty, Sensex, real-time market updates'
  },
  '/trending': {
    title: 'Trending Stocks Today - Top Indian Market Movers | StocksShorts',
    description: 'Latest trending stocks in Indian market today. Real-time updates on top gainers, losers, and most active stocks on NSE and BSE.',
    keywords: 'trending stocks, top gainers, market movers, NSE trending, BSE trending'
  },
  '/special': {
    title: 'StocksShorts Special Reports - Exclusive Market Analysis',
    description: 'Exclusive special reports on Indian stock market with in-depth analysis, expert insights, and premium market intelligence.',
    keywords: 'special reports, exclusive analysis, premium insights, market intelligence'
  },
  '/breakout': {
    title: 'Breakout Stocks Alert - Technical Analysis & Targets | StocksShorts',
    description: 'Real-time breakout stock alerts with technical analysis, price targets, and stop-loss levels for Indian equities.',
    keywords: 'breakout stocks, technical breakout, stock alerts, price targets, technical analysis'
  },
  '/index': {
    title: 'Nifty 50, Bank Nifty, Sensex Live Updates | StocksShorts',
    description: 'Live updates on major Indian stock indices - Nifty 50, Bank Nifty, Sensex, sectoral indices with technical levels and analysis.',
    keywords: 'Nifty 50, Bank Nifty, Sensex, stock indices, index analysis, market levels'
  },
  '/ipo': {
    title: 'IPO News & Analysis - Latest IPO Updates India | StocksShorts',
    description: 'Latest IPO news, analysis, subscription dates, grey market premium, and investment recommendations for upcoming Indian IPOs.',
    keywords: 'IPO news, IPO analysis, upcoming IPOs, grey market premium, IPO subscription'
  },
  '/global': {
    title: 'Global Market Impact on Indian Stocks | StocksShorts',
    description: 'How global markets, US indices, crude oil, and international events impact Indian stock market and investment decisions.',
    keywords: 'global markets, international impact, US markets, crude oil, global economy'
  },
  '/sebi-ria': {
    title: 'SEBI Registered Investment Advisors Directory | StocksShorts',
    description: 'Connect with SEBI registered investment advisors (RIA) in India. Find certified financial advisors for personalized investment advice.',
    keywords: 'SEBI RIA, investment advisors, certified financial advisors, investment advice'
  },
  '/contact': {
    title: 'Contact StocksShorts - Support & Feedback',
    description: 'Get in touch with StocksShorts team for support, feedback, or queries about our stock market news and analysis platform.',
    keywords: 'contact support, feedback, customer service, help'
  },
  '/profile': {
    title: 'User Profile - StocksShorts Account Management',
    description: 'Manage your StocksShorts account, update profile settings, and access personalized stock market features.',
    keywords: 'user profile, account management, personalized features'
  },
  '/disclaimer': {
    title: 'Investment Disclaimer & Terms - StocksShorts',
    description: 'Investment disclaimer, terms of service, and important legal information for StocksShorts users.',
    keywords: 'investment disclaimer, terms of service, legal information'
  }
};

export function useSEO(customConfig?: SEOConfig) {
  const [location] = useLocation();
  
  useEffect(() => {
    const config = customConfig || seoPages[location] || seoPages['/'];
    
    // Update page title
    document.title = config.title;
    
    // Update meta description
    updateMeta('description', config.description);
    
    // Update meta keywords
    if (config.keywords) {
      updateMeta('keywords', config.keywords);
    }
    
    // Update canonical URL
    const canonical = config.canonical || `https://stocksshorts.com${location}`;
    updateCanonical(canonical);
    
    // Update Open Graph tags
    updateMeta('og:title', config.title, 'property');
    updateMeta('og:description', config.description, 'property');
    updateMeta('og:url', canonical, 'property');
    
    // Update Twitter Card tags
    updateMeta('twitter:title', config.title);
    updateMeta('twitter:description', config.description);
    
  }, [location, customConfig]);
}

function updateMeta(name: string, content: string, attribute: string = 'name') {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function updateCanonical(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}