import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Check, Clock, Loader2, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useDailyExercises } from "@/lib/queries";
import { useT } from "@/lib/i18n";
import {
  EXERCISE_TO_GAME,
  exerciseShortLabel,
  exerciseToneClasses,
  exerciseVisual,
  previewEmojis,
  type ExerciseType,
} from "@/lib/exercise-meta";

export const Route = createFileRoute("/exercises")({ component: Exercises });

function Exercises() {
  const { child, isLoading } = useActiveChild();
  const exercises = useDailyExercises(child?.id);
  const nav = useNavigate();
  const t = useT();

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

  const handleCardClick = (ex: (typeof list)[number]) => {
    // O'yin bilan bog'langan mashq — to'g'ridan-to'g'ri o'yinga.
    const gameKey = EXERCISE_TO_GAME[ex.id];
    if (gameKey) {
      nav({
        to: "/games",
        search: { play: gameKey, exerciseId: ex.id },
      });
      return;
    }
    // O'yin emas — boshqariladigan mashq jarayoni (so'z + emoji + TTS).
    nav({ to: "/practice/$exerciseId", params: { exerciseId: ex.id } });
  };

  return (
    <MobileShell>
      <header className="px-5 pt-12 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("todayFiveMin")}
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
          {list.length} {t("exercisesCount")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("exercisesSubtitle")}
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
        {list.map((ex) => {
          const { Icon, tone } = exerciseVisual(ex.id, ex.type as ExerciseType);
          const ts = exerciseToneClasses[tone];
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => handleCardClick(ex)}
              className={cn(
                "press w-full rounded-[24px] p-4 text-left shadow-card ring-1 transition-all hover:-translate-y-0.5 hover:shadow-soft",
                ex.completed
                  ? "bg-success-soft ring-success/30"
                  : cn("bg-card", ts.ring),
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "grid size-14 place-items-center rounded-2xl shrink-0 transition-colors",
                    ex.completed
                      ? "bg-success/15 text-success"
                      : cn(ts.iconBg, ts.iconText),
                  )}
                >
                  <Icon className="size-6" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      ex.completed ? "text-success" : "text-muted-foreground",
                    )}
                  >
                    {exerciseShortLabel(ex.id, ex.title)}
                  </div>
                  <h3 className="mt-0.5 font-display text-[16px] font-semibold leading-tight tracking-tight">
                    {ex.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" /> {ex.minutes} {t("minutes")}
                    </span>
                    {!ex.completed && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Play className="size-3" fill="currentColor" /> Boshlash
                      </span>
                    )}
                  </div>
                  {/* Misol preview — kartaning ichida nima borligi bir qarashda */}
                  {(() => {
                    const previews = previewEmojis(ex.id, 5);
                    if (previews.length === 0) return null;
                    return (
                      <div
                        className={cn(
                          "mt-2.5 flex gap-1.5 text-[22px] leading-none select-none",
                          ex.completed && "opacity-60",
                        )}
                        aria-hidden
                      >
                        {previews.map((e, i) => (
                          <span key={i}>{e}</span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {/* Status — bosib bo'lmaydigan vizual indikator */}
                <div
                  aria-hidden
                  className={cn(
                    "grid size-9 place-items-center rounded-full shrink-0 transition-all",
                    ex.completed
                      ? "bg-success text-success-foreground"
                      : "border-2 border-border-strong/50 bg-transparent",
                  )}
                >
                  {ex.completed && <Check className="size-5" strokeWidth={2.5} />}
                </div>
              </div>
            </button>
          );
        })}

        {allDone && (
          <div className="bg-gradient-hero rounded-[28px] p-6 text-center shadow-soft ring-1 ring-border/60">
            <div
              className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-card shadow-xs"
              aria-hidden
            >
              <Sparkles className="size-7 text-warm-foreground" />
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
