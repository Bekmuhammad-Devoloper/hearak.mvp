import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, Home, MessageCircle, Settings, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type Tab = {
  to: string;
  key: "home" | "progress" | "exercises" | "chat" | "settings";
  Icon: React.FC<React.SVGAttributes<SVGSVGElement> & { strokeWidth?: number }>;
};

// Rasmga muvofiq, Lucide standart iconlar.
const tabs: ReadonlyArray<Tab> = [
  { to: "/dashboard", key: "home", Icon: Home },
  { to: "/progress", key: "progress", Icon: Activity },
  { to: "/exercises", key: "exercises", Icon: Sparkles },
  { to: "/chat", key: "chat", Icon: MessageCircle },
  { to: "/settings", key: "settings", Icon: Settings },
];

export function BottomNav() {
  const t = useT();
  const loc = useLocation();
  const activeIdx = Math.max(
    0,
    tabs.findIndex((tab) => loc.pathname.startsWith(tab.to)),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const target = container.querySelector<HTMLElement>(`[data-tab-index="${activeIdx}"]`);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const parent = container.getBoundingClientRect();
      setPill({ left: rect.left - parent.left, width: rect.width });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [activeIdx]);

  return (
    <nav
      aria-label="Asosiy navigatsiya"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md px-3 pb-3 pt-2 safe-bottom"
    >
      <div
        ref={containerRef}
        className="relative grid grid-cols-5 gap-1 rounded-full border border-border/60 bg-card/85 px-1.5 py-1.5 shadow-soft backdrop-blur-xl"
      >
        {pill && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-1.5 rounded-full bg-primary/10 transition-all duration-[420ms]"
            style={{
              left: pill.left,
              width: pill.width,
              transitionTimingFunction: "var(--ease-emphasized)",
            }}
          />
        )}

        {tabs.map((tab, idx) => {
          const active = idx === activeIdx;
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              data-tab-index={idx}
              aria-current={active ? "page" : undefined}
              aria-label={t(tab.key)}
              className={cn(
                "relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 outline-none press focus-ring",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              <span
                className={cn(
                  "transition-transform duration-300",
                  active ? "scale-110" : "scale-100",
                )}
                style={{ transitionTimingFunction: "var(--ease-emphasized)" }}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.85} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-tight transition-all",
                  active ? "opacity-100" : "opacity-70",
                )}
              >
                {t(tab.key)}
              </span>
              {active && (
                <span aria-hidden className="absolute -top-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
