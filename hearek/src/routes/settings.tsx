import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight, Globe, Loader2, LogOut, Stethoscope, User, Users } from "lucide-react";
import { useMe, useSignout } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Logomark } from "@/components/brand-icons";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const me = useMe();
  const signout = useSignout();
  const nav = useNavigate();

  const handleSignout = async () => {
    await signout.mutateAsync().catch(() => {});
    nav({ to: "/auth", replace: true });
  };

  type Tone = "primary" | "warm" | "accent" | "success";
  const items: Array<{
    icon: typeof User;
    label: string;
    sublabel?: string;
    to: "/settings/profile" | "/settings/children" | "/settings/notifications" | "/settings/language";
    tone: Tone;
  }> = [
    {
      icon: User,
      label: "Profil ma'lumotlari",
      sublabel: me.data?.user.email,
      to: "/settings/profile",
      tone: "primary",
    },
    { icon: Users, label: "Bola profillari", to: "/settings/children", tone: "warm" },
    { icon: Bell, label: "Bildirishnomalar", to: "/settings/notifications", tone: "accent" },
    { icon: Globe, label: "Til", sublabel: "O'zbekcha", to: "/settings/language", tone: "success" },
  ];

  const toneCls: Record<Tone, { bg: string; text: string }> = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    warm: { bg: "bg-warm-soft", text: "text-warm-foreground" },
    accent: { bg: "bg-accent-soft", text: "text-accent-foreground" },
    success: { bg: "bg-success-soft", text: "text-success" },
  };

  const avatarUrl = me.data?.user.avatarUrl ?? null;
  const monogram = me.data?.user.avatarLetter ?? "?";

  return (
    <MobileShell>
      <header className="px-5 pt-12 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Sozlamalar
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
          Hisobingiz
        </h1>
      </header>

      <div className="px-5 space-y-5">
        {/* Profile card */}
        <Link to="/settings/profile">
          <div className="press relative overflow-hidden rounded-[28px] bg-card p-5 shadow-card">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-primary/15 blur-2xl"
            />
            <div className="relative flex items-center gap-4">
              <div className="size-14 overflow-hidden rounded-2xl bg-primary-soft">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center font-display text-2xl font-semibold text-primary">
                    {monogram}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {me.data?.user.role === "specialist" ? "Mutaxassis" : "Ota-ona"}
                </p>
                <h2 className="font-display text-[17px] font-semibold tracking-tight truncate">
                  {me.data?.user.fullName ?? "Mehmon"}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {me.data?.user.email ?? ""}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        </Link>

        {/* Menu */}
        <div className="overflow-hidden rounded-[28px] bg-card shadow-card">
          {items.map((it) => {
            const t = toneCls[it.tone];
            return (
              <Link
                key={it.to}
                to={it.to}
                className="press flex w-full items-center gap-3.5 border-b border-border/60 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 last:border-0"
              >
                <span className={cn("grid size-10 place-items-center rounded-xl shrink-0", t.bg)}>
                  <it.icon className={cn("size-[18px]", t.text)} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold leading-tight">{it.label}</span>
                  {it.sublabel && (
                    <span className="mt-0.5 block text-xs text-muted-foreground truncate">
                      {it.sublabel}
                    </span>
                  )}
                </span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>

        {me.data?.user.role === "specialist" && (
          <Link to="/specialist">
            <Button
              variant="outline"
              className="press w-full h-12 rounded-2xl border-border-strong/60"
            >
              <Stethoscope className="size-4" />
              Mutaxassis paneliga o'tish
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          disabled={signout.isPending}
          onClick={handleSignout}
          className="press w-full h-12 rounded-2xl text-destructive hover:bg-destructive-soft hover:text-destructive"
        >
          {signout.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          Chiqish
        </Button>

        <div className="flex flex-col items-center gap-2 pt-6 pb-2">
          <Logomark className="h-6 w-6 opacity-60" />
          <p className="text-[11px] text-muted-foreground">Hearak v0.1 · mehr bilan ishlangan</p>
        </div>
      </div>
    </MobileShell>
  );
}
