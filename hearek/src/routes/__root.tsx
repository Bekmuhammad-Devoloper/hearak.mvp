import { Outlet, Link, useRouter, createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { Logomark } from "@/components/brand-icons";
import { LocaleProvider } from "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-calm px-6">
      <div className="max-w-sm w-full rounded-[32px] bg-card p-8 shadow-soft ring-1 ring-border/60 text-center">
        <Logomark className="mx-auto mb-5 h-10 w-10 text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">404</p>
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Xatolik</p>
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
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <LocaleProvider>
      <Outlet />
      <Toaster position="top-center" />
    </LocaleProvider>
  );
}
