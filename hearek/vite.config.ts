// Vanilla Vite + React + TanStack Router + Tailwind v4.
// Bir konfiguratsiya: dev (`npm run dev`) va prod (`npm run build`) uchun.
// SPA (no SSR) — `index.html` entry, `src/main.tsx` mount qiladi.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    // routeTree.gen.ts'ni avtomatik yangilab turadi.
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: "dist-spa",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Yirik kutubxonalarni alohida chunk'larga ajratib brauzer cache foydasini olamiz.
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    // Backend bilan bir tarmoq orqali ulanish — telefon/ngrok bir URL'dan ishlatadi.
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
    // Ngrok / tunnel hostlari ham qabul qilinsin.
    allowedHosts: true,
  },
});
