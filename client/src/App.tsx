import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AuthGuard from "./components/auth-guard";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import MovingCompanies from "./pages/moving-companies";
import Utilities from "./pages/utilities";
import Housing from "./pages/housing";
import LocalServices from "./pages/local-services";
import Documentation from "./pages/documentation";
import MovingChecklist from "./pages/moving-checklist";
import ChangeOfAddress from "./pages/change-of-address";
import AIAssistant from "./pages/ai-assistant";
import Analytics from "./pages/analytics";
import NotFound from "./pages/not-found";
import RelocationHub from "./pages/relocation-hub";
import MovingJourney from "@/pages/moving-journey";
import RelocationHubSimple from "./pages/relocation-hub-simple";
import LogoShowcase from "./pages/logo-showcase";
import Landing from "./pages/landing";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/hub" component={RelocationHub} />
        <Route path="/hub-simple" component={RelocationHubSimple} />
        <Route path="/landing" component={Landing} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/moving-companies" component={MovingCompanies} />
        <Route path="/utilities" component={Utilities} />
        <Route path="/housing" component={Housing} />
        <Route path="/local-services" component={LocalServices} />
        <Route path="/documentation" component={Documentation} />
        <Route path="/moving-checklist" component={MovingChecklist} />
        <Route path="/change-of-address" component={ChangeOfAddress} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/moving-journey" component={MovingJourney} />
        <Route path="/moving-journey-simple" component={MovingJourneySimple} />
        <Route path="/logo-showcase" component={LogoShowcase} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;