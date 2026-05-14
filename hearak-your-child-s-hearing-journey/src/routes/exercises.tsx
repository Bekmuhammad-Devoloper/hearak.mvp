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
  const allDone = list.length > 0 && list.every((e) => e.completed);

  return (
    <MobileShell>
      <div className="px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl font-semibold">Bugungi 5 daqiqa</h1>
        <p className="text-sm text-muted-foreground">3 ta kichik mashq — kuningizning eng muhim qismi</p>
      </div>

      <div className="px-5 space-y-3">
        {list.map((ex) => (
          <div
            key={ex.id}
            className={cn(
              "bg-card rounded-3xl p-5 shadow-card transition-all",
              ex.completed && "bg-success/10",
            )}
          >
            <div className="flex items-start gap-4">
              <div className="size-14 rounded-2xl bg-primary-soft flex items-center justify-center text-3xl shrink-0">
                {ex.emoji}
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">{ex.type}</div>
                <h3 className="font-semibold leading-tight">{ex.title}</h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
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
                    .catch((err) => toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz"));
                }}
                className={cn(
                  "size-10 rounded-full border-2 flex items-center justify-center transition-colors disabled:opacity-50",
                  ex.completed ? "bg-success border-success" : "border-border",
                )}
              >
                {ex.completed && <Check className="size-5 text-success-foreground" />}
              </button>
            </div>
          </div>
        ))}

        {allDone && (
          <div className="bg-gradient-hero rounded-3xl p-6 text-center shadow-soft">
            <div className="text-4xl mb-2">🌟</div>
            <h3 className="font-display text-xl font-semibold">Ajoyib!</h3>
            <p className="text-sm text-muted-foreground">Bugungi sayohat yakunlandi</p>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
