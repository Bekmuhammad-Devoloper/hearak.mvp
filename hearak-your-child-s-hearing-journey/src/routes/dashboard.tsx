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
  Sparkles,
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

  useEffect(() => {
    if (isError) {
      nav({ to: "/auth", replace: true });
    } else if (hasNoChildren) {
      nav({ to: "/add-child", replace: true });
    }
  }, [isError, hasNoChildren, nav]);

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
  const pendingAssignments = (assignments.data?.assignments ?? []).filter((a) => !a.done);

  return (
    <MobileShell>
      <div className="bg-gradient-hero px-5 pt-10 pb-8 rounded-b-[2.5rem]">
        <p className="text-sm text-muted-foreground">Assalomu alaykum,</p>
        <h1 className="font-display text-2xl font-semibold">{firstName} 💙</h1>

        <div className="mt-6 bg-card rounded-3xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-warm/40 flex items-center justify-center text-2xl">
              {child.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1 -ml-1 px-1 rounded-md hover:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Bolani almashtirish"
                >
                  <h2 className="font-display text-lg font-semibold truncate">{child.name}</h2>
                  {children.length > 1 && <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
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
              <p className="text-xs text-muted-foreground">{child.days} kun implantatsiyadan keyin</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">{child.stage}</span>
              <span className="font-semibold text-primary">
                {child.stageNumber}/{child.totalStages}
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={child.pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${child.pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-4">
        {risk.data && risk.data.level !== "ok" && <RiskBanner risk={risk.data} />}

        <Link to="/exercises" className="block">
          <div className="bg-card rounded-3xl p-5 shadow-card hover:shadow-soft transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-warm-foreground" />
                <h3 className="font-display text-lg font-semibold">Bugungi 5 daqiqa</h3>
              </div>
              <ArrowRight className="size-5 text-muted-foreground" />
            </div>
            <div className="flex gap-2">
              {exercises.isLoading ? (
                <div className="flex-1 h-16 bg-primary-soft rounded-2xl animate-pulse" />
              ) : (
                exercises.data?.exercises.map((e) => (
                  <div
                    key={e.id}
                    className={`flex-1 bg-primary-soft rounded-2xl p-3 text-center transition-opacity ${
                      e.completed ? "opacity-60" : ""
                    }`}
                  >
                    <div className="text-2xl mb-1">{e.emoji}</div>
                    <div className="text-[10px] text-muted-foreground">{e.type}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/games">
            <div className="bg-card rounded-2xl p-4 shadow-card h-full">
              <Gamepad2 className="size-6 text-primary mb-2" />
              <div className="font-semibold text-sm">Mini o'yinlar</div>
              <div className="text-xs text-muted-foreground">4 ta qiziqarli</div>
            </div>
          </Link>
          <Link to="/speech-check">
            <div className="bg-card rounded-2xl p-4 shadow-card h-full">
              <Mic className="size-6 text-warm-foreground mb-2" />
              <div className="font-semibold text-sm">Nutqni tinglash</div>
              <div className="text-xs text-muted-foreground">Mikrofon orqali</div>
            </div>
          </Link>
          <Link to="/diagnostics">
            <div className="bg-card rounded-2xl p-4 shadow-card h-full">
              <ClipboardCheck className="size-6 text-accent-foreground mb-2" />
              <div className="font-semibold text-sm">Diagnostika</div>
              <div className="text-xs text-muted-foreground">8 ta savol</div>
            </div>
          </Link>
          <Link to="/progress">
            <div className="bg-card rounded-2xl p-4 shadow-card h-full">
              <TrendingUp className="size-6 text-success mb-2" />
              <div className="font-semibold text-sm">Rivojlanish</div>
              <div className="text-xs text-muted-foreground">Grafik & bosqichlar</div>
            </div>
          </Link>
        </div>

        {pendingAssignments.length > 0 && (
          <div className="bg-card rounded-3xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold">Mutaxassis topshiriqlari</h3>
              <span className="text-xs text-muted-foreground">{pendingAssignments.length} ta</span>
            </div>
            <div className="space-y-2">
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
                  className="w-full flex items-center gap-3 p-3 bg-muted/40 rounded-2xl text-left hover:bg-muted/60 transition-colors disabled:opacity-50"
                >
                  <div className="size-6 rounded-full border-2 border-border shrink-0" />
                  <span className="text-sm flex-1">{a.title}</span>
                  <Check className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        <Link to="/chat">
          <Button variant="outline" size="lg" className="w-full h-14 rounded-2xl mt-2">
            Yordamchi bilan suhbat
          </Button>
        </Link>
      </div>
    </MobileShell>
  );
}

function RiskBanner({ risk }: { risk: RiskStatus }) {
  const isAlert = risk.level === "alert";
  return (
    <div
      className={cn(
        "rounded-3xl p-4 shadow-card border",
        isAlert ? "bg-destructive/10 border-destructive/30" : "bg-warm/30 border-warm/40",
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn("size-5 shrink-0 mt-0.5", isAlert ? "text-destructive" : "text-warm-foreground")}
        />
        <div className="flex-1">
          <h4 className={cn("font-semibold text-sm", isAlert ? "text-destructive" : "text-warm-foreground")}>
            {isAlert ? "Mutaxassis aralashuvi kerak" : "E'tibor bering"}
          </h4>
          <p className="text-sm mt-1">{risk.recommendation}</p>
          {risk.reasons.length > 0 && (
            <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
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
