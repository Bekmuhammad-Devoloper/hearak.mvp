import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand-icons";
import { api, getToken } from "@/lib/api";

export const Route = createFileRoute("/")({ component: Splash });

type MeResponse = {
  user: { role: "parent" | "specialist" | "admin" };
  children: Array<{ id: string }>;
};

function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled) nav({ to: "/onboarding", replace: true });
    }, 1800);

    if (getToken()) {
      api<MeResponse>("/api/me")
        .then((res) => {
          if (cancelled) return;
          clearTimeout(fallback);
          if (res.user.role === "admin") {
            nav({ to: "/admin/dashboard", replace: true });
          } else if (res.user.role === "specialist") {
            nav({ to: "/specialist", replace: true });
          } else if (res.children.length > 0) {
            nav({ to: "/dashboard", replace: true });
          } else {
            nav({ to: "/add-child", replace: true });
          }
        })
        .catch(() => {
          // token invalid — fall through to onboarding
        });
    }

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [nav]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-calm">
      {/* Yumshoq dekoratsiyalar — kompozitsiyaga teranlik beradi */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-12 size-80 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grain opacity-40"
      />

      <div className="relative flex min-h-screen flex-col items-center justify-between px-6 py-12">
        {/* Yuqori "tag" — brand label */}
        <div className="flex w-full items-center justify-center">
          <span className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
            Kokleyar implant · raqamli yo'ldosh
          </span>
        </div>

        {/* Logo + wordmark — markaz */}
        <div className="text-center">
          <div className="splash-float mx-auto mb-7">
            <BrandLogo className="h-44 w-44" />
          </div>
          <h1
            className="splash-rise font-display text-[64px] leading-none font-semibold tracking-[-0.03em] text-foreground"
            style={{ fontFeatureSettings: '"ss01"' }}
          >
            hearak
          </h1>
          <p className="splash-rise mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-[24ch] mx-auto">
            Eshitish va nutq sayohatidagi yumshoq yo'ldosh
          </p>
        </div>

        {/* Pastki yo'lboshchi */}
        <div className="splash-rise w-full flex flex-col items-center gap-3">
          <SoundWaveLoader />
          <Link to="/onboarding">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              O'tkazib yuborish
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes splash-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes splash-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .splash-float {
          animation: splash-float 4.2s ease-in-out infinite;
        }
        .splash-rise {
          opacity: 0;
          animation: splash-rise 0.8s var(--ease-emphasized) forwards;
          animation-delay: 0.25s;
        }
        .splash-rise:nth-of-type(2) { animation-delay: 0.4s; }
        .splash-rise:last-child { animation-delay: 0.55s; }
      `}</style>
    </div>
  );
}

function SoundWaveLoader() {
  return (
    <div className="flex items-end gap-1 h-3" aria-label="Yuklanmoqda">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-primary/70"
          style={{
            height: "100%",
            animation: `splash-bar 1.2s ${i * 0.12}s ease-in-out infinite`,
            transformOrigin: "bottom",
          }}
        />
      ))}
      <style>{`
        @keyframes splash-bar {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
