// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      // LAN/tunnel orqali kelgan so'rovlar ishlasin (telefon, ngrok va h.k.).
      host: true,
      // Backend (NestJS, port 3001) bilan bir tarmoq orqali ulanish.
      // Frontend /api/* requestlari shu yerda local backend'ga uzatiladi —
      // shu tariqa telefon faqat frontend URL'iga kiradi, backend internet'da bo'lishi shart emas.
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
      // Ngrok / Cloudflare tunnel host'larini ham qabul qilish.
      allowedHosts: true,
    },
  },
});
