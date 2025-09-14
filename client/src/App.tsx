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
import SebiRia from "@/pages/sebi-ria";
import Contact from "@/pages/contact";
import Profile from "@/pages/profile";
import ArticlePage from "@/pages/article-new";
import GmailConnect from "@/pages/GmailConnect";
import SplashScreen from "@/components/splash-screen";

function Router() {
  const [location, setLocation] = useLocation();
  
  // Temporarily disable splash screen for debugging
  // const [showSplash, setShowSplash] = useState(true);
  
  // // Show splash screen for 1 second on first load
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowSplash(false);
  //   }, 1000);
  //   
  //   return () => clearTimeout(timer);
  // }, []);
  
  // // Show splash screen for first 1 second
  // if (showSplash) {
  //   return <SplashScreen />;
  // }
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/trending">
        {() => <Home initialCategory="trending" />}
      </Route>
      <Route path="/special" component={Home} />
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

      <Route path="/sebi-ria">
        {() => <SebiRia onBack={() => window.history.back()} />}
      </Route>
      <Route path="/contact">
        {() => <Contact onBack={() => window.history.back()} />}
      </Route>
      <Route path="/profile">
        {() => <Profile onBack={() => window.history.back()} />}
      </Route>
      <Route path="/gmail-connect" component={GmailConnect} />
      <Route path="/disclaimer" component={Home} />
      <Route path="/article/:id" component={ArticlePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleAnalytics />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
