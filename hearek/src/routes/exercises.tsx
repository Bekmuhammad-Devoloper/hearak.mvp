import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Check, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useDailyExercises, useToggleExercise } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/exercises")({ component: Exercises });

function Exercises() {
  const { child, isLoading } = useActiveChild();
  const exercises = useDailyExercises(child?.id);
  const toggle = useToggleExercise(child?.id);

  if (isLoading || !child || exercises.isLoading) {
    return (
      <MobileShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  const list = exercises.data?.exercises ?? [];
  const done = list.filter((e) => e.completed).length;
  const allDone = list.length > 0 && done === list.length;
  const pct = list.length === 0 ? 0 : Math.round((done / list.length) * 100);

  return (
    <MobileShell>
      <header className="px-5 pt-12 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Bugungi 5 daqiqa
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
          3 ta kichik mashq
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Bolangizning kunidagi eng muhim payti — qisqa, izchil, samarali.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700"
              style={{ width: `${pct}%`, transitionTimingFunction: "var(--ease-emphasized)" }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {done}/{list.length}
          </span>
        </div>
      </header>

      <div className="px-5 space-y-3">
        {list.map((ex) => (
          <div
            key={ex.id}
            className={cn(
              "rounded-[24px] p-4 shadow-card transition-colors",
              ex.completed ? "bg-success-soft" : "bg-card",
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "grid size-14 place-items-center rounded-2xl text-3xl shrink-0 transition-colors",
                  ex.completed ? "bg-success/20" : "bg-primary-soft",
                )}
              >
                {ex.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {ex.type}
                </div>
                <h3 className="mt-0.5 font-display text-[16px] font-semibold leading-tight tracking-tight">
                  {ex.title}
                </h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> {ex.minutes} daqiqa
                </div>
              </div>
              <button
                type="button"
                aria-pressed={ex.completed}
                aria-label={ex.completed ? "Bekor qilish" : "Bajarildi deb belgilash"}
                disabled={toggle.isPending}
                onClick={() => {
                  toggle
                    .mutateAsync({ exerciseId: ex.id, completed: !ex.completed })
                    .catch((err) =>
                      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz"),
                    );
                }}
                className={cn(
                  "press grid size-10 place-items-center rounded-full border-2 shrink-0 transition-colors disabled:opacity-50",
                  ex.completed
                    ? "bg-success border-success text-success-foreground"
                    : "border-border-strong/70 hover:border-primary",
                )}
              >
                {ex.completed && <Check className="size-5" strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        ))}

        {allDone && (
          <div className="bg-gradient-hero rounded-[28px] p-6 text-center shadow-soft ring-1 ring-border/60">
            <div
              className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-card text-2xl shadow-xs"
              aria-hidden
            >
              🌟
            </div>
            <h3 className="font-display text-xl font-semibold tracking-tight">Ajoyib!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bugungi sayohat yakunlandi. Ertaga yana ko'rishguncha.
            </p>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
