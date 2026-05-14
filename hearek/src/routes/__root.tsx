import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { Logomark } from "@/components/brand-icons";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-calm px-6">
      <div className="max-w-sm w-full rounded-[32px] bg-card p-8 shadow-soft ring-1 ring-border/60 text-center">
        <Logomark className="mx-auto mb-5 h-10 w-10 text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight tracking-tight">
          Sahifa topilmadi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Bu sahifa ko'chirilgan yoki mavjud emas. Boshqa joydan davom etamiz.
        </p>
        <Link
          to="/"
          className="press mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary-strong"
        >
          Asosiy sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-calm px-6">
      <div className="max-w-sm w-full rounded-[32px] bg-card p-8 shadow-soft ring-1 ring-border/60 text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-warm-soft text-warm-foreground">
          <svg viewBox="0 0 24 24" fill="none" className="size-6">
            <path
              d="M12 8v5M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Xatolik
        </p>
        <h1 className="mt-1 font-display text-[22px] font-semibold leading-tight tracking-tight">
          Sahifa yuklanmadi
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Biror narsa noto'g'ri ketdi. Qaytadan urinib ko'ring yoki bosh sahifaga qayting.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <a
            href="/"
            className="press inline-flex h-11 items-center justify-center rounded-2xl border border-border-strong/60 bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            Asosiyga
          </a>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press inline-flex h-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary-strong"
          >
            Qaytadan urinish
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hearak — Eshitish va nutq sayohati" },
      {
        name: "description",
        content: "Kokleyar implant olgan bolalar uchun raqamli reabilitatsiya yo'ldoshi.",
      },
      { name: "author", content: "Hearak" },
      { property: "og:title", content: "Hearak" },
      {
        property: "og:description",
        content: "Sizning bolangizning eshitish va nutq sayohatidagi yumshoq yo'ldosh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Platform favicon — `public/icon.png` da saqlanadi.
      { rel: "icon", type: "image/png", href: "/icon.png" },
      { rel: "apple-touch-icon", href: "/icon.png" },
      { rel: "shortcut icon", href: "/icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
