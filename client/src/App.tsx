import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import HomeV2 from "@/pages/Home_v2";
import HomeV2Clean from "@/pages/HomeV2Clean";
import HomeV3 from "@/pages/HomeV3";
import HomeV3Backup from "@/pages/HomeV3_backup";
import Auth from "@/pages/Auth";
import Dashboard from "./pages/Dashboard";
import Education from "./pages/Education";
import Lesson from "./pages/Lesson";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Subscribe from "./pages/Subscribe";
import TestPayPal from "./pages/TestPayPal";
import Predictions from "./pages/Predictions";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";
import { initGTM, addGTMNoScript } from "./lib/gtm";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function Router() {
  // Track page views automatically
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={HomeV3} />
      <Route path="/v1" component={Home} />
      <Route path="/v2" component={HomeV2} />
      <Route path="/v2clean" component={HomeV2Clean} />
      <Route path="/v3" component={HomeV3} />
      <Route path="/v3-backup" component={HomeV3Backup} />
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/education" component={Education} />
      <Route path="/lesson/:id" component={Lesson} />
      <Route path="/profile" component={Profile} />
      <Route path="/predictions" component={Predictions} />
      <Route path="/support" component={Support} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/test-paypal" component={TestPayPal} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/analytics" component={Analytics} />

      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize tracking when app starts (temporarily disabled for debugging)
  useEffect(() => {
    // Temporarily disabled to debug loading issues
    // initGA();
    // initGTM();
    
    // Add GTM noscript fallback after DOM is ready
    // setTimeout(() => {
    //   addGTMNoScript();
    // }, 100);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;