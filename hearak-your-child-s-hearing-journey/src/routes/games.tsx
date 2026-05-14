import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Headphones,
  Loader2,
  Mic,
  RotateCw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useSaveGameScore, type GameScoreItem } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/games")({ component: GamesHub });

type GameKey = GameScoreItem["game"];

const gameMeta: Record<GameKey, { title: string; desc: string; emoji: string; color: string }> = {
  "sound-find": {
    title: "Ovozni topish",
    desc: "Eshitilgan tovushga mos rasmni tanlang",
    emoji: "🎯",
    color: "bg-primary-soft",
  },
  direction: {
    title: "Qaysi tomondan",
    desc: "Tovush qaysi quloqdan keldi",
    emoji: "🎧",
    color: "bg-warm/30",
  },
  "word-pick": {
    title: "Rasmni eshitib tanlash",
    desc: "Aytilgan so'zga mos rasmni topish",
    emoji: "🖼️",
    color: "bg-accent/40",
  },
  repeat: {
    title: "Tovushni takrorlash",
    desc: "Ovozingizni yozib yuboring",
    emoji: "🎤",
    color: "bg-success/20",
  },
};

function GamesHub() {
  const [active, setActive] = useState<GameKey | null>(null);
  const { child } = useActiveChild();
  const nav = useNavigate();

  if (active === "sound-find") return <SoundFind onExit={() => setActive(null)} />;
  if (active === "direction") return <DirectionGame onExit={() => setActive(null)} />;
  if (active === "word-pick") return <WordPick onExit={() => setActive(null)} />;
  if (active === "repeat") return <RepeatSound onExit={() => setActive(null)} />;

  return (
    <MobileShell>
      <div className="px-5 pt-10 pb-4 flex items-center gap-2">
        <button type="button" onClick={() => nav({ to: "/dashboard" })} aria-label="Orqaga">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Mini o'yinlar</h1>
          <p className="text-sm text-muted-foreground">
            {child ? `${child.name} uchun qiziqarli mashqlar` : "Eshitish va nutq mashqlari"}
          </p>
        </div>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        {(Object.keys(gameMeta) as GameKey[]).map((key) => {
          const meta = gameMeta[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={cn(
                "rounded-3xl p-4 text-left shadow-card transition-transform hover:scale-[1.02] active:scale-[0.98]",
                meta.color,
              )}
            >
              <div className="text-4xl mb-3">{meta.emoji}</div>
              <div className="font-semibold text-sm leading-tight">{meta.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{meta.desc}</div>
            </button>
          );
        })}
      </div>

      <p className="px-5 mt-6 text-xs text-muted-foreground">
        💡 Mashqlar oxirida natijangiz saqlanadi va Rivojlanish sahifasida ko'rinadi.
      </p>
    </MobileShell>
  );
}

function useAudioContext() {
  const ref = useRef<AudioContext | null>(null);
  const get = () => {
    if (!ref.current) {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) ref.current = new Ctor();
    }
    return ref.current;
  };
  useEffect(() => {
    return () => {
      ref.current?.close().catch(() => {});
      ref.current = null;
    };
  }, []);
  return get;
}

function playBeep(ctx: AudioContext, frequency: number, durationMs: number, options?: { pan?: number; type?: OscillatorType }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options?.type ?? "sine";
  osc.frequency.value = frequency;
  gain.gain.value = 0;
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
  let target: AudioNode = ctx.destination;
  if (typeof options?.pan === "number" && typeof ctx.createStereoPanner === "function") {
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, options.pan));
    pan.connect(ctx.destination);
    target = pan;
  }
  osc.connect(gain).connect(target);
  osc.start();
  osc.stop(now + durationMs / 1000 + 0.05);
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "uz-UZ";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

type GameFrameProps = {
  title: string;
  round: number;
  total: number;
  onExit: () => void;
  children: React.ReactNode;
};

function GameFrame({ title, round, total, onExit, children }: GameFrameProps) {
  const pct = Math.round((round / total) * 100);
  return (
    <div className="min-h-screen bg-background flex flex-col px-5 pt-10 pb-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onExit} aria-label="Chiqish">
          <ArrowLeft className="size-5" />
        </button>
        <span className="text-sm text-muted-foreground">
          {round} / {total}
        </span>
        <div className="size-5" />
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <h1 className="font-display text-xl font-semibold mb-4">{title}</h1>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

type GameResultProps = {
  score: number;
  total: number;
  onExit: () => void;
  onRetry: () => void;
};

function GameResult({ score, total, onExit, onRetry }: GameResultProps) {
  const pct = Math.round((score / total) * 100);
  const cheer = pct >= 80 ? "Ajoyib! 🌟" : pct >= 50 ? "Yaxshi! 👏" : "Yana ko'p mashq qilamiz 💪";
  return (
    <div className="min-h-screen bg-gradient-calm flex items-center justify-center px-5 py-10">
      <div className="bg-card rounded-3xl p-8 shadow-card max-w-sm w-full text-center">
        <div className="text-6xl mb-3">{pct >= 80 ? "🌟" : pct >= 50 ? "🎉" : "🌱"}</div>
        <h2 className="font-display text-2xl font-semibold mb-1">{cheer}</h2>
        <p className="text-muted-foreground text-sm">
          {score} / {total} ({pct}%)
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onRetry} className="h-12 rounded-2xl">
            <RotateCw className="size-4" /> Yana o'ynash
          </Button>
          <Button variant="outline" onClick={onExit} className="h-12 rounded-2xl">
            O'yinlar ro'yxati
          </Button>
        </div>
      </div>
    </div>
  );
}

// 1. Sound find — eshitilgan tovush qaysi hayvonga tegishli
type SoundOption = { emoji: string; label: string; frequency: number };
const soundOptions: SoundOption[] = [
  { emoji: "🐶", label: "It", frequency: 380 },
  { emoji: "🐱", label: "Mushuk", frequency: 700 },
  { emoji: "🐦", label: "Qush", frequency: 1200 },
  { emoji: "🐮", label: "Sigir", frequency: 200 },
  { emoji: "🐸", label: "Qurbaqa", frequency: 540 },
  { emoji: "🦁", label: "Sher", frequency: 150 },
];

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

function SoundFind({ onExit }: { onExit: () => void }) {
  const total = 5;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const getCtx = useAudioContext();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const rounds = useMemo(
    () =>
      Array.from({ length: total }, () => {
        const opts = pickRandom(soundOptions, 4);
        const correct = opts[Math.floor(Math.random() * opts.length)];
        return { opts, correct };
      }),
    [],
  );

  const current = rounds[round];

  const playSound = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.resume().catch(() => {});
    playBeep(ctx, current.correct.frequency, 600, { type: "triangle" });
  };

  useEffect(() => {
    if (!done) playSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const handlePick = (label: string) => {
    if (picked) return;
    setPicked(label);
    const isCorrect = label === current.correct.label;
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= total) {
        setDone(true);
        saveScore.mutate(
          { game: "sound-find", score: isCorrect ? score + 1 : score, total },
          { onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz") },
        );
      } else {
        setRound((r) => r + 1);
        setPicked(null);
      }
    }, 700);
  };

  if (done) {
    return (
      <GameResult
        score={score}
        total={total}
        onExit={onExit}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <GameFrame title="Ovozni topish 🎯" round={round + 1} total={total} onExit={onExit}>
      <p className="text-muted-foreground text-center mb-6">
        Quyidagi tovush qaysi hayvonga tegishli?
      </p>
      <Button variant="outline" onClick={playSound} className="h-14 rounded-2xl mb-8">
        <Volume2 className="size-5" /> Tovushni eshitish
      </Button>
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {current.opts.map((opt) => {
          const isPicked = picked === opt.label;
          const isCorrect = opt.label === current.correct.label;
          const state = picked
            ? isCorrect
              ? "correct"
              : isPicked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => handlePick(opt.label)}
              disabled={!!picked}
              className={cn(
                "aspect-square rounded-3xl shadow-card flex flex-col items-center justify-center transition-all",
                state === "idle" && "bg-card hover:bg-primary-soft",
                state === "correct" && "bg-success/20 ring-2 ring-success",
                state === "wrong" && "bg-destructive/20 ring-2 ring-destructive",
                state === "dim" && "bg-card opacity-50",
              )}
            >
              <div className="text-5xl mb-2">{opt.emoji}</div>
              <div className="text-sm font-medium">{opt.label}</div>
            </button>
          );
        })}
      </div>
    </GameFrame>
  );
}

// 2. Direction — pan to left/right
function DirectionGame({ onExit }: { onExit: () => void }) {
  const total = 5;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const getCtx = useAudioContext();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<"left" | "right" | null>(null);
  const [done, setDone] = useState(false);

  const rounds = useMemo<Array<"left" | "right">>(
    () => Array.from({ length: total }, () => (Math.random() < 0.5 ? "left" : "right")),
    [],
  );
  const correct = rounds[round];

  const play = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.resume().catch(() => {});
    playBeep(ctx, 600, 700, { pan: correct === "left" ? -1 : 1, type: "sine" });
  };

  useEffect(() => {
    if (!done) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const handlePick = (side: "left" | "right") => {
    if (picked) return;
    setPicked(side);
    const isCorrect = side === correct;
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= total) {
        setDone(true);
        saveScore.mutate(
          { game: "direction", score: isCorrect ? score + 1 : score, total },
          { onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz") },
        );
      } else {
        setRound((r) => r + 1);
        setPicked(null);
      }
    }, 700);
  };

  if (done) {
    return <GameResult score={score} total={total} onExit={onExit} onRetry={() => window.location.reload()} />;
  }

  return (
    <GameFrame title="Qaysi tomondan 🎧" round={round + 1} total={total} onExit={onExit}>
      <p className="text-muted-foreground text-center mb-2">
        Eshitiladigan tovush qaysi quloqdan keldi?
      </p>
      <p className="text-xs text-muted-foreground text-center mb-6">
        💡 Yaxshi natija uchun naushnik kiying
      </p>
      <Button variant="outline" onClick={play} className="h-14 rounded-2xl mb-8">
        <Volume2 className="size-5" /> Yana eshitish
      </Button>
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {(["left", "right"] as const).map((side) => {
          const isPicked = picked === side;
          const isCorrect = side === correct;
          const state = picked
            ? isCorrect
              ? "correct"
              : isPicked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <button
              key={side}
              type="button"
              onClick={() => handlePick(side)}
              disabled={!!picked}
              className={cn(
                "aspect-square rounded-3xl shadow-card flex flex-col items-center justify-center transition-all",
                state === "idle" && "bg-card hover:bg-primary-soft",
                state === "correct" && "bg-success/20 ring-2 ring-success",
                state === "wrong" && "bg-destructive/20 ring-2 ring-destructive",
                state === "dim" && "bg-card opacity-50",
              )}
            >
              {side === "left" ? (
                <ArrowLeft className="size-12 text-primary" strokeWidth={1.5} />
              ) : (
                <ArrowRight className="size-12 text-primary" strokeWidth={1.5} />
              )}
              <div className="text-sm font-medium mt-2">{side === "left" ? "Chap" : "O'ng"}</div>
            </button>
          );
        })}
      </div>
    </GameFrame>
  );
}

// 3. Word pick — TTS → emoji choice
const wordOptions: Array<{ word: string; emoji: string }> = [
  { word: "Olma", emoji: "🍎" },
  { word: "Banan", emoji: "🍌" },
  { word: "Quyosh", emoji: "☀️" },
  { word: "Oy", emoji: "🌙" },
  { word: "Mashina", emoji: "🚗" },
  { word: "Uy", emoji: "🏠" },
  { word: "Gul", emoji: "🌸" },
  { word: "Suv", emoji: "💧" },
];

function WordPick({ onExit }: { onExit: () => void }) {
  const total = 5;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const rounds = useMemo(
    () =>
      Array.from({ length: total }, () => {
        const opts = pickRandom(wordOptions, 4);
        const correct = opts[Math.floor(Math.random() * opts.length)];
        return { opts, correct };
      }),
    [],
  );
  const current = rounds[round];

  useEffect(() => {
    if (!done) speak(current.correct.word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const handlePick = (word: string) => {
    if (picked) return;
    setPicked(word);
    const isCorrect = word === current.correct.word;
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= total) {
        setDone(true);
        saveScore.mutate(
          { game: "word-pick", score: isCorrect ? score + 1 : score, total },
          { onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz") },
        );
      } else {
        setRound((r) => r + 1);
        setPicked(null);
      }
    }, 700);
  };

  if (done) {
    return <GameResult score={score} total={total} onExit={onExit} onRetry={() => window.location.reload()} />;
  }

  return (
    <GameFrame title="Rasmni tanlash 🖼️" round={round + 1} total={total} onExit={onExit}>
      <p className="text-muted-foreground text-center mb-6">Aytilgan so'zga mos rasmni tanlang</p>
      <Button variant="outline" onClick={() => speak(current.correct.word)} className="h-14 rounded-2xl mb-8">
        <Volume2 className="size-5" /> So'zni qaytadan tinglash
      </Button>
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {current.opts.map((opt) => {
          const isPicked = picked === opt.word;
          const isCorrect = opt.word === current.correct.word;
          const state = picked
            ? isCorrect
              ? "correct"
              : isPicked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <button
              key={opt.word}
              type="button"
              onClick={() => handlePick(opt.word)}
              disabled={!!picked}
              className={cn(
                "aspect-square rounded-3xl shadow-card flex flex-col items-center justify-center transition-all",
                state === "idle" && "bg-card hover:bg-primary-soft",
                state === "correct" && "bg-success/20 ring-2 ring-success",
                state === "wrong" && "bg-destructive/20 ring-2 ring-destructive",
                state === "dim" && "bg-card opacity-50",
              )}
            >
              <div className="text-6xl">{opt.emoji}</div>
              <div className="text-sm font-medium mt-2">{opt.word}</div>
            </button>
          );
        })}
      </div>
    </GameFrame>
  );
}

// 4. Repeat sound — record & gauge loudness
function RepeatSound({ onExit }: { onExit: () => void }) {
  const total = 3;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const targets = useMemo(
    () => pickRandom(wordOptions, total).map((o) => o.word),
    [],
  );
  const target = targets[round];

  useEffect(() => {
    if (!done) speak(target);
    setFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const record = async () => {
    if (recording || analyzing) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Mikrofonga ruxsat berilmadi");
      return;
    }
    setRecording(true);
    const ACtor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = ACtor ? new ACtor() : null;
    if (!ctx) {
      toast.error("Audio qo'llab-quvvatlanmaydi");
      setRecording(false);
      return;
    }
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    let max = 0;
    let active = 0;
    let samples = 0;
    const start = performance.now();
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      max = Math.max(max, rms);
      if (rms > 0.06) active++;
      samples++;
      if (performance.now() - start < 2500) {
        requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    const finish = () => {
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
      setRecording(false);
      setAnalyzing(true);
      setTimeout(() => {
        const passed = max > 0.08 && active / Math.max(1, samples) > 0.1;
        setFeedback(passed ? "Ajoyib! Ovozingiz aniq eshitildi 🌟" : "Yana bir bor, biroz balandroq sinab ko'ring 💪");
        if (passed) setScore((s) => s + 1);
        setAnalyzing(false);
        setTimeout(() => {
          if (round + 1 >= total) {
            setDone(true);
            saveScore.mutate(
              { game: "repeat", score: passed ? score + 1 : score, total },
              { onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz") },
            );
          } else {
            setRound((r) => r + 1);
          }
        }, 1500);
      }, 300);
    };
    tick();
  };

  if (done) {
    return <GameResult score={score} total={total} onExit={onExit} onRetry={() => window.location.reload()} />;
  }

  return (
    <GameFrame title="Tovushni takrorlash 🎤" round={round + 1} total={total} onExit={onExit}>
      <p className="text-muted-foreground text-center mb-6">
        Quyidagi so'zni eshiting va bola bilan birga takrorlang
      </p>
      <div className="bg-card rounded-3xl p-6 text-center shadow-card mb-6">
        <div className="text-4xl mb-2">{wordOptions.find((w) => w.word === target)?.emoji}</div>
        <div className="font-display text-2xl font-semibold">{target}</div>
        <button
          type="button"
          onClick={() => speak(target)}
          className="mt-3 text-xs text-primary inline-flex items-center gap-1"
        >
          <Volume2 className="size-3" /> Yana eshitish
        </button>
      </div>

      <Button
        onClick={record}
        disabled={recording || analyzing}
        size="lg"
        className={cn(
          "h-16 rounded-2xl mt-auto transition-colors",
          recording && "bg-destructive hover:bg-destructive/90",
        )}
      >
        {recording ? (
          <>
            <Mic className="size-6 animate-pulse" /> Yozilmoqda... (2.5s)
          </>
        ) : analyzing ? (
          <>
            <Loader2 className="size-6 animate-spin" /> Tahlil
          </>
        ) : (
          <>
            <Mic className="size-6" /> Yozishni boshlash
          </>
        )}
      </Button>
      {feedback && (
        <div className="mt-4 text-center text-sm font-medium" aria-live="polite">
          {feedback}
        </div>
      )}
    </GameFrame>
  );
}

// re-export for unused-import shake
export const _icons = { Headphones, Sparkles };
