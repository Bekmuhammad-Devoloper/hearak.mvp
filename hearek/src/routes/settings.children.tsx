import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Plus } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { SubHeader } from "@/components/SubHeader";
import { useActiveChild, useSetActiveChild } from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings/children")({ component: ChildrenPage });

function ChildrenPage() {
  const { children, child, isLoading } = useActiveChild();
  const setActive = useSetActiveChild();
  const nav = useNavigate();
  const t = useT();

  if (isLoading) {
    return (
      <MobileShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <SubHeader back="/settings" kicker={t("settingsKicker")} title={t("childProfiles")} />

      <div className="px-5 space-y-2">
        {children.length === 0 ? (
          <div className="rounded-[28px] bg-card p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">{t("noProfiles")}</p>
          </div>
        ) : (
          children.map((c) => {
            const isActive = child?.id === c.id;
            const monogram = c.name.charAt(0).toUpperCase();
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActive(c.id);
                  toast.success(`${c.name} faol bola sifatida tanlandi`);
                  nav({ to: "/settings" });
                }}
                className={cn(
                  "press flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-colors",
                  isActive
                    ? "bg-primary-soft ring-1 ring-primary/30"
                    : "bg-card shadow-card hover:bg-muted/40",
                )}
              >
                <div className="relative">
                  <div className="grid size-14 place-items-center rounded-2xl bg-card font-display text-xl font-semibold text-primary shadow-xs ring-1 ring-border/60">
                    {monogram}
                  </div>
                  <span
                    aria-hidden
                    className="absolute -bottom-1 -right-1 rounded-full bg-card px-1 py-0 text-base leading-none shadow-xs ring-1 ring-border/60"
                  >
                    {c.emoji}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[17px] font-semibold tracking-tight truncate">
                    {c.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground truncate tabular-nums">
                    {c.days} kun · {c.stage}
                  </div>
                </div>
                {isActive && <Check className="size-5 text-primary shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })
        )}

        <Link to="/add-child" className="block pt-2">
          <button
            type="button"
            className="press flex w-full items-center justify-center gap-2 h-14 rounded-2xl border-2 border-dashed border-border-strong/60 text-base font-semibold text-muted-foreground hover:bg-muted/30"
          >
            <Plus className="size-5" />
            {t("addChildPlus")}
          </button>
        </Link>
      </div>
    </MobileShell>
  );
}
