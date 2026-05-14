import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Ear, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { api, getToken } from "@/lib/api";

export const Route = createFileRoute("/")({ component: Splash });

type MeResponse = { user: { role: "parent" | "specialist" }; children: Array<{ id: string }> };

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
          if (res.user.role === "specialist") {
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
    <div className="min-h-screen bg-gradient-calm flex items-center justify-center px-6">
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mx-auto size-24 rounded-3xl bg-card shadow-soft flex items-center justify-center mb-6 relative">
          <Ear className="size-12 text-primary" strokeWidth={1.5} />
          <Sparkles className="size-5 text-warm absolute top-3 right-3" />
        </div>
        <h1 className="font-display text-5xl font-semibold text-foreground mb-2">Hearak</h1>
        <p className="text-muted-foreground">Eshitish sayohatidagi yumshoq yo'ldosh</p>
        <div className="mt-10">
          <Link to="/onboarding">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              O'tkazib yuborish
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
