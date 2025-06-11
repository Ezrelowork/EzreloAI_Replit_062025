import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import MovingChecklist from "@/pages/moving-checklist";
import MovingCompanies from "@/pages/moving-companies";
import Utilities from "@/pages/utilities";
import LocalServices from "@/pages/local-services";
import Housing from "@/pages/housing";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";
import Documentation from "@/pages/documentation";
import ChangeOfAddress from "@/pages/change-of-address";
import RelocationHub from "@/pages/relocation-hub";
import Landing from "@/pages/landing";
import LogoShowcase from "@/pages/logo-showcase";
import AIAssistant from "@/pages/ai-assistant";
import MovingJourney from "@/pages/moving-journey";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/moving-journey" component={MovingJourney} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/moving-checklist" component={MovingChecklist} />
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