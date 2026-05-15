// SPA entry point — production build uchun (lovable cloudflare wrapper'siz).
// Lokal dev hamon `vite dev` + TanStack Start orqali ishlaydi;
// bu fayl faqat `vite build --config vite.config.spa.ts` chaqirilganda kiradi.
//
// MUHIM: <Toaster /> bu yerda RENDER QILINMAYDI. U `__root.tsx`'dagi
// RootComponent ichida render bo'ladi (RouterProvider routeTree'ni mount qilganda).
// Agar shu yerda ham qo'shsak — Sonner ikkita instance ochadi, ikkita <section>
// portal, va sahifa "javob bermay" qoladi (DOM thrash + duplicate global listener).

import "./styles.css";
import "./lib/error-capture";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";

const router = getRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider
      client={
        (router.options.context as {
          queryClient: import("@tanstack/react-query").QueryClient;
        }).queryClient
      }
    >
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
