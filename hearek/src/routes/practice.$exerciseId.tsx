import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  RotateCw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveChild, useDailyExercises, useGameAssets, useToggleExercise } from "@/lib/queries";
import { playSfx, playSoundFile, playTone, speak, stopAllSounds, unlockAudio } from "@/lib/audio";
import { toast } from "sonner";
import {
  exerciseGameKey,
  getPracticeScript,
  exerciseShortLabel,
  exerciseToneClasses,
  exerciseVisual,
  practiceItemKey,
  type ExerciseType,
  type PracticeGroup,
  type PracticeItem,
  type PracticeScript,
  type SoundSpec,
} from "@/lib/exercise-meta";

export const Route = createFileRoute("/practice/$exerciseId")({ component: Practice });

const ROUND_COUNT = 5;

type Round = { target: PracticeItem; options: PracticeItem[] };

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy[i]);
    copy.splice(i, 1);
  }
  return out;
}

function buildRounds(script: PracticeScript): Round[] {
  const items = script.items;
  if (items.length === 0) return [];
  // Faqat 1 item bo'lsa — bittagina round
  if (items.length === 1) return [{ target: items[0], options: [items[0]] }];

  const rounds: Round[] = [];
  let lastTargetText: string | null = null;
  const optionCount = Math.min(4, items.length);
  // Round soni: 5, lekin items kam bo'lsa items.length * 2 dan ko'p emas
  const totalRounds = Math.min(ROUND_COUNT, Math.max(items.length, 3));
  for (let i = 0; i < totalRounds; i++) {
    const pool = items.filter((it) => it.text !== lastTargetText);
    const target = pool[Math.floor(Math.random() * pool.length)];
    lastTargetText = target.text;
    const distractors = pickRandom(
      items.filter((it) => it.text !== target.text),
      optionCount - 1,
    );
    // Aralashtirish
    const options = pickRandom([target, ...distractors], optionCount);
    rounds.push({ target, options });
  }
  return rounds;
}

async function playPracticeSound(item: PracticeItem, defaultRate: number): Promise<void> {
  await unlockAudio();
  stopAllSounds();
  const sound: SoundSpec = item.sound ?? { kind: "tts", rate: defaultRate };
  switch (sound.kind) {
    case "tts": {
      const text = item.spoken ?? item.text;
      await speak(text, { rate: sound.rate ?? defaultRate, pitch: sound.pitch });
      return;
    }
    case "sfx": {
      const repeat = Math.max(1, sound.repeat ?? 1);
      const gap = Math.max(0, sound.gap ?? 0);
      for (let i = 0; i < repeat; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, gap));
        void playSfx(sound.name, { volume: sound.volume });
      }
      return;
    }
    case "file": {
      // Fayl topilmasa — TTS bilan fallback
      await playSoundFile(sound.src, () =>
        speak(item.spoken ?? item.text, { rate: defaultRate }),
      );
      return;
    }
    case "tone": {
      await playTone(sound.freq, sound.durationMs ?? 700, {
        type: sound.type,
        volume: sound.volume,
      });
      return;
    }
  }
}

function Practice() {
  const { exerciseId } = Route.useParams();
  const nav = useNavigate();
  const { child } = useActiveChild();
  const daily = useDailyExercises(child?.id);
  const toggle = useToggleExercise(child?.id);

  const found = (daily.data?.exercises ?? []).find((e) => e.id === exerciseId);
  // Admin yuklagan rasm/ovozlar — `exercise__<id>` kalit ostida saqlanadi.
  const assetsQ = useGameAssets(exerciseId ? exerciseGameKey(exerciseId) : undefined);
  const assetsByKey = assetsQ.data?.items ?? {};

  const baseScript = useMemo(
    () =>
      found
        ? getPracticeScript(found.id, found.title, found.type as ExerciseType)
        : null,
    [found],
  );

  // Admin yuklagan rasm/ovozlar bilan birlashtirilgan script — har item uchun
  // itemKey bo'yicha override izlanadi. Topilsa, emoji o'rniga rasm va
  // TTS/SFX o'rniga yuklangan ovoz fayli ishlatiladi.
  const script: PracticeScript | null = useMemo(() => {
    if (!baseScript) return null;
    const mergeItem = (it: PracticeItem): PracticeItem => {
      const key = practiceItemKey(it.text);
      const override = assetsByKey[key];
      if (!override) return it;
      return {
        ...it,
        ...(override.image ? { image: override.image } : {}),
        ...(override.sound
          ? { sound: { kind: "file" as const, src: override.sound } }
          : {}),
      };
    };
    return {
      ...baseScript,
      items: baseScript.items.map(mergeItem),
      groups: baseScript.groups?.map((g) => ({
        ...g,
        items: g.items.map(mergeItem),
      })),
    };
  }, [baseScript, assetsByKey]);

  // Guruh tanlash — agar script.groups bor bo'lsa.
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const activeGroup: PracticeGroup | null = useMemo(() => {
    if (!script?.groups) return null;
    return script.groups.find((g) => g.key === groupKey) ?? null;
  }, [script, groupKey]);

  // Quiz uchun script — agar guruh tanlangan bo'lsa, faqat shu guruh item'lari.
  const quizScript: PracticeScript | null = useMemo(() => {
    if (!script) return null;
    if (script.groups && activeGroup) {
      return {
        ...script,
        title: activeGroup.title,
        items: activeGroup.items,
        groups: undefined,
        intro: "Tovushni eshiting va mos rasmni tanlang.",
      };
    }
    return script;
  }, [script, activeGroup]);

  const rounds = useMemo(() => (quizScript ? buildRounds(quizScript) : []), [quizScript]);

  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  useEffect(() => {
    void unlockAudio();
    return () => stopAllSounds();
  }, []);

  // Round o'zgarganda target tovushini avto-chalish (faqat quiz boshlangan bo'lsa)
  useEffect(() => {
    if (done || !quizScript || !rounds[round]) return;
    // Guruhlar bor, lekin hali tanlanmagan bo'lsa — chalmaymiz
    if (script?.groups && !activeGroup) return;
    void playPracticeSound(rounds[round].target, quizScript.rate ?? 0.85);
  }, [round, done, quizScript, rounds, script, activeGroup]);

  // Tugaganda avto-bajarildi
  useEffect(() => {
    if (!done || savedOnce || !found || found.completed) return;
    setSavedOnce(true);
    toggle
      .mutateAsync({ exerciseId, completed: true })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, savedOnce, found]);

  if (daily.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!found || !script) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-5 pt-12 pb-8 max-w-md mx-auto">
        <p className="text-sm text-muted-foreground">Mashq topilmadi.</p>
        <Button onClick={() => nav({ to: "/exercises" })} className="press mt-4 h-12 rounded-2xl">
          <ArrowLeft className="size-4" /> Mashqlarga qaytish
        </Button>
      </div>
    );
  }

  const { Icon, tone } = exerciseVisual(found.id, found.type as ExerciseType);
  const ts = exerciseToneClasses[tone];

  // ── Guruh tanlash ekran ──
  // Script'da guruhlar bor va hali tanlanmagan bo'lsa, foydalanuvchi avval
  // qaysi guruhni o'rganmoqchiligini tanlaydi (masalan: uy yoki yovvoyi hayvonlari).
  if (script.groups && !activeGroup) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => nav({ to: "/exercises" })}
            aria-label="Chiqish"
            className="press grid size-9 place-items-center rounded-full bg-card shadow-xs"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Guruh tanlang
          </span>
          <div className="size-9" />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span
            className={cn("grid size-10 place-items-center rounded-2xl", ts.iconBg, ts.iconText)}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {exerciseShortLabel(found.id, found.title)}
            </p>
            <h1 className="font-display text-[20px] font-semibold leading-tight tracking-tight truncate">
              {script.title}
            </h1>
          </div>
        </div>
        {script.intro && (
          <p className="text-[13px] leading-relaxed text-muted-foreground mb-5">
            {script.intro}
          </p>
        )}

        <div className="grid gap-3">
          {script.groups.map((g) => {
            const previewEmojis = g.items
              .map((it) => it.emoji)
              .filter((e): e is string => !!e)
              .slice(0, 5);
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setGroupKey(g.key)}
                className="press rounded-[24px] bg-card p-5 text-left shadow-card ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-center gap-3 mb-3">
                  {g.emoji && (
                    <span className="text-3xl leading-none" aria-hidden>
                      {g.emoji}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-[17px] font-semibold leading-tight tracking-tight">
                      {g.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {g.items.length} ta · 5 ta savol
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 text-3xl">
                  {previewEmojis.map((e, i) => (
                    <span key={i} aria-hidden>
                      {e}
                    </span>
                  ))}
                  {g.items.length > previewEmojis.length && (
                    <span className="text-base self-center text-muted-foreground">
                      +{g.items.length - previewEmojis.length}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Bu yerdan keyin — quiz mode (rounds bo'sh emasligi kerak)
  if (rounds.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col px-5 pt-12 pb-8 max-w-md mx-auto">
        <p className="text-sm text-muted-foreground">Mashq item'lari yo'q.</p>
        <Button onClick={() => nav({ to: "/exercises" })} className="press mt-4 h-12 rounded-2xl">
          <ArrowLeft className="size-4" /> Mashqlarga qaytish
        </Button>
      </div>
    );
  }

  const total = rounds.length;
  const current = rounds[round];
  const pct = Math.round((((done ? total : round) ) / total) * 100);

  const replay = () => {
    if (!current) return;
    void playPracticeSound(current.target, quizScript?.rate ?? 0.85);
  };

  const handlePick = (opt: PracticeItem) => {
    if (picked) return;
    stopAllSounds();
    setPicked(opt.text);
    const isCorrect = opt.text === current.target.text;
    if (isCorrect) setScore((s) => s + 1);
    // Qisqa nafas — natijani ko'rish uchun, keyin keyingisi
    setTimeout(() => {
      if (round + 1 >= total) {
        setDone(true);
      } else {
        setRound((r) => r + 1);
        setPicked(null);
      }
    }, isCorrect ? 700 : 1100);
  };

  const restart = () => {
    setRound(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setSavedOnce(false);
  };

  // ── Yakuniy ekran ──
  if (done) {
    const pctScore = Math.round((score / total) * 100);
    const tier = pctScore >= 80 ? "great" : pctScore >= 50 ? "ok" : "watch";
    const eyebrow = tier === "great" ? "Ajoyib natija" : tier === "ok" ? "Yaxshi" : "Yana mashq qilamiz";
    const title = tier === "great" ? "Zo'r ish!" : tier === "ok" ? "Aniq yo'lda" : "Davom etamiz";
    const toneCls =
      tier === "great"
        ? { bg: "bg-success-soft", ring: "ring-success/30", text: "text-success" }
        : tier === "ok"
          ? { bg: "bg-primary-soft", ring: "ring-primary/30", text: "text-primary" }
          : { bg: "bg-warm-soft", ring: "ring-warm/40", text: "text-warm-foreground" };
    return (
      <div className="min-h-screen bg-gradient-calm flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm rounded-[32px] bg-card p-7 text-center shadow-soft ring-1 ring-border/60">
          <div
            className={cn(
              "mx-auto mb-5 grid size-16 place-items-center rounded-3xl ring-1",
              toneCls.bg,
              toneCls.ring,
            )}
          >
            <Sparkles className={cn("size-7", toneCls.text)} />
          </div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", toneCls.text)}>
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-[26px] font-semibold leading-tight tracking-tight">
            {title}
          </h2>
          <div className="mt-4 flex items-baseline justify-center gap-2">
            <span className="font-display text-[44px] font-semibold tabular-nums">{pctScore}%</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {score}/{total}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{found.title}</p>
          <div className="mt-7 flex flex-col gap-2">
            <Button onClick={() => nav({ to: "/exercises" })} className="press h-12 rounded-2xl">
              <Check className="size-4" /> Mashqlar ro'yxati
            </Button>
            <Button variant="outline" onClick={restart} className="press h-12 rounded-2xl">
              <RotateCw className="size-4" /> Yana o'ynash
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Asosiy quiz ekran ──
  return (
    <div className="min-h-screen bg-background flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => nav({ to: "/exercises" })}
          aria-label="Chiqish"
          className="press grid size-9 place-items-center rounded-full bg-card shadow-xs"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
          {round + 1} / {total}
        </span>
        <div className="size-9" />
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
          style={{ width: `${pct}%`, transitionTimingFunction: "var(--ease-emphasized)" }}
        />
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span
          className={cn("grid size-10 place-items-center rounded-2xl", ts.iconBg, ts.iconText)}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {exerciseShortLabel(found.id, found.title)}
          </p>
          <h1 className="font-display text-[20px] font-semibold leading-tight tracking-tight truncate">
            {quizScript?.title ?? script.title}
          </h1>
        </div>
      </div>
      {quizScript?.intro && (
        <p className="text-[13px] leading-relaxed text-muted-foreground mb-4">
          {quizScript.intro}
        </p>
      )}

      <Button
        variant="outline"
        onClick={replay}
        className="press h-14 rounded-2xl mb-4 text-sm font-semibold"
      >
        <Volume2 className="size-5" /> Qaytadan tinglash
      </Button>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        {current.options.map((opt) => {
          const state: "idle" | "correct" | "wrong" | "dim" = picked
            ? opt.text === current.target.text
              ? "correct"
              : opt.text === picked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <button
              key={opt.text}
              type="button"
              disabled={!!picked}
              onClick={() => handlePick(opt)}
              className={cn(
                "press aspect-square rounded-[24px] flex flex-col items-center justify-center gap-2 p-3 shadow-card transition-all",
                state === "idle" && "bg-card hover:bg-primary-soft",
                state === "correct" && "bg-success-soft ring-2 ring-success",
                state === "wrong" && "bg-destructive-soft ring-2 ring-destructive",
                state === "dim" && "bg-card opacity-40",
              )}
            >
              <ItemVisual item={opt} size={state === "idle" ? "md" : "md"} />
              <div className="text-[13px] font-semibold tracking-tight text-center leading-tight">
                {opt.text}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemVisual({ item, size = "md" }: { item: PracticeItem; size?: "md" | "lg" }) {
  // Eng yuqori prioritet: admin yuklagan rasm
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.text}
        draggable={false}
        className={cn(
          "rounded-2xl object-cover ring-1 ring-border/40 shadow-soft bg-white",
          size === "lg" ? "size-24" : "size-16",
        )}
      />
    );
  }
  if (item.color) {
    return (
      <div
        className={cn(
          "rounded-2xl ring-2 ring-border/40 shadow-soft",
          size === "lg" ? "size-24" : "size-14",
        )}
        style={{ backgroundColor: item.color }}
        aria-hidden
      />
    );
  }
  if (item.emoji) {
    return (
      <div
        className={cn("leading-none select-none", size === "lg" ? "text-[72px]" : "text-[44px]")}
        aria-hidden
      >
        {item.emoji}
      </div>
    );
  }
  return null;
}
