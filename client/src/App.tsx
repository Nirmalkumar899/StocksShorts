import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAnalytics } from "@/components/google-analytics";
import { useSEO } from "@/hooks/useSEO";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Contact from "@/pages/contact";
import Profile from "@/pages/profile";
import ArticlePage from "@/pages/article-new";
import GmailConnect from "@/pages/GmailConnect";
import SplashScreen from "@/components/splash-screen";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import About from "@/pages/about";
import { SiWhatsapp } from "react-icons/si";

function Router() {
  const [location, setLocation] = useLocation();
  
  // Redirect root to /home (All News) on first visit
  useEffect(() => {
    if (location === '/') {
      setLocation('/home');
    }
  }, []);
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/trending">
        {() => <Home initialCategory="trending" />}
      </Route>
      <Route path="/special">
        {() => <Home initialCategory="special" />}
      </Route>
      <Route path="/breakout" component={Home} />
      <Route path="/kalkabazaar" component={Home} />
      <Route path="/warrants" component={Home} />
      <Route path="/educational" component={Home} />
      <Route path="/ipo" component={Home} />

      <Route path="/others" component={Home} />
      <Route path="/crypto" component={Home} />
      <Route path="/us-market" component={Home} />
      <Route path="/orders" component={Home} />
      <Route path="/research" component={Home} />

      <Route path="/contact">
        {() => <Contact onBack={() => window.history.back()} />}
      </Route>
      <Route path="/profile">
        {() => <Profile onBack={() => window.history.back()} />}
      </Route>
      <Route path="/gmail-connect" component={GmailConnect} />
      <Route path="/disclaimer" component={Home} />
      <Route path="/article/:id" component={ArticlePage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function WhatsAppButton() {
  const whatsappNumber = "917738621246";
  const message = "Hi! I have a query about StocksShorts.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg shadow-green-500/30 transition-all hover:scale-110"
      data-testid="button-whatsapp"
      aria-label="Chat on WhatsApp"
    >
      <SiWhatsapp className="h-6 w-6" />
    </a>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_shown_v57');
  });

  const handleSplashFinished = () => {
    sessionStorage.setItem('splash_shown_v57', 'true');
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleAnalytics />
        <Toaster />
        {showSplash ? (
          <SplashScreen onFinished={handleSplashFinished} />
        ) : (
          <>
            <Router />
            <WhatsAppButton />
          </>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
