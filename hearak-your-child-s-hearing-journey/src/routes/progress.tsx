import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { CheckCircle2, Circle, Gamepad2, Loader2, Mic, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useActiveChild,
  useGameScores,
  useMilestones,
  useProgress,
  useSpeechChecks,
} from "@/lib/queries";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

const gameLabels: Record<string, { label: string; emoji: string }> = {
  "sound-find": { label: "Ovozni topish", emoji: "🎯" },
  direction: { label: "Qaysi tomondan", emoji: "🎧" },
  "word-pick": { label: "Rasm tanlash", emoji: "🖼️" },
  repeat: { label: "Takrorlash", emoji: "🎤" },
};

const stageGoals: Array<{ name: string; goal: string }> = [
  { name: "Tovushga reaksiya", goal: "Atrofdagi tovushlarni payqash" },
  { name: "Ovoz manbasini topish", goal: "Tovush qaysi tomondan kelishini bilish" },
  { name: "So'zlarni tanish", goal: "Tanish so'zlarni eshitib aniqlash" },
  { name: "So'zlarni takrorlash", goal: "Asosiy so'zlarni nutqida ishlatish" },
  { name: "Qisqa jumlalar", goal: "2-3 so'zli jumlalar tuzish" },
  { name: "Suhbat", goal: "Erkin suhbat va savol-javob" },
];

function ProgressPage() {
  const { child } = useActiveChild();
  const progress = useProgress(child?.id);
  const milestones = useMilestones(child?.id);
  const gameScores = useGameScores(child?.id);
  const speechChecks = useSpeechChecks(child?.id);

  if (!child || progress.isLoading || milestones.isLoading) {
    return (
      <MobileShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  const monthly = progress.data?.monthly ?? [];
  const max = Math.max(1, ...monthly.map((p) => p.value));
  const ms = milestones.data?.milestones ?? [];

  return (
    <MobileShell>
      <div className="px-5 pt-10 pb-4">
        <h1 className="font-display text-2xl font-semibold">Rivojlanish</h1>
        <p className="text-sm text-muted-foreground">
          {progress.data?.days ?? 0} kun davomida bosib o'tilgan yo'l
        </p>
      </div>

      <div className="px-5">
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-semibold">So'z boyligi</h3>
            <span className="text-2xl font-display font-semibold text-primary">
              {progress.data?.wordCount ?? 0}
            </span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {monthly.map((p) => (
              <div key={p.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-primary to-accent transition-all"
                  style={{ height: `${(p.value / max) * 100}%` }}
                  title={`${p.month}: ${p.value}`}
                />
                <span className="text-[10px] text-muted-foreground">{p.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="font-display text-lg font-semibold mb-1">AI Rivojlanish xaritasi</h2>
        <p className="text-xs text-muted-foreground mb-4">Implantatsiya kunidan boshlangan shaxsiy yo'l</p>
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="space-y-3">
            {stageGoals.map((stage, idx) => {
              const stageNum = idx + 1;
              const isCurrent = stageNum === child.stageNumber;
              const isDone = stageNum < child.stageNumber;
              return (
                <div
                  key={stage.name}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-colors",
                    isCurrent && "border-primary bg-primary-soft",
                    isDone && "border-success/30 bg-success/5",
                    !isCurrent && !isDone && "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center font-display font-semibold text-sm shrink-0",
                      isCurrent && "bg-primary text-primary-foreground",
                      isDone && "bg-success text-success-foreground",
                      !isCurrent && !isDone && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="size-5" /> : stageNum}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-semibold", !isCurrent && !isDone && "text-muted-foreground")}>
                      {stage.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{stage.goal}</div>
                  </div>
                  {isCurrent && <Star className="size-4 text-primary shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="font-display text-lg font-semibold mb-4">Bosqichlar</h2>
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
            {ms.map((m) => (
              <div key={m.id} className="flex gap-4 pb-5 last:pb-0 relative">
                <div
                  className={cn(
                    "size-6 rounded-full flex items-center justify-center shrink-0 z-10",
                    m.done ? "bg-success" : m.current ? "bg-primary" : "bg-muted",
                  )}
                >
                  {m.done ? (
                    <CheckCircle2 className="size-4 text-success-foreground" />
                  ) : (
                    <Circle className="size-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 -mt-0.5">
                  <p className={cn("text-sm font-medium", !m.done && !m.current && "text-muted-foreground")}>
                    {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.day}-kun · implantatsiyadan keyin</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="font-display text-lg font-semibold mb-4">O'yin natijalari</h2>
        <div className="bg-card rounded-3xl p-5 shadow-card">
          {gameScores.isLoading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (gameScores.data?.scores ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              <Gamepad2 className="size-4 inline mr-1" /> Hozircha o'ynalmagan
            </p>
          ) : (
            <div className="space-y-2">
              {(gameScores.data?.scores ?? []).slice(0, 5).map((s) => {
                const meta = gameLabels[s.game];
                const pct = Math.round((s.score / s.total) * 100);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
                    <div className="text-2xl">{meta?.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{meta?.label ?? s.game}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-primary">{pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="font-display text-lg font-semibold mb-4">Nutq tarixini ko'rish</h2>
        <div className="bg-card rounded-3xl p-5 shadow-card">
          {speechChecks.isLoading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (speechChecks.data?.checks ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              <Mic className="size-4 inline mr-1" /> Hozircha yozuvlar yo'q
            </p>
          ) : (
            <div className="space-y-2">
              {(speechChecks.data?.checks ?? []).slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/40">
                  <Mic className="size-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {new Date(c.createdAt).toLocaleDateString("uz-UZ", { month: "short", day: "numeric" })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(c.durationMs / 1000).toFixed(1)}s · faollik {Math.round(c.voiceActivityRatio * 100)}%
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-primary">
                    {Math.round(c.avgLoudness * 100)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
