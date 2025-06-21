import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0", // ⬅️ Bind to all interfaces for Replit
    port: 5000, // ⬅️ Force Vite to run on port 5000
    strictPort: true, // ⬅️ Prevent Vite from falling back to 5173
    hmr: {
      host: "0.0.0.0", // ⬅️ Bind HMR to all interfaces
      port: 5000, // ⬅️ Fix WebSocket HMR by binding it to port 5000
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
