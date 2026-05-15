import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { SubHeader } from "@/components/SubHeader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings/language")({ component: LanguagePage });

const LANG_KEY = "hearak.lang";

function LanguagePage() {
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const nav = useNavigate();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LANG_KEY);
      if (raw === "ru" || raw === "uz") setLang(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const pick = (v: "uz" | "ru") => {
    setLang(v);
    try {
      window.localStorage.setItem(LANG_KEY, v);
    } catch {
      /* ignore */
    }
    toast.success(v === "uz" ? "O'zbekcha tanlandi" : "Выбран русский");
    nav({ to: "/settings" });
  };

  const options: Array<{ v: "uz" | "ru"; label: string; hint: string }> = [
    { v: "uz", label: "O'zbekcha", hint: "Asosiy til" },
    { v: "ru", label: "Русский", hint: "Tez orada" },
  ];

  return (
    <MobileShell>
      <SubHeader back="/settings" kicker="Sozlamalar" title="Til" />

      <div className="px-5 space-y-2">
        {options.map((o) => {
          const active = lang === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => pick(o.v)}
              className={cn(
                "press flex w-full items-center justify-between rounded-2xl p-4 text-left transition-colors",
                active
                  ? "bg-primary-soft ring-1 ring-primary/30"
                  : "bg-card shadow-card hover:bg-muted/40",
              )}
            >
              <div>
                <div className="text-sm font-semibold tracking-tight">{o.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{o.hint}</div>
              </div>
              {active && <Check className="size-5 text-primary" strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>
    </MobileShell>
  );
}
