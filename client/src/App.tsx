import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAnalytics } from "@/components/google-analytics";
import { useSEO } from "@/hooks/useSEO";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import SebiRia from "@/pages/sebi-ria-new";
import Contact from "@/pages/contact";
import Profile from "@/pages/profile";
import ArticlePage from "@/pages/article-new";

function Router() {
  useSEO(); // Enable dynamic SEO
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/trending" component={Home} />
      <Route path="/special" component={Home} />
      <Route path="/breakout" component={Home} />
      <Route path="/kalkabazaar" component={Home} />
      <Route path="/warrants" component={Home} />
      <Route path="/educational" component={Home} />
      <Route path="/ipo" component={Home} />
      <Route path="/global" component={Home} />
      <Route path="/others" component={Home} />
      <Route path="/orders" component={Home} />
      <Route path="/research" component={Home} />
      <Route path="/ai-news" component={Home} />
      <Route path="/sebi-ria">
        {() => <SebiRia onBack={() => window.history.back()} />}
      </Route>
      <Route path="/contact">
        {() => <Contact onBack={() => window.history.back()} />}
      </Route>
      <Route path="/profile">
        {() => <Profile onBack={() => window.history.back()} />}
      </Route>
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
