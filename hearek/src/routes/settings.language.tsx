import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { SubHeader } from "@/components/SubHeader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings/language")({ component: LanguagePage });

function LanguagePage() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const nav = useNavigate();

  const pick = (v: "uz" | "ru") => {
    setLocale(v);
    toast.success(v === "uz" ? t("langSelectedUz") : t("langSelectedRu"));
    nav({ to: "/settings" });
  };

  const options: Array<{ v: "uz" | "ru"; labelKey: "langUz" | "langRu"; hintKey: "langUzHint" | "langRuHint" }> = [
    { v: "uz", labelKey: "langUz", hintKey: "langUzHint" },
    { v: "ru", labelKey: "langRu", hintKey: "langRuHint" },
  ];

  return (
    <MobileShell>
      <SubHeader back="/settings" kicker={t("settingsKicker")} title={t("language")} />

      <div className="px-5 space-y-2">
        {options.map((o) => {
          const active = locale === o.v;
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
                <div className="text-sm font-semibold tracking-tight">{t(o.labelKey)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{t(o.hintKey)}</div>
              </div>
              {active && <Check className="size-5 text-primary" strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>
    </MobileShell>
  );
}
