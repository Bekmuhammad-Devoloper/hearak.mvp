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

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-3 px-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {kicker}
      </p>
      <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

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
      <header className="px-5 pt-12 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Rivojlanish
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
          {progress.data?.days ?? 0} kun yo'l
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Implantatsiyadan keyingi har bir qadam — ahamiyatli.
        </p>
      </header>

      {/* ─── So'z boyligi chart ────────────────────────────────── */}
      <div className="px-5">
        <div className="rounded-[28px] bg-card p-5 shadow-card">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                So'z boyligi
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">Oxirgi 6 oy davomida</p>
            </div>
            <div className="text-right">
              <span className="font-display text-[28px] font-semibold tracking-tight tabular-nums">
                {progress.data?.wordCount ?? 0}
              </span>
              <p className="text-[10px] text-muted-foreground -mt-1">so'z</p>
            </div>
          </div>
          <div className="flex items-end gap-2.5 h-32">
            {monthly.map((p) => {
              const h = (p.value / max) * 100;
              return (
                <div key={p.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-[10px] bg-gradient-to-t from-primary via-primary to-accent transition-[height] duration-700 hover:opacity-90"
                      style={{
                        height: `${Math.max(h, 6)}%`,
                        transitionTimingFunction: "var(--ease-emphasized)",
                      }}
                      title={`${p.month}: ${p.value} so'z`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{p.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── AI Rivojlanish xaritasi ─────────────────────────── */}
      <div className="px-5 mt-7">
        <SectionTitle kicker="Shaxsiy yo'l" title="AI Rivojlanish xaritasi" />
        <div className="rounded-[28px] bg-card p-4 shadow-card">
          <div className="space-y-2">
            {stageGoals.map((stage, idx) => {
              const stageNum = idx + 1;
              const isCurrent = stageNum === child.stageNumber;
              const isDone = stageNum < child.stageNumber;
              return (
                <div
                  key={stage.name}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl p-3 transition-colors",
                    isCurrent && "bg-primary-soft ring-1 ring-primary/20",
                    isDone && "bg-success-soft",
                    !isCurrent && !isDone && "bg-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "grid size-9 place-items-center rounded-full font-display text-sm font-semibold shrink-0",
                      isCurrent && "bg-primary text-primary-foreground shadow-glow",
                      isDone && "bg-success text-success-foreground",
                      !isCurrent && !isDone && "bg-muted text-muted-foreground ring-1 ring-border",
                    )}
                  >
                    {isDone ? <CheckCircle2 className="size-5" /> : stageNum}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm font-semibold tracking-tight",
                        !isCurrent && !isDone && "text-muted-foreground",
                      )}
                    >
                      {stage.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{stage.goal}</div>
                  </div>
                  {isCurrent && (
                    <Star className="size-4 text-primary shrink-0" fill="currentColor" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Milestones ─────────────────────────────────────── */}
      <div className="px-5 mt-7">
        <SectionTitle kicker="Bosqichlar" title="Vaqt jadvali" />
        <div className="rounded-[28px] bg-card p-5 shadow-card">
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
            {ms.map((m) => (
              <div key={m.id} className="flex gap-4 pb-5 last:pb-0 relative">
                <div
                  className={cn(
                    "grid size-6 place-items-center rounded-full shrink-0 z-10 ring-4 ring-card",
                    m.done
                      ? "bg-success text-success-foreground"
                      : m.current
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-muted",
                  )}
                >
                  {m.done ? (
                    <CheckCircle2 className="size-4" />
                  ) : m.current ? (
                    <Circle className="size-2 fill-current" />
                  ) : (
                    <Circle className="size-2 text-muted-foreground/40 fill-current" />
                  )}
                </div>
                <div className="flex-1 -mt-0.5">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-tight",
                      !m.done && !m.current && "text-muted-foreground",
                    )}
                  >
                    {m.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.day}-kun · implantatsiyadan keyin
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Game scores ────────────────────────────────────── */}
      <div className="px-5 mt-7">
        <SectionTitle kicker="O'yinlar" title="So'nggi natijalar" />
        <div className="rounded-[28px] bg-card p-5 shadow-card">
          {gameScores.isLoading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (gameScores.data?.scores ?? []).length === 0 ? (
            <div className="text-center py-3 text-muted-foreground">
              <Gamepad2 className="mx-auto size-5 mb-1 opacity-60" />
              <p className="text-sm">Hozircha o'ynalmagan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(gameScores.data?.scores ?? []).slice(0, 5).map((s) => {
                const meta = gameLabels[s.game];
                const pct = Math.round((s.score / s.total) * 100);
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-2.5">
                    <div className="grid size-10 place-items-center rounded-xl bg-card text-xl shrink-0">
                      {meta?.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{meta?.label ?? s.game}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("uz-UZ", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="font-display text-sm font-semibold tabular-nums text-primary">
                        {pct}%
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        {s.score}/{s.total}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Speech checks ──────────────────────────────────── */}
      <div className="px-5 mt-7">
        <SectionTitle kicker="Nutq" title="Yozuv tarixi" />
        <div className="rounded-[28px] bg-card p-5 shadow-card">
          {speechChecks.isLoading ? (
            <div className="py-4 flex justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (speechChecks.data?.checks ?? []).length === 0 ? (
            <div className="text-center py-3 text-muted-foreground">
              <Mic className="mx-auto size-5 mb-1 opacity-60" />
              <p className="text-sm">Hozircha yozuvlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(speechChecks.data?.checks ?? []).slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-2.5">
                  <div className="grid size-10 place-items-center rounded-xl bg-warm-soft text-warm-foreground shrink-0">
                    <Mic className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">
                      {new Date(c.createdAt).toLocaleDateString("uz-UZ", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {(c.durationMs / 1000).toFixed(1)}s · faollik{" "}
                      {Math.round(c.voiceActivityRatio * 100)}%
                    </div>
                  </div>
                  <div className="font-display text-sm font-semibold tabular-nums text-primary">
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
