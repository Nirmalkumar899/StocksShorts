import { useEffect } from 'react';
import { initGA } from '../lib/analytics';
import { useAnalytics } from '../hooks/use-analytics';

// Google Analytics and Search Console integration
export function GoogleAnalytics() {
  // Track page changes
  useAnalytics();

  useEffect(() => {
    // Initialize Google Analytics with new tracking system
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      initGA();
      console.log('Google Analytics initialized successfully');
    } else {
      console.warn('Google Analytics Measurement ID not found. Please add VITE_GA_MEASUREMENT_ID to environment variables.');
    }

    // Add Google Search Console verification meta tag
    const searchConsoleVerification = document.createElement('meta');
    searchConsoleVerification.name = 'google-site-verification';
    searchConsoleVerification.content = 'YOUR_VERIFICATION_CODE_HERE'; // User will replace this
    document.head.appendChild(searchConsoleVerification);

    // Clean up on unmount
    return () => {
      if (searchConsoleVerification.parentNode) {
        searchConsoleVerification.parentNode.removeChild(searchConsoleVerification);
      }
    };
  }, []);

  return null;
}

// Track page views for analytics
export function trackPageView(page: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
}

// Track custom events
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
}

// Simple visitor counter for immediate feedback
let sessionVisitors = 0;
let dailyVisitors = 0;

export function incrementVisitorCount() {
  sessionVisitors++;
  
  // Check if it's a new day for daily count
  const today = new Date().toDateString();
  const lastVisitDate = localStorage.getItem('lastVisitDate');
  
  if (lastVisitDate !== today) {
    localStorage.setItem('lastVisitDate', today);
    dailyVisitors = 1;
    localStorage.setItem('dailyVisitors', '1');
  } else {
    const stored = localStorage.getItem('dailyVisitors');
    dailyVisitors = stored ? parseInt(stored) + 1 : 1;
    localStorage.setItem('dailyVisitors', dailyVisitors.toString());
  }
}

export function getVisitorCounts() {
  return {
    session: sessionVisitors,
    daily: dailyVisitors || parseInt(localStorage.getItem('dailyVisitors') || '0')
  };
}