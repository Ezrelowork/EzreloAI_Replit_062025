import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";

import Home from "./pages/home";
import AIAssistant from "./pages/ai-assistant";
import MovingJourney from "./pages/moving-journey";
import MovingCompanies from "./pages/moving-companies";
import Utilities from "./pages/utilities";
import LocalServices from "./pages/local-services";
import Housing from "./pages/housing";
import Analytics from "./pages/analytics";
import Documentation from "./pages/documentation";
import ChangeOfAddress from "./pages/change-of-address";
import RelocationHub from "./pages/relocation-hub";
import Landing from "./pages/landing";
import LogoShowcase from "./pages/logo-showcase";
import NotFound from "./pages/not-found";
import { Suspense } from "react";

function App() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
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
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
