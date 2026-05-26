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
import {
  useActiveChild,
  useGameAssets,
  useSaveGameScore,
  useToggleExercise,
  type GameAssetMap,
  type GameItemMeta,
  type GameScoreItem,
} from "@/lib/queries";
import {
  playSfx,
  playSoundFile,
  playTone,
  SFX_LABELS_UZ,
  speak,
  stopAllSounds,
  unlockAudio,
  type SfxName,
} from "@/lib/audio";
import { API_BASE_URL } from "@/lib/api";
import { normalizeWord, startSpeech, type SpeechSession } from "@/lib/speech";
import { toast } from "sonner";

type GameKey = GameScoreItem["game"];

/**
 * Search params: dashboard yoki Mashqlar sahifasidan o'yinga to'g'ridan-to'g'ri
 * kirishga ruxsat beradi. `exerciseId` ham kelsa, o'yin tugagandan keyin
 * o'sha mashq avtomatik "bajarildi" deb belgilanadi.
 */
type GamesSearch = {
  play?: GameKey;
  exerciseId?: string;
};

const VALID_GAMES: ReadonlyArray<GameKey> = ["sound-find", "direction", "word-pick", "repeat"];

export const Route = createFileRoute("/games")({
  component: GamesHub,
  validateSearch: (raw: Record<string, unknown>): GamesSearch => {
    const play = typeof raw.play === "string" && (VALID_GAMES as readonly string[]).includes(raw.play)
      ? (raw.play as GameKey)
      : undefined;
    const exerciseId =
      typeof raw.exerciseId === "string" && raw.exerciseId.trim()
        ? raw.exerciseId.trim().slice(0, 64)
        : undefined;
    return { play, exerciseId };
  },
});

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
  const search = Route.useSearch();
  const [active, setActive] = useState<GameKey | null>(search.play ?? null);
  const { child } = useActiveChild();
  const nav = useNavigate();
  const toggle = useToggleExercise(child?.id);

  // URL'dan `?play=...` kelsa, darhol o'sha o'yinga kiramiz. Audio context
  // ham unlock qilamiz (Mashqlar sahifasidan tap orqali kelinganligi sabab
  // gesture konteksti hali yangi).
  useEffect(() => {
    if (search.play && active !== search.play) {
      void unlockAudio();
      setActive(search.play);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.play]);

  // O'yin tugaganda chaqiriladi (`saveScore.onSuccess` ichida). Agar foydalanuvchi
  // mashqlar sahifasidan kelgan bo'lsa (exerciseId mavjud) — o'sha mashq
  // avtomatik "bajarildi" deb belgilanadi.
  const handleCompleted = () => {
    if (search.exerciseId) {
      toggle
        .mutateAsync({ exerciseId: search.exerciseId, completed: true })
        .catch(() => {
          /* score saqlandi — bu kechikkan yangilanish, jim yutamiz */
        });
    }
  };

  const exitToHub = () => {
    setActive(null);
    // `play` query param'ni tozalaymiz, aks holda useEffect yana qo'shadi.
    if (search.play || search.exerciseId) {
      nav({ to: "/games", search: {}, replace: true });
    }
  };

  if (active === "sound-find")
    return <SoundFind onExit={exitToHub} onCompleted={handleCompleted} />;
  if (active === "direction")
    return <DirectionGame onExit={exitToHub} onCompleted={handleCompleted} />;
  if (active === "word-pick")
    return <WordPick onExit={exitToHub} onCompleted={handleCompleted} />;
  if (active === "repeat")
    return <RepeatSound onExit={exitToHub} onCompleted={handleCompleted} />;

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
              onClick={() => {
                // Audio context'ni AYNI gesture ichida unlock qilamiz — keyingi
                // useEffect'da bo'lsa, gesture oynasi yopilib qoladi va Android
                // WebView avtomatik chalishni bloklab qo'yadi.
                void unlockAudio();
                setActive(key);
              }}
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

/**
 * Hayvon ID → `backend/audios/` papkasidagi MP3 fayl nomi xaritasi.
 * Foydalanuvchi o'zbekcha va ko'plik shakllarda nomlagan: birds.mp3, qurbaqa.mp3.
 */
const ANIMAL_AUDIO_FILES: Record<string, string> = {
  dog: "dog.mp3",
  cat: "cat.mp3",
  bird: "birds.mp3",
  cow: "cow.mp3",
  frog: "qurbaqa.mp3",
  lion: "lion.mp3",
};

function animalAudioUrl(id: string): string | null {
  const file = ANIMAL_AUDIO_FILES[id];
  if (!file) return null;
  // `/api/audios/...` — backend express static. Vite dev'da `/api` proxy
  // orqali ishlaydi, productionda esa nginx odatda `/api` ni backend'ga
  // uzatadi — har ikkala muhitda ham xuddi shu yo'l ishlaydi.
  return `${API_BASE_URL}/api/audios/${file}`;
}

/**
 * Hayvon ovozini chalish — quyidagi tartibda:
 *  1. Admin yuklagan data URL (DB'dan)
 *  2. `/sounds/animals/{id}.mp3` — APK bilan birga jo'natilgan mahalliy fayl
 *     (offline ham, internetsiz ham ishonchli ishlaydi)
 *  3. `/api/audios/{file}.mp3` — backend'dagi qo'lda joylashtirilgan ovoz
 *  4. `/api/audio/animals/{id}.wav` — sintez generatsiya
 *  5. Onomatopoeik TTS (Web Speech API)
 *  6. Synthesizer toni
 */
async function playAnimalSound(opt: SoundOption, adminSound?: string): Promise<void> {
  const tts = async () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      await speak(opt.onomatopoeia, { pitch: opt.pitch, rate: opt.rate });
    } else {
      await playTone(opt.frequency, 600, { type: "triangle" });
    }
  };
  const trySynthWav = async () => {
    await playSoundFile(`${API_BASE_URL}/api/audio/animals/${opt.id}.wav`, tts);
  };
  const tryApiMp3 = async () => {
    const url = animalAudioUrl(opt.id);
    if (!url) return trySynthWav();
    await playSoundFile(url, trySynthWav);
  };
  const tryLocalMp3 = async () => {
    await playSoundFile(`/sounds/animals/${opt.id}.mp3`, tryApiMp3);
  };
  if (adminSound) {
    await playSoundFile(adminSound, tryLocalMp3);
    return;
  }
  await tryLocalMp3();
}

/**
 * Hayvon rasmi: 1) Admin yuklagan rasm; 2) public/sounds/animals/{id}.{png,webp,jpg};
 * 3) Emoji fallback.
 */
function AnimalThumb({
  opt,
  adminImage,
  className,
}: {
  opt: SoundOption;
  adminImage?: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const [ext, setExt] = useState<"png" | "webp" | "jpg">("png");
  // Admin yuklagan rasm bo'lsa darhol uni ishlatamiz, aks holda public faylni
  // urinamiz.
  const src = adminImage || `/sounds/animals/${opt.id}.${ext}`;
  const isAdminSrc = !!adminImage;

  if (errored) {
    return (
      <div className={cn("text-5xl select-none", className)} aria-hidden>
        {opt.emoji}
      </div>
    );
  }
  return (
    <img
      key={src}
      src={src}
      alt={opt.label}
      draggable={false}
      className={cn("h-20 w-20 object-contain select-none", className)}
      onError={() => {
        if (isAdminSrc) {
          // Admin rasmida xato — public faylga o'tamiz.
          setErrored(false);
          // Hech narsa qilmaymiz, keyingi render'da `src` o'zgarmaydi, lekin
          // foydalanuvchi yangilamasa, fallback emoji kerak bo'ladi. Soddalik
          // uchun darhol emoji'ga o'tamiz.
          setErrored(true);
        } else if (ext === "png") setExt("webp");
        else if (ext === "webp") setExt("jpg");
        else setErrored(true);
      }}
    />
  );
}

function itemMetaToSoundOption(meta: GameItemMeta, fallback?: SoundOption): SoundOption {
  return {
    id: meta.itemKey,
    emoji: meta.emoji,
    label: meta.label,
    onomatopoeia: meta.onomatopoeia ?? fallback?.onomatopoeia ?? meta.label.toLowerCase(),
    pitch: meta.pitch ?? fallback?.pitch ?? 1.0,
    rate: meta.rate ?? fallback?.rate ?? 0.9,
    frequency: meta.frequency ?? fallback?.frequency ?? 440,
  };
}

function SoundFind({ onExit, onCompleted }: { onExit: () => void; onCompleted?: () => void }) {
  const total = 5;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const assetsQ = useGameAssets("sound-find");
  const assets: GameAssetMap = assetsQ.data?.items ?? {};
  // Asset query tugaganligini bilish — yuklanish kutilayotgan paytda
  // o'yinni boshlamaymiz, aks holda admin yuklagan ovoz emas, fallback chalinadi.
  const assetsReady = !assetsQ.isLoading;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Element ro'yxati: bazadan keladi; bo'lmasa hardcoded soundOptions'ga tushadi.
  // Faqat faol elementlar o'yinda ko'rinadi.
  const allOptions = useMemo<SoundOption[]>(() => {
    const list = assetsQ.data?.itemList ?? [];
    const active = list.filter((it) => it.active);
    if (active.length === 0) return soundOptions;
    const fallbackById = new Map(soundOptions.map((o) => [o.id, o]));
    return active.map((it) => itemMetaToSoundOption(it, fallbackById.get(it.itemKey)));
  }, [assetsQ.data?.itemList]);

  const rounds = useMemo(
    () =>
      Array.from({ length: total }, () => {
        // Kamida 2 ta variant — 4 dan kam bo'lsa ko'paytirib chaqiramiz.
        const sampleSize = Math.min(4, Math.max(2, allOptions.length));
        const opts = pickRandom(allOptions, sampleSize);
        const correct = opts[Math.floor(Math.random() * opts.length)];
        return { opts, correct };
      }),
    [allOptions],
  );

  const current = rounds[round];
  const currentAdminSound = assets[current.correct.id]?.sound;

  // Birinchi tap'da audio context'ni unlock qilamiz (APK WebView talab qiladi)
  useEffect(() => {
    void unlockAudio();
  }, []);

  const playSound = () => {
    stopAllSounds();
    void playAnimalSound(current.correct, currentAdminSound);
  };

  // Round o'zgarganda yoki admin yuklagan ovoz (kech kelgan paytda) o'zgarsa,
  // tovushni qaytadan chalamiz. `assetsReady` bo'lmaguncha kutamiz — fallback
  // emas, balki admin tomonidan yuklangan ovoz chalinishi kerak.
  // Avval har doim oldingi tovushni to'xtatamiz — aralashib ketmasligi uchun.
  useEffect(() => {
    if (done || !assetsReady) return;
    stopAllSounds();
    void playAnimalSound(current.correct, currentAdminSound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, assetsReady, currentAdminSound]);

  // Komponent o'chirilganda barcha tovushlarni to'xtatamiz.
  useEffect(() => {
    return () => stopAllSounds();
  }, []);

  const handlePick = (label: string) => {
    if (picked) return;
    stopAllSounds();
    setPicked(label);
    const isCorrect = label === current.correct.label;
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= total) {
        setDone(true);
        saveScore.mutate(
          { game: "sound-find", score: isCorrect ? score + 1 : score, total },
          {
            onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz"),
            onSuccess: () => onCompleted?.(),
          },
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

  // Asset query birinchi marta yuklanayotgan paytda kichik loader. Bu admin
  // yuklagan ovozlar to'liq olib kelinmagunga qadar fallback (TTS) chalinishini
  // oldini oladi.
  if (!assetsReady) {
    return (
      <GameFrame title="Qaysi hayvon tovushi?" round={round + 1} total={total} onExit={onExit}>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Ovozlar yuklanmoqda…</p>
        </div>
      </GameFrame>
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
              <AnimalThumb opt={opt} adminImage={assets[opt.id]?.image} className="mb-2" />
              <div className="text-sm font-semibold tracking-tight">{opt.label}</div>
            </OptionTile>
          );
        })}
      </div>
    </GameFrame>
  );
}

// ─── Game 2: Direction ──────────────────────────────────────────────────

// Direction o'yini uchun 11 ta turli tovush — har round'da ham yangi tovush,
// shu sababli foydalanuvchi takror ovozdan zerikmaydi.
const DIRECTION_SFX: SfxName[] = [
  "drum",
  "rattle",
  "horn",
  "bell",
  "whistle",
  "clap",
  "phone",
  "knock",
  "splash",
  "siren",
  "ding",
];

// Chap va o'ng tomon uchun pitch (chastota) siljishi —
// stereo pan'dan tashqari, naushniksiz ham farq sezilishi uchun:
//   • chap = past chastota (0.85x — sezilarli, lekin tovushni buzmaydi)
//   • o'ng = baland chastota (1.18x — bola "yuqori" qulog'iga ishora qilib oladi)
// Bu speakerli telefonda ham, naushniksiz laptopda ham chap/o'ng farqlanadi.
const SIDE_PITCH: Record<"left" | "right", number> = { left: 0.85, right: 1.18 };

function DirectionGame({ onExit, onCompleted }: { onExit: () => void; onCompleted?: () => void }) {
  const total = 5;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<"left" | "right" | null>(null);
  const [done, setDone] = useState(false);

  // Har round uchun: qaysi quloqdan kelishi va qaysi tovush — oldindan tasodifiy
  // tanlanadi. Bitta tovush ketma-ket takrorlanmasligi uchun oddiy guard.
  const rounds = useMemo<Array<{ side: "left" | "right"; sfx: SfxName }>>(() => {
    const out: Array<{ side: "left" | "right"; sfx: SfxName }> = [];
    let lastSfx: SfxName | null = null;
    for (let i = 0; i < total; i++) {
      const pool = DIRECTION_SFX.filter((s) => s !== lastSfx);
      const sfx = pool[Math.floor(Math.random() * pool.length)];
      lastSfx = sfx;
      out.push({ side: Math.random() < 0.5 ? "left" : "right", sfx });
    }
    return out;
  }, []);
  const current = rounds[round];
  const correct = current.side;

  useEffect(() => {
    void unlockAudio();
    return () => stopAllSounds();
  }, []);

  const play = () => {
    stopAllSounds();
    void playSfx(current.sfx, {
      pan: correct === "left" ? -1 : 1,
      pitch: SIDE_PITCH[correct],
    });
  };

  useEffect(() => {
    if (!done) {
      stopAllSounds();
      void playSfx(current.sfx, {
        pan: current.side === "left" ? -1 : 1,
        pitch: SIDE_PITCH[current.side],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const handlePick = (side: "left" | "right") => {
    if (picked) return;
    stopAllSounds();
    setPicked(side);
    const isCorrect = side === correct;
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= total) {
        setDone(true);
        saveScore.mutate(
          { game: "direction", score: isCorrect ? score + 1 : score, total },
          {
            onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz"),
            onSuccess: () => onCompleted?.(),
          },
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
        Eshitilgan tovush qaysi tomondan keldi?
      </p>
      <div className="mx-auto mb-5 rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold text-accent-foreground">
        Chap = past ovoz · O'ng = baland ovoz
      </div>
      <Button variant="outline" onClick={play} className="press h-14 rounded-2xl mb-3">
        <Volume2 className="size-5" /> Yana eshitish
      </Button>
      {picked && (
        <div
          className="mx-auto mb-4 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary"
          aria-live="polite"
        >
          Tovush: {SFX_LABELS_UZ[current.sfx]}
        </div>
      )}
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

function WordPick({ onExit, onCompleted }: { onExit: () => void; onCompleted?: () => void }) {
  const total = 5;
  const { child } = useActiveChild();
  const saveScore = useSaveGameScore(child?.id);
  const assetsQ = useGameAssets("word-pick");
  const wordAssets: GameAssetMap = assetsQ.data?.items ?? {};
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // word-pick uchun ham element ro'yxatini bazadan olamiz. Bo'sh bo'lsa —
  // hardcoded wordOptions fallback.
  const allWords = useMemo<Array<{ key: string; word: string; emoji: string }>>(() => {
    const list = assetsQ.data?.itemList ?? [];
    const active = list.filter((it) => it.active);
    if (active.length === 0) {
      return wordOptions.map((w) => ({ key: w.word.toLowerCase(), word: w.word, emoji: w.emoji }));
    }
    return active.map((it) => ({ key: it.itemKey, word: it.label, emoji: it.emoji }));
  }, [assetsQ.data?.itemList]);

  const rounds = useMemo(
    () =>
      Array.from({ length: total }, () => {
        const sampleSize = Math.min(4, Math.max(2, allWords.length));
        const opts = pickRandom(allWords, sampleSize);
        const correct = opts[Math.floor(Math.random() * opts.length)];
        return { opts, correct };
      }),
    [allWords],
  );
  const current = rounds[round];

  useEffect(() => {
    if (!done) {
      stopAllSounds();
      void speak(current.correct.word);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Komponent o'chirilganda barcha tovushlarni to'xtatamiz.
  useEffect(() => {
    return () => stopAllSounds();
  }, []);

  const handlePick = (word: string) => {
    if (picked) return;
    stopAllSounds();
    setPicked(word);
    const isCorrect = word === current.correct.word;
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= total) {
        setDone(true);
        saveScore.mutate(
          { game: "word-pick", score: isCorrect ? score + 1 : score, total },
          {
            onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz"),
            onSuccess: () => onCompleted?.(),
          },
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
        onClick={() => {
          stopAllSounds();
          void speak(current.correct.word);
        }}
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
          const adminImg = wordAssets[opt.key]?.image;
          return (
            <OptionTile
              key={opt.key}
              state={state}
              onClick={() => handlePick(opt.word)}
              disabled={!!picked}
            >
              {adminImg ? (
                <img
                  src={adminImg}
                  alt={opt.word}
                  draggable={false}
                  className="h-20 w-20 object-contain select-none"
                />
              ) : (
                <div className="text-6xl">{opt.emoji}</div>
              )}
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

function RepeatSound({ onExit, onCompleted }: { onExit: () => void; onCompleted?: () => void }) {
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
  const sessionRef = useRef<SpeechSession | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFeedback(null);
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      void sessionRef.current?.stop();
      sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Komponent o'chirilganda — TTS va recognition'ni to'xtatamiz.
  useEffect(() => {
    return () => {
      stopAllSounds();
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      void sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, []);

  const finalizeWithTranscript = (transcript: string) => {
    setAnalyzing(true);
    setTimeout(() => {
      const transcripts = transcript ? [transcript] : [];
      const matched = transcriptMatches(transcripts, target);
      const heard = transcript.trim();
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
            {
              onError: () => toast.error("Natijani saqlash muvaffaqiyatsiz"),
              onSuccess: () => onCompleted?.(),
            },
          );
        } else {
          setRound((r) => r + 1);
        }
      }, 1800);
    }, 200);
  };

  const record = async () => {
    if (recording || analyzing) return;

    let lastPartial = "";
    let stopped = false;

    const stopAndFinalize = async () => {
      if (stopped) return;
      stopped = true;
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      const s = sessionRef.current;
      sessionRef.current = null;
      setRecording(false);
      let transcript = lastPartial.trim();
      if (s) {
        try {
          const t = await s.stop();
          if (t) transcript = t.trim();
        } catch {
          /* ignore */
        }
      }
      finalizeWithTranscript(transcript);
    };

    setRecording(true);
    let session: SpeechSession | null = null;
    try {
      session = await startSpeech({
        lang: "uz-UZ",
        onPartial: (text) => {
          lastPartial = text;
        },
        onError: (code) => {
          if (code === "not-allowed" || code === "service-not-allowed") {
            toast.error("Mikrofonga ruxsat berilmagan");
          } else if (code === "audio-capture") {
            toast.error("Mikrofonga ulanib bo'lmadi");
          } else if (code === "service-not-installed") {
            toast.error(
              "Google Speech Services o'rnatilmagan. Play Store'dan \"Google\" ilovasini yangilang.",
            );
          } else if (code === "language-not-supported") {
            toast.error("Bu qurilmada nutq tanish tili topilmadi");
          }
        },
      });
    } catch {
      setRecording(false);
      toast.error("Tinglashni boshlab bo'lmadi");
      return;
    }

    if (!session) {
      setRecording(false);
      return;
    }

    sessionRef.current = session;
    // Auto-stop ~5 sek: bola yo'l-yo'lakay sukut saqlasa ham natijani olamiz.
    autoStopTimerRef.current = setTimeout(() => {
      void stopAndFinalize();
    }, 5000);
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
      <div className="rounded-[28px] bg-card p-7 text-center shadow-card mb-6 ring-1 ring-border/60">
        <div className="text-6xl mb-3">{wordMeta?.emoji}</div>
        <div className="font-display text-[28px] font-semibold tracking-tight">{target}</div>
        <button
          type="button"
          onClick={async () => { await unlockAudio(); stopAllSounds(); void speak(target); }}
          className="press mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          <Volume2 className="size-4" /> Ovozni eshitish
        </button>
        <p className="mt-2.5 text-[11px] text-muted-foreground">
          Yuqoridagi tugmani bosib so'zni eshiting
        </p>
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
