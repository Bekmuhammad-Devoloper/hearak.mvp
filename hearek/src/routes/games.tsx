import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Ear,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Mic,
  RotateCw,
  Sparkles,
  Target,
  Volume2,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useSaveGameScore, type GameScoreItem } from "@/lib/queries";
import { playSoundFile, playTone, speak, unlockAudio } from "@/lib/audio";
import {
  getSpeechRecognitionCtor,
  normalizeWord,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/games")({ component: GamesHub });

type GameKey = GameScoreItem["game"];

const gameMeta: Record<
  GameKey,
  {
    title: string;
    desc: string;
    tone: "primary" | "warm" | "accent" | "success";
    Icon: typeof Target;
    Accent: typeof Target;
  }
> = {
  "sound-find": {
    title: "Ovozni topish",
    desc: "Eshitilgan tovushga mos rasm",
    tone: "primary",
    Icon: Ear,
    Accent: AudioLines,
  },
  direction: {
    title: "Qaysi tomondan",
    desc: "Tovush manbasini aniqlash",
    tone: "warm",
    Icon: Headphones,
    Accent: Waves,
  },
  "word-pick": {
    title: "Rasmni tanlash",
    desc: "So'zga mos rasmni topish",
    tone: "accent",
    Icon: ImageIcon,
    Accent: Sparkles,
  },
  repeat: {
    title: "Takrorlash",
    desc: "Ovozingizni yozib yuboring",
    tone: "success",
    Icon: Mic,
    Accent: AudioLines,
  },
};

const toneStyles: Record<
  "primary" | "warm" | "accent" | "success",
  { iconBg: string; iconText: string; halo: string; ring: string; accent: string }
> = {
  primary: {
    iconBg: "bg-gradient-to-br from-primary to-primary/70",
    iconText: "text-primary-foreground",
    halo: "bg-primary/20",
    ring: "ring-primary/15",
    accent: "text-primary/40",
  },
  warm: {
    iconBg: "bg-gradient-to-br from-warm to-warm/70",
    iconText: "text-warm-foreground",
    halo: "bg-warm/30",
    ring: "ring-warm/20",
    accent: "text-warm-foreground/40",
  },
  accent: {
    iconBg: "bg-gradient-to-br from-accent to-accent/70",
    iconText: "text-accent-foreground",
    halo: "bg-accent/25",
    ring: "ring-accent/20",
    accent: "text-accent-foreground/40",
  },
  success: {
    iconBg: "bg-gradient-to-br from-success to-success/70",
    iconText: "text-white",
    halo: "bg-success/20",
    ring: "ring-success/20",
    accent: "text-success/40",
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
      <header className="px-5 pt-12 pb-5">
        <button
          type="button"
          onClick={() => nav({ to: "/dashboard" })}
          aria-label="Orqaga"
          className="press mb-3 inline-flex size-9 items-center justify-center rounded-full bg-card shadow-xs"
        >
          <ArrowLeft className="size-4" />
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Mini o'yinlar
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
          4 ta qiziqarli mashq
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {child ? `${child.name} uchun moslangan` : "Eshitish va nutq mashqlari"}
        </p>
      </header>

      <div className="px-5 grid grid-cols-2 gap-3">
        {(Object.keys(gameMeta) as GameKey[]).map((key) => {
          const meta = gameMeta[key];
          const s = toneStyles[meta.tone];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={cn(
                "press relative h-full overflow-hidden rounded-[26px] bg-card p-4 text-left shadow-card ring-1 transition-all hover:shadow-soft hover:-translate-y-0.5",
                s.ring,
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute -right-10 -top-10 size-32 rounded-full blur-3xl opacity-80",
                  s.halo,
                )}
              />
              <meta.Accent
                aria-hidden
                className={cn("absolute -right-3 -bottom-3 size-24 opacity-[0.08] rotate-[-10deg]", s.accent)}
                strokeWidth={1.5}
              />
              <div className="relative">
                <div
                  className={cn(
                    "grid size-12 place-items-center rounded-2xl shadow-sm",
                    s.iconBg,
                  )}
                >
                  <meta.Icon className={cn("size-6", s.iconText)} strokeWidth={2} />
                </div>
                <div className="mt-5 font-display text-[15px] font-semibold leading-tight tracking-tight">
                  {meta.title}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {meta.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mx-5 mt-6 rounded-2xl bg-muted/50 p-3.5 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Eslatma:</span> mashqlar oxirida natijangiz
        saqlanadi va Rivojlanish sahifasida ko'rinadi.
      </div>
    </MobileShell>
  );
}

// Audio helpers global lib/audio.ts'da. APK WebView'da ham ishlaydi.

// ─── Game frame ─────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onExit}
          aria-label="Chiqish"
          className="press grid size-9 place-items-center rounded-full bg-card shadow-xs"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
          {round} / {total}
        </span>
        <div className="size-9" />
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
          style={{ width: `${pct}%`, transitionTimingFunction: "var(--ease-emphasized)" }}
        />
      </div>
      <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight mb-4">
        {title}
      </h1>
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
  const tier = pct >= 80 ? "great" : pct >= 50 ? "ok" : "watch";
  const eyebrow = tier === "great" ? "Ajoyib natija" : tier === "ok" ? "Yaxshi" : "Davom etamiz";
  const title =
    tier === "great" ? "Zo'r ish!" : tier === "ok" ? "Aniq yo'lda" : "Yana mashq qilamiz";
  const tone =
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
            tone.bg,
            tone.ring,
          )}
        >
          <span className={cn("text-3xl", tone.text)}>
            {tier === "great" ? "★" : tier === "ok" ? "◆" : "◐"}
          </span>
        </div>
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", tone.text)}>
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-[26px] font-semibold leading-tight tracking-tight">
          {title}
        </h2>
        <div className="mt-4 flex items-baseline justify-center gap-2">
          <span className="font-display text-[44px] font-semibold tabular-nums">{pct}%</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {score}/{total}
          </span>
        </div>
        <div className="mt-7 flex flex-col gap-2">
          <Button onClick={onRetry} className="press h-12 rounded-2xl">
            <RotateCw className="size-4" /> Yana o'ynash
          </Button>
          <Button variant="outline" onClick={onExit} className="press h-12 rounded-2xl">
            O'yinlar ro'yxati
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

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

// Reusable option button shared across games.
function OptionTile({
  state,
  onClick,
  disabled,
  children,
}: {
  state: "idle" | "correct" | "wrong" | "dim";
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "press aspect-square rounded-[24px] flex flex-col items-center justify-center shadow-card transition-all",
        state === "idle" && "bg-card hover:bg-primary-soft",
        state === "correct" && "bg-success-soft ring-2 ring-success",
        state === "wrong" && "bg-destructive-soft ring-2 ring-destructive",
        state === "dim" && "bg-card opacity-40",
      )}
    >
      {children}
    </button>
  );
}

// ─── Game 1: Sound Find ─────────────────────────────────────────────────

type SoundOption = {
  id: string;
  emoji: string;
  label: string;
  /** Onomatopoeik so'z — TTS bilan aniq talaffuz qilinadi (real hayvon ovozi taqlidi). */
  onomatopoeia: string;
  /** TTS pitch (1.0 = normal, <1 = past, >1 = baland). */
  pitch: number;
  /** TTS rate (1.0 = normal). */
  rate: number;
  /** Web Audio fallback frekvensiyasi (TTS ham mavjud bo'lmasa). */
  frequency: number;
};

const soundOptions: SoundOption[] = [
  { id: "dog",   emoji: "🐶", label: "It",       onomatopoeia: "vov vov vov",      pitch: 0.6, rate: 0.85, frequency: 380 },
  { id: "cat",   emoji: "🐱", label: "Mushuk",   onomatopoeia: "miyov miyov",      pitch: 1.6, rate: 0.7,  frequency: 700 },
  { id: "bird",  emoji: "🐦", label: "Qush",     onomatopoeia: "chiy chiy chiy",   pitch: 2.0, rate: 1.3,  frequency: 1200 },
  { id: "cow",   emoji: "🐮", label: "Sigir",    onomatopoeia: "mu-u-u",           pitch: 0.3, rate: 0.55, frequency: 200 },
  { id: "frog",  emoji: "🐸", label: "Qurbaqa",  onomatopoeia: "qurr qurr qurr",   pitch: 0.5, rate: 0.7,  frequency: 540 },
  { id: "lion",  emoji: "🦁", label: "Sher",     onomatopoeia: "rrrr arrr",        pitch: 0.2, rate: 0.5,  frequency: 150 },
];

/** Hayvon ovozini chalish: avval `/sounds/animals/{id}.mp3`, bo'lmasa onomatopoeik TTS, oxirgi chora — tone. */
async function playAnimalSound(opt: SoundOption): Promise<void> {
  await playSoundFile(`/sounds/animals/${opt.id}.mp3`, async () => {
    // Fayl bo'lmasa — onomatopoeik so'zni baland/past ohangda aytib beramiz.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      await speak(opt.onomatopoeia, { pitch: opt.pitch, rate: opt.rate });
    } else {
      await playTone(opt.frequency, 600, { type: "triangle" });
    }
  });
}

function SoundFind({ onExit }: { onExit: () => void }) {
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
        const opts = pickRandom(soundOptions, 4);
        const correct = opts[Math.floor(Math.random() * opts.length)];
        return { opts, correct };
      }),
    [],
  );

  const current = rounds[round];

  // Birinchi tap'da audio context'ni unlock qilamiz (APK WebView talab qiladi)
  useEffect(() => {
    void unlockAudio();
  }, []);

  const playSound = () => {
    void playAnimalSound(current.correct);
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
    <GameFrame title="Qaysi hayvon tovushi?" round={round + 1} total={total} onExit={onExit}>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Tovushni tinglang va to'g'ri hayvonni tanlang.
      </p>
      <Button variant="outline" onClick={playSound} className="press h-14 rounded-2xl mb-6">
        <Volume2 className="size-5" /> Tovushni eshitish
      </Button>
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {current.opts.map((opt) => {
          const state = picked
            ? opt.label === current.correct.label
              ? "correct"
              : opt.label === picked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <OptionTile
              key={opt.label}
              state={state}
              onClick={() => handlePick(opt.label)}
              disabled={!!picked}
            >
              <div className="text-5xl mb-2">{opt.emoji}</div>
              <div className="text-sm font-semibold tracking-tight">{opt.label}</div>
            </OptionTile>
          );
        })}
      </div>
    </GameFrame>
  );
}

// ─── Game 2: Direction ──────────────────────────────────────────────────

function DirectionGame({ onExit }: { onExit: () => void }) {
  const total = 5;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<"left" | "right" | null>(null);
  const [done, setDone] = useState(false);

  const rounds = useMemo<Array<"left" | "right">>(
    () => Array.from({ length: total }, () => (Math.random() < 0.5 ? "left" : "right")),
    [],
  );
  const correct = rounds[round];

  useEffect(() => {
    void unlockAudio();
  }, []);

  const play = () => {
    void playTone(600, 700, { pan: correct === "left" ? -1 : 1, type: "sine" });
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
    <GameFrame title="Qaysi tomondan?" round={round + 1} total={total} onExit={onExit}>
      <p className="text-sm text-muted-foreground text-center mb-1.5">
        Eshitilgan tovush qaysi quloqdan keldi?
      </p>
      <div className="mx-auto mb-5 rounded-full bg-warm-soft px-3 py-1 text-[11px] font-semibold text-warm-foreground">
        Naushnik kiyilgan bo'lsa, aniqroq
      </div>
      <Button variant="outline" onClick={play} className="press h-14 rounded-2xl mb-6">
        <Volume2 className="size-5" /> Yana eshitish
      </Button>
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {(["left", "right"] as const).map((side) => {
          const state = picked
            ? side === correct
              ? "correct"
              : side === picked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <OptionTile
              key={side}
              state={state}
              onClick={() => handlePick(side)}
              disabled={!!picked}
            >
              {side === "left" ? (
                <ArrowLeft className="size-12 text-primary" strokeWidth={1.5} />
              ) : (
                <ArrowRight className="size-12 text-primary" strokeWidth={1.5} />
              )}
              <div className="mt-2 text-sm font-semibold tracking-tight">
                {side === "left" ? "Chap" : "O'ng"}
              </div>
            </OptionTile>
          );
        })}
      </div>
    </GameFrame>
  );
}

// ─── Game 3: Word pick ──────────────────────────────────────────────────

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
    <GameFrame title="Rasmni tanlang" round={round + 1} total={total} onExit={onExit}>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Aytilgan so'zga mos rasmni tanlang.
      </p>
      <Button
        variant="outline"
        onClick={() => speak(current.correct.word)}
        className="press h-14 rounded-2xl mb-6"
      >
        <Volume2 className="size-5" /> So'zni qaytadan tinglash
      </Button>
      <div className="grid grid-cols-2 gap-3 mt-auto">
        {current.opts.map((opt) => {
          const state = picked
            ? opt.word === current.correct.word
              ? "correct"
              : opt.word === picked
                ? "wrong"
                : "dim"
            : "idle";
          return (
            <OptionTile
              key={opt.word}
              state={state}
              onClick={() => handlePick(opt.word)}
              disabled={!!picked}
            >
              <div className="text-6xl">{opt.emoji}</div>
              <div className="mt-2 text-sm font-semibold tracking-tight">{opt.word}</div>
            </OptionTile>
          );
        })}
      </div>
    </GameFrame>
  );
}

// ─── Game 4: Repeat sound ───────────────────────────────────────────────

// Qat'iy mos kelish — faqat aynan maqsadli so'z aytilgan bo'lsa true qaytaradi.
// Yondosh transkriptsiyalar yoki yaqin so'zlar qabul qilinmaydi.
function transcriptMatches(transcripts: string[], target: string): boolean {
  const targetNorm = normalizeWord(target);
  if (!targetNorm) return false;
  for (const raw of transcripts) {
    const norm = normalizeWord(raw);
    if (!norm) continue;
    for (const w of norm.split(" ")) {
      if (w === targetNorm) return true;
    }
  }
  return false;
}

function RepeatSound({ onExit }: { onExit: () => void }) {
  const total = 3;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [recording, setRecording] = useState(false);
  const [done, setDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const targets = useMemo(() => pickRandom(wordOptions, total).map((o) => o.word), []);
  const target = targets[round];
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!done) speak(target);
    setFeedback(null);
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const record = async () => {
    if (recording || analyzing) return;

    const SRctor = getSpeechRecognitionCtor();
    if (!SRctor) {
      toast.error(
        "Bu qurilmada nutqni tanish qo'llab-quvvatlanmaydi. Chrome brauzerida sinab ko'ring.",
      );
      return;
    }

    // Mikrofon ruxsatini oldindan so'rab, aniq xato xabarini ko'rsatamiz.
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach((t) => t.stop());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowed")) {
          toast.error(
            "Mikrofonga ruxsat berilmagan. Telefon Sozlamalari → Hearak → Ruxsatlar → Mikrofon",
          );
        } else if (msg.includes("NotFound")) {
          toast.error("Mikrofon topilmadi");
        } else {
          toast.error("Mikrofonga ulanib bo'lmadi. Qaytadan urinib ko'ring.");
        }
        return;
      }
    }

    const startRecognition = (lang: string, allowLangFallback: boolean) => {
      const recognition = new SRctor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;
      recognitionRef.current = recognition;

      const transcripts: string[] = [];
      let finalized = false;
      let langError = false;

      recognition.onresult = (event) => {
        const res = event.results[0];
        if (!res) return;
        for (let i = 0; i < res.length; i++) {
          const t = res[i]?.transcript;
          if (typeof t === "string" && t.trim()) transcripts.push(t);
        }
      };

      recognition.onerror = (e) => {
        if (e.error === "language-not-supported" && allowLangFallback) {
          langError = true;
        } else if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          toast.error("Mikrofonga ruxsat berilmagan");
        } else if (e.error === "audio-capture") {
          toast.error("Mikrofonga ulanib bo'lmadi");
        }
        // 'no-speech' va boshqalar — onend'da ko'rib chiqamiz.
      };

      recognition.onend = () => {
        if (finalized) return;
        finalized = true;
        recognitionRef.current = null;
        if (langError) {
          // Qurilma uz-UZ'ni qo'llab-quvvatlamasa, ru-RU bilan qayta urinamiz.
          startRecognition("ru-RU", false);
          return;
        }
        setRecording(false);
        setAnalyzing(true);
        setTimeout(() => {
          const matched = transcriptMatches(transcripts, target);
          const heard = transcripts[0]?.trim();
          // Debug: ko'rinish uchun konsolga chiqaramiz
          // eslint-disable-next-line no-console
          console.info("[Repeat]", { target, transcripts, matched });
          setFeedback({
            ok: matched,
            text: matched
              ? `Eshitildi: "${heard}" ✓ — to'g'ri!`
              : heard
                ? `Eshitildi: "${heard}" — "${target}" emas. Qaytadan urinib ko'ring`
                : "Ovoz aniqlanmadi. Mikrofonga yaqinroq va aniqroq gapiring",
          });
          if (matched) setScore((s) => s + 1);
          setAnalyzing(false);
          setTimeout(() => {
            if (round + 1 >= total) {
              setDone(true);
              saveScore.mutate(
                { game: "repeat", score: matched ? score + 1 : score, total },
                { onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz") },
              );
            } else {
              setRound((r) => r + 1);
            }
          }, 1800);
        }, 200);
      };

      try {
        recognition.start();
      } catch {
        finalized = true;
        recognitionRef.current = null;
        setRecording(false);
        toast.error("Tinglashni boshlab bo'lmadi");
      }
    };

    setRecording(true);
    startRecognition("uz-UZ", true);
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

  const wordMeta = wordOptions.find((w) => w.word === target);

  return (
    <GameFrame title="Tovushni takrorlash" round={round + 1} total={total} onExit={onExit}>
      <p className="text-sm text-muted-foreground text-center mb-6">
        So'zni eshiting va bola bilan birga takrorlang.
      </p>
      <div className="rounded-[28px] bg-card p-7 text-center shadow-card mb-6 ring-1 ring-border/60">
        <div className="text-6xl mb-3">{wordMeta?.emoji}</div>
        <div className="font-display text-[28px] font-semibold tracking-tight">{target}</div>
        <button
          type="button"
          onClick={() => speak(target)}
          className="press mt-4 inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
        >
          <Volume2 className="size-3.5" /> Yana eshitish
        </button>
      </div>

      <Button
        onClick={record}
        disabled={recording || analyzing}
        size="lg"
        className={cn(
          "press h-16 rounded-2xl mt-auto transition-colors text-base font-semibold",
          recording && "bg-destructive hover:bg-destructive/90 shadow-none",
          !recording && !analyzing && "shadow-glow",
        )}
      >
        {recording ? (
          <>
            <Mic className="size-6 animate-pulse" /> Tinglanmoqda… so'zni ayting
          </>
        ) : analyzing ? (
          <>
            <Loader2 className="size-6 animate-spin" /> Tahlil qilinmoqda
          </>
        ) : (
          <>
            <Mic className="size-6" /> Aytib ko'rish
          </>
        )}
      </Button>
      {feedback && (
        <div
          className={cn(
            "mt-4 rounded-2xl p-3 text-center text-sm font-medium ring-1",
            feedback.ok
              ? "bg-success-soft text-success ring-success/30"
              : "bg-warm-soft text-warm-foreground ring-warm/40",
          )}
          aria-live="polite"
        >
          {feedback.text}
        </div>
      )}
    </GameFrame>
  );
}

// Re-export for tree-shake guard.
export const _icons = { Sparkles };
