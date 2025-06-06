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
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex justify-center items-center max-w-7xl mx-auto">
        <Link href="/">
          <div className="text-xl font-bold text-blue-600">Ezrelo</div>
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
        <Route path="/utilities" component={Utilities} />
        <Route path="/moving-checklist" component={MovingChecklist} />
        <Route path="/analytics" component={Analytics} />
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
