import { useEffect } from 'react';

// Preload critical resources for better Core Web Vitals
export function SEOPerformanceOptimizer() {
  useEffect(() => {
    // Preload critical fonts
    const preloadFont = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = href;
      document.head.appendChild(link);
    };

    // Preload Inter font variants
    preloadFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2');

    // Implement service worker for caching with cache-busting
    if ('serviceWorker' in navigator) {
      // Unregister any old service workers first, then register new version
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        const unregisterPromises = registrations.map((reg) => reg.unregister());
        return Promise.all(unregisterPromises);
      }).then(() => {
        return navigator.serviceWorker.register('/sw.js?v=1.0.57');
      }).then((reg) => {
        console.log('SW registered v1.0.57');
        reg.update();
      }).catch(() => console.log('SW registration failed'));
    }

    // Critical resource hints
    const addResourceHint = (rel: string, href: string, as?: string) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (as) link.as = as;
      document.head.appendChild(link);
    };

    // DNS prefetch for external domains
    addResourceHint('dns-prefetch', '//fonts.googleapis.com');
    addResourceHint('dns-prefetch', '//fonts.gstatic.com');
    addResourceHint('dns-prefetch', '//www.google-analytics.com');

    // Preconnect to critical domains
    addResourceHint('preconnect', 'https://fonts.googleapis.com');
    addResourceHint('preconnect', 'https://fonts.gstatic.com');

    // Lazy load non-critical images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    return () => {
      imageObserver.disconnect();
    };
  }, []);

  return null;
}

// Add critical CSS inline for faster rendering
export function CriticalCSS() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        /* Critical above-the-fold styles */
        body { 
          font-family: Inter, system-ui, -apple-system, sans-serif;
          margin: 0;
          background: #ffffff;
          color: #000000;
        }
        .dark body {
          background: #000000;
          color: #ffffff;
        }
        /* Header critical styles */
        header {
          height: 60px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }
        .dark header {
          background: #000000;
          border-bottom: 1px solid #374151;
        }
        /* Layout critical styles */
        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
        }
        /* Loading skeleton */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `
    }} />
  );
}