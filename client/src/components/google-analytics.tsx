import { useEffect } from 'react';

// Google Analytics and Search Console integration
export function GoogleAnalytics() {
  useEffect(() => {
    // Add Google Search Console verification meta tag
    const searchConsoleVerification = document.createElement('meta');
    searchConsoleVerification.name = 'google-site-verification';
    searchConsoleVerification.content = 'YOUR_VERIFICATION_CODE_HERE'; // User will replace this
    document.head.appendChild(searchConsoleVerification);

    // Add Google Analytics if GA_MEASUREMENT_ID is provided
    const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaMeasurementId) {
      // Load Google Analytics script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
      document.head.appendChild(script1);

      // Initialize Google Analytics
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaMeasurementId}');
      `;
      document.head.appendChild(script2);
    }

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