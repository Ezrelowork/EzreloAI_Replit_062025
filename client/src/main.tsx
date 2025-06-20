import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Create the client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);