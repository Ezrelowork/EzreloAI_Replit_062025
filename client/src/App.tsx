import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <Link href="/">
            <div className="text-xl font-bold text-blue-600">Ezrelo</div>
          </Link>
          <div className="flex space-x-4">
            <Link href="/">
              <Button variant={location === "/" ? "default" : "ghost"} size="sm">
                Provider Search
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant={location === "/analytics" ? "default" : "ghost"} size="sm">
                Analytics Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
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
