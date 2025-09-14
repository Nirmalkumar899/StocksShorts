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
import SebiRiaNew from "@/pages/sebi-ria-new";
import SebiRiaRegister from "@/pages/sebi-ria-register";
import AdvisorDashboard from "@/pages/advisor-dashboard";
import AdvisorDirectory from "@/pages/advisor-directory";
import Contact from "@/pages/contact";
import Profile from "@/pages/profile";
import ArticlePage from "@/pages/article-new";
import GmailConnect from "@/pages/GmailConnect";
import SplashScreen from "@/components/splash-screen";

function Router() {
  const [location, setLocation] = useLocation();
  
  // Force rebuild to clear cache
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
      <Route path="/">
        {() => <Home />}
      </Route>
      <Route path="/home">
        {() => <Home />}
      </Route>
      <Route path="/trending">
        {() => <Home initialCategory="trending" />}
      </Route>
      <Route path="/special">
        {() => <Home />}
      </Route>
      <Route path="/breakout">
        {() => <Home />}
      </Route>
      <Route path="/kalkabazaar">
        {() => <Home />}
      </Route>
      <Route path="/warrants">
        {() => <Home />}
      </Route>
      <Route path="/educational">
        {() => <Home />}
      </Route>
      <Route path="/ipo">
        {() => <Home />}
      </Route>

      <Route path="/others">
        {() => <Home />}
      </Route>
      <Route path="/crypto">
        {() => <Home />}
      </Route>
      <Route path="/us-market">
        {() => <Home />}
      </Route>
      <Route path="/orders">
        {() => <Home />}
      </Route>
      <Route path="/research">
        {() => <Home />}
      </Route>

      <Route path="/sebi-ria">
        {() => <SebiRiaNew onBack={() => window.history.back()} />}
      </Route>
      <Route path="/sebi-ria/register">
        {() => <SebiRiaRegister onBack={() => window.history.back()} />}
      </Route>
      <Route path="/sebi-ria-register">
        {() => <SebiRiaRegister onBack={() => window.history.back()} />}
      </Route>
      <Route path="/advisor-dashboard">
        {() => <AdvisorDashboard onBack={() => window.history.back()} />}
      </Route>
      <Route path="/advisor-directory">
        {() => <AdvisorDirectory onBack={() => window.history.back()} />}
      </Route>
      <Route path="/contact">
        {() => <Contact onBack={() => window.history.back()} />}
      </Route>
      <Route path="/profile">
        {() => <Profile onBack={() => window.history.back()} />}
      </Route>
      <Route path="/gmail-connect" component={GmailConnect} />
      <Route path="/disclaimer">
        {() => <Home />}
      </Route>
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
