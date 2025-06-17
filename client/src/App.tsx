import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { lazy, Suspense } from "react";

// Lazy load components for better performance
const Home = lazy(() => import("./pages/home"));
const AIAssistant = lazy(() => import("./pages/ai-assistant"));
const MovingJourney = lazy(() => import("./pages/moving-journey"));
const MovingCompanies = lazy(() => import("./pages/moving-companies"));
const Utilities = lazy(() => import("./pages/utilities"));
const LocalServices = lazy(() => import("./pages/local-services"));
const Housing = lazy(() => import("./pages/housing"));
const Analytics = lazy(() => import("./pages/analytics"));
const Documentation = lazy(() => import("./pages/documentation"));
const ChangeOfAddress = lazy(() => import("./pages/change-of-address"));
const RelocationHub = lazy(() => import("./pages/relocation-hub"));
const Landing = lazy(() => import("./pages/landing"));
const LogoShowcase = lazy(() => import("./pages/logo-showcase"));
const NotFound = lazy(() => import("./pages/not-found"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/moving-journey" component={MovingJourney} />
        <Route path="/moving-companies" component={MovingCompanies} />
        <Route path="/utilities" component={Utilities} />
        <Route path="/local-services" component={LocalServices} />
        <Route path="/housing" component={Housing} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/change-of-address" component={ChangeOfAddress} />
        <Route path="/relocation-hub" component={RelocationHub} />
        <Route path="/landing" component={Landing} />
        <Route path="/logo-showcase" component={LogoShowcase} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;