// SPA-only production build config — server statik fayllar bilan serve qiladi.
//
// Lokal development uchun `vite.config.ts` (lovable/tanstack-start) ishlatiladi.
// Production'da `vite build --config vite.config.spa.ts` chaqiriladi:
//   - SSR yo'q, faqat client bundle
//   - Output: dist-spa/ (index.html + assets/)
//   - Nginx yoki har qanday static host orqali serve qilinadi
//
// `src/main.tsx` SPA entry sifatida ishlaydi va TanStack Router'ni client'da mount qiladi.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      // routeTree.gen.ts allaqachon Start tomonidan generate qilingan —
      // SPA'da bir xil routeTree ishlatamiz.
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: "dist-spa",
    sourcemap: true,
    rollupOptions: {
      output: {
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
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
