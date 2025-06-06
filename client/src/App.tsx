import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import MovingChecklist from "@/pages/moving-checklist";
import RelocationHub from "@/pages/relocation-hub-simple";
import Dashboard from "@/pages/dashboard";
import Utilities from "@/pages/utilities";
import AIAssistant from "@/pages/ai-assistant";
import MovingJourney from "@/pages/moving-journey";
import LogoShowcase from "@/pages/logo-showcase";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-center items-center max-w-7xl mx-auto">
        <Link href="/">
          <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="text-3xl font-bold text-blue-600">Ezrelo</div>
          </div>
        </Link>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div>
      <Navigation />
      <Switch>
        <Route path="/" component={RelocationHub} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/moving-journey" component={MovingJourney} />
        <Route path="/utilities" component={Utilities} />
        <Route path="/moving-checklist" component={MovingChecklist} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/logo-showcase" component={LogoShowcase} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
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
