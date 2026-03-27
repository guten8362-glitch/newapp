import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.jpg", "robots.txt"],
      manifest: {
        name: "Remainder",
        short_name: "Remainder",
        description: "Intelligent Priority Command Board",
        theme_color: "#1a1a1a",
        background_color: "#1a1a1a",
        display: "standalone",
        icons: [
          {
            src: "logo.jpg",
            sizes: "192x192",
            type: "image/jpeg"
          },
          {
            src: "logo.jpg",
            sizes: "512x512",
            type: "image/jpeg"
          },
          {
            src: "logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any maskable"
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
