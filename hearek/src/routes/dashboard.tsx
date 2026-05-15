import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Gamepad2,
  Loader2,
  Mic,
  TrendingUp,
} from "lucide-react";
import { useEffect } from "react";
import {
  useActiveChild,
  useAssignments,
  useDailyExercises,
  useRisk,
  useSetActiveChild,
  useUpdateAssignment,
  type RiskStatus,
} from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const nav = useNavigate();
  const { data: me, child, children, isLoading, isError, hasNoChildren } = useActiveChild();
  const setActive = useSetActiveChild();
  const exercises = useDailyExercises(child?.id);
  const risk = useRisk(child?.id);
  const assignments = useAssignments(child?.id);
  const updateAssignment = useUpdateAssignment(child?.id);

  const role = me?.user.role;

  useEffect(() => {
    if (isError) {
      nav({ to: "/auth", replace: true });
    } else if (role === "admin") {
      nav({ to: "/admin/dashboard", replace: true });
    } else if (role === "specialist") {
      nav({ to: "/specialist", replace: true });
    } else if (hasNoChildren) {
      nav({ to: "/add-child", replace: true });
    }
  }, [isError, role, hasNoChildren, nav]);

  if (isLoading || !child) {
    return (
      <MobileShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  const firstName = me?.user.fullName.split(" ")[0] ?? "";
  const monogram = child.name.charAt(0).toUpperCase();
  const pendingAssignments = (assignments.data?.assignments ?? []).filter((a) => !a.done);
  const exerciseList = exercises.data?.exercises ?? [];
  const doneCount = exerciseList.filter((e) => e.completed).length;

  return (
    <MobileShell>
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="bg-gradient-hero px-5 pt-12 pb-7 rounded-b-[2.5rem]">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              Assalomu alaykum
            </p>
            <h1 className="mt-1 font-display text-[26px] leading-tight font-semibold tracking-tight">
              {firstName}
            </h1>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] bg-card/95 p-5 shadow-soft backdrop-blur-sm ring-1 ring-border/60">
          <div className="flex items-center gap-4">
            {/* Bola monogrammasi — toza dumaloq kvadrat, qo'shimcha bezak emoji yo'q */}
            <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft font-display text-2xl font-semibold text-primary">
              {monogram}
            </div>

            <div className="flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1 -ml-1 px-1 py-0.5 rounded-lg hover:bg-muted/60 outline-none focus-ring"
                  aria-label="Bolani almashtirish"
                >
                  <h2 className="font-display text-[18px] font-semibold truncate tracking-tight">
                    {child.name}
                  </h2>
                  {children.length > 1 && (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Bolani tanlash</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {children.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => setActive(c.id)}
                      className="flex items-center gap-2"
                    >
                      <span className="text-lg">{c.emoji}</span>
                      <span className="flex-1">{c.name}</span>
                      {c.id === child.id && <span className="text-xs text-primary">✓</span>}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => nav({ to: "/add-child" })}>
                    + Yangi bola qo'shish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {child.days} kun · implantatsiyadan keyin
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between text-xs mb-2">
              <span className="text-muted-foreground truncate pr-2">{child.stage}</span>
              <span className="shrink-0 font-display text-sm font-semibold text-primary tabular-nums">
                {child.stageNumber}
                <span className="text-muted-foreground/60">/{child.totalStages}</span>
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={child.pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700"
                style={{
                  width: `${child.pct}%`,
                  transitionTimingFunction: "var(--ease-emphasized)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="px-5 pt-6 space-y-5">
        {risk.data && risk.data.level !== "ok" && <RiskBanner risk={risk.data} />}

        {/* ─── Bugungi 5 daqiqa ──────────────────────────────────── */}
        <Link to="/exercises" className="block">
          <div className="group relative overflow-hidden rounded-[28px] bg-card p-5 shadow-card press hover:shadow-soft">
            <div
              aria-hidden
              className="absolute -right-8 -top-8 size-36 rounded-full bg-warm/30 blur-2xl"
            />
            <div className="relative">
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warm-foreground">
                  Bugungi 5 daqiqa
                </p>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {doneCount}/{Math.max(exerciseList.length, 3)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {doneCount === 0
                    ? "Bugun boshlaylik"
                    : doneCount === exerciseList.length
                      ? "Bugun yakunlandi"
                      : "Davom etamiz"}
                </h3>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {exercises.isLoading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-[68px] rounded-2xl shimmer" />
                    ))
                  : exerciseList.map((e) => (
                      <div
                        key={e.id}
                        className={cn(
                          "rounded-2xl p-3 text-center transition-all",
                          e.completed ? "bg-success/15 ring-1 ring-success/30" : "bg-primary-soft",
                        )}
                      >
                        <div className="text-2xl mb-1">{e.emoji}</div>
                        <div
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            e.completed ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          {e.type}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </Link>

        {/* ─── Quick actions ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            to="/games"
            tone="primary"
            label="Mini o'yinlar"
            sub="4 ta qiziqarli"
            Icon={Gamepad2}
          />
          <QuickAction
            to="/speech-check"
            tone="warm"
            label="Nutqni tinglash"
            sub="Mikrofon orqali"
            Icon={Mic}
          />
          <QuickAction
            to="/diagnostics"
            tone="accent"
            label="Diagnostika"
            sub="8 ta savol"
            Icon={ClipboardCheck}
          />
          <QuickAction
            to="/progress"
            tone="success"
            label="Rivojlanish"
            sub="Grafik & bosqichlar"
            Icon={TrendingUp}
          />
        </div>

        {/* ─── Assignments ──────────────────────────────────────── */}
        {pendingAssignments.length > 0 && (
          <div className="rounded-[28px] bg-card p-5 shadow-card">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Mutaxassisdan
                </p>
                <h3 className="mt-0.5 font-display text-lg font-semibold tracking-tight">
                  Topshiriqlar
                </h3>
              </div>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
                {pendingAssignments.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {pendingAssignments.slice(0, 3).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={updateAssignment.isPending}
                  onClick={() => {
                    updateAssignment
                      .mutateAsync({ assignmentId: a.id, done: true })
                      .then(() => toast.success("Bajarildi deb belgilandi"))
                      .catch((err) =>
                        toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz"),
                      );
                  }}
                  className="press w-full flex items-center gap-3 rounded-2xl bg-muted/40 p-3 text-left transition-colors hover:bg-muted/70 disabled:opacity-50"
                >
                  <span className="grid size-6 place-items-center rounded-full border-2 border-border-strong/60 shrink-0 transition-colors group-hover:border-primary">
                    <Check className="size-3.5 opacity-0 transition-opacity" />
                  </span>
                  <span className="text-sm leading-snug flex-1">{a.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Link to="/chat">
          <Button
            variant="outline"
            size="lg"
            className="press w-full h-14 rounded-2xl border-border-strong/60 text-base font-semibold"
          >
            AI yordamchi bilan suhbat
          </Button>
        </Link>
      </div>
    </MobileShell>
  );
}

// ───────────────────────────────────────────────────────────────

type Tone = "primary" | "accent" | "warm" | "success";

const toneStyles: Record<Tone, { iconBg: string; iconText: string; halo: string }> = {
  primary: {
    iconBg: "bg-primary-soft",
    iconText: "text-primary",
    halo: "bg-primary/15",
  },
  accent: {
    iconBg: "bg-accent-soft",
    iconText: "text-accent-foreground",
    halo: "bg-accent/20",
  },
  warm: {
    iconBg: "bg-warm-soft",
    iconText: "text-warm-foreground",
    halo: "bg-warm/25",
  },
  success: {
    iconBg: "bg-success-soft",
    iconText: "text-success",
    halo: "bg-success/15",
  },
};

function QuickAction({
  to,
  tone,
  label,
  sub,
  Icon,
}: {
  to: string;
  tone: Tone;
  label: string;
  sub: string;
  Icon: React.FC<React.SVGAttributes<SVGSVGElement>>;
}) {
  const s = toneStyles[tone];
  return (
    <Link to={to} className="block">
      <div className="press relative h-full overflow-hidden rounded-3xl bg-card p-4 shadow-card hover:shadow-soft">
        <span
          aria-hidden
          className={cn("absolute -right-6 -top-6 size-24 rounded-full blur-2xl", s.halo)}
        />
        <div className={cn("relative grid size-11 place-items-center rounded-2xl", s.iconBg)}>
          <Icon className={cn("size-5", s.iconText)} />
        </div>
        <div className="relative mt-3">
          <div className="font-display text-[15px] font-semibold leading-tight tracking-tight">
            {label}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
        </div>
      </div>
    </Link>
  );
}

function RiskBanner({ risk }: { risk: RiskStatus }) {
  const isAlert = risk.level === "alert";
  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden rounded-[24px] border p-4 shadow-card",
        isAlert ? "border-destructive/25 bg-destructive-soft" : "border-warm/30 bg-warm-soft",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-0 bottom-0 w-1", isAlert ? "bg-destructive" : "bg-warm")}
      />
      <div className="flex items-start gap-3 pl-1">
        <div
          className={cn(
            "grid size-9 place-items-center rounded-full shrink-0",
            isAlert ? "bg-destructive/15 text-destructive" : "bg-warm/30 text-warm-foreground",
          )}
        >
          <AlertTriangle className="size-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-semibold text-sm tracking-tight",
              isAlert ? "text-destructive" : "text-warm-foreground",
            )}
          >
            {isAlert ? "Mutaxassis aralashuvi kerak" : "E'tibor bering"}
          </h4>
          <p className="mt-1 text-sm leading-snug text-ink-soft">{risk.recommendation}</p>
          {risk.reasons.length > 0 && (
            <ul className="mt-2 space-y-0.5 pl-3 text-xs text-muted-foreground list-['—_'] marker:text-muted-foreground/60">
              {risk.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
