import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useSaveSpeechCheck, useSpeechChecks } from "@/lib/queries";
import { getSpeechRecognitionCtor, type SpeechRecognitionLike } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/speech-check")({ component: SpeechCheckPage });

type AnalysisResult = {
  durationMs: number;
  avgLoudness: number;
  voiceActivityRatio: number;
  transcript: string;
  wordCount: number;
  avgConfidence: number;
};

type RecordingState = "idle" | "recording" | "analyzing" | "result";

function SpeechCheckPage() {
  const nav = useNavigate();
  const { child } = useActiveChild();
  const checks = useSpeechChecks(child?.id);
  const save = useSaveSpeechCheck(child?.id);

  const [state, setState] = useState<RecordingState>("idle");
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");

  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  const start = async () => {
    setErrorMsg(null);
    setResult(null);
    setElapsedMs(0);
    setLiveTranscript("");

    const SRctor = getSpeechRecognitionCtor();
    if (!SRctor) {
      setErrorMsg(
        "Bu qurilmada nutqni tanish qo'llab-quvvatlanmaydi. Chrome yoki Edge brauzerida sinab ko'ring.",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg("Mikrofon brauzer tomonidan qo'llab-quvvatlanmaydi.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowed")) {
        setErrorMsg(
          "Mikrofonga ruxsat berilmagan. Telefon Sozlamalari → Hearak → Ruxsatlar → Mikrofon — ruxsat bering.",
        );
      } else if (msg.includes("NotFound")) {
        setErrorMsg("Mikrofon topilmadi.");
      } else {
        setErrorMsg("Mikrofonga ulanib bo'lmadi. Qaytadan urinib ko'ring.");
      }
      return;
    }

    const ACtor =
      (
        window as unknown as {
          AudioContext?: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        }
      ).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ACtor) {
      stream.getTracks().forEach((t) => t.stop());
      setErrorMsg("Audio brauzeringizda qo'llab-quvvatlanmaydi");
      return;
    }

    const ctx = new ACtor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    let total = 0;
    let active = 0;
    let sumRms = 0;
    let max = 0;
    const startTime = performance.now();
    let raf = 0;

    // Audio level vizualizatsiyasi uchun.
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      sumRms += rms;
      max = Math.max(max, rms);
      total++;
      if (rms > 0.05) active++;
      setLevel(Math.min(1, rms * 3));
      setElapsedMs(Math.round(performance.now() - startTime));
      raf = requestAnimationFrame(tick);
    };

    // Web Speech API — uzluksiz transkripsiya.
    const finalChunks: string[] = [];
    const confidences: number[] = [];
    let langFallbackTried = false;
    let recognition: SpeechRecognitionLike | null = null;
    let stopped = false;

    const startRecognition = (lang: string) => {
      const rec = new SRctor();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const alt = res?.[0];
          if (!alt) continue;
          const text = alt.transcript ?? "";
          if (res.isFinal) {
            finalChunks.push(text);
            if (typeof alt.confidence === "number" && alt.confidence > 0) {
              confidences.push(alt.confidence);
            }
          } else {
            interim += text;
          }
        }
        const combined = (finalChunks.join(" ") + " " + interim).trim();
        setLiveTranscript(combined);
      };

      rec.onerror = (e) => {
        if (e.error === "language-not-supported" && !langFallbackTried) {
          langFallbackTried = true;
          try {
            rec.abort();
          } catch {
            /* ignore */
          }
          startRecognition("ru-RU");
          return;
        }
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setErrorMsg("Mikrofonga ruxsat berilmagan");
        } else if (e.error === "audio-capture") {
          setErrorMsg("Mikrofonga ulanib bo'lmadi");
        }
        // 'no-speech' va 'aborted' — odatiy holatlar, e'tibor bermaymiz.
      };

      rec.onend = () => {
        // Continuous rejim'da brauzer ba'zan o'zi to'xtatadi — biz to'xtatmagan
        // bo'lsak, qayta yoqamiz.
        if (!stopped) {
          try {
            rec.start();
          } catch {
            /* ignore */
          }
        }
      };

      try {
        rec.start();
      } catch {
        /* ignore */
      }
      recognition = rec;
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
      try {
        recognition?.stop();
      } catch {
        /* ignore */
      }
      const durationMs = Math.round(performance.now() - startTime);
      const avgLoudness = total > 0 ? sumRms / total : 0;
      const voiceActivityRatio = total > 0 ? active / total : 0;
      // SR onresult ba'zan stop()'dan keyin ham final natijani uzatadi —
      // qisqa kutib turamiz.
      setTimeout(() => {
        const transcript = finalChunks.join(" ").trim() || liveTranscript.trim();
        const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
        const avgConfidence =
          confidences.length > 0
            ? confidences.reduce((a, b) => a + b, 0) / confidences.length
            : 0;
        const analysis: AnalysisResult = {
          durationMs,
          avgLoudness: Math.min(1, avgLoudness * 2),
          voiceActivityRatio,
          transcript,
          wordCount,
          avgConfidence,
        };
        setResult(analysis);
        setState("analyzing");
        save
          .mutateAsync({
            durationMs: analysis.durationMs,
            avgLoudness: analysis.avgLoudness,
            voiceActivityRatio: analysis.voiceActivityRatio,
            note: transcript || undefined,
          })
          .then(() => setState("result"))
          .catch(() => {
            toast.error("Saqlash muvaffaqiyatsiz");
            setState("result");
          });
      }, 400);
    };

    setState("recording");
    stopRef.current = stop;
    raf = requestAnimationFrame(tick);
    startRecognition("uz-UZ");
  };

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
  };

  const grade = (analysis: AnalysisResult) => {
    const { wordCount, avgConfidence, voiceActivityRatio, durationMs } = analysis;
    if (durationMs < 1500) return { tone: "watch" as const, label: "Yozuv juda qisqa" };
    if (wordCount === 0) {
      return { tone: "watch" as const, label: "Nutq aniqlanmadi — yana sinab ko'ring" };
    }
    if (wordCount >= 3 && (avgConfidence >= 0.7 || voiceActivityRatio > 0.3)) {
      return { tone: "great" as const, label: "Nutq aniq va ravon" };
    }
    if (wordCount >= 1) return { tone: "ok" as const, label: "Nutq aniqlandi" };
    return { tone: "watch" as const, label: "Tovush past — yana sinab ko'ring" };
  };

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
          AI Speech Check
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
          Nutqni tinglash
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Bola gapirgan so'zlarni matnga aylantiramiz. Diagnostika o'rnini bosmaydi.
        </p>
      </header>

      <div className="px-5">
        <div className="relative overflow-hidden rounded-[28px] bg-card p-6 shadow-card text-center">
          {/* Mic visualizer */}
          <div className="relative mx-auto mb-5 size-40">
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-full transition-transform duration-200",
                state === "recording" ? "bg-destructive/15" : "bg-primary-soft",
              )}
              style={{ transform: `scale(${1 + level * 0.35})` }}
            />
            <span
              aria-hidden
              className={cn(
                "absolute inset-3 rounded-full transition-transform duration-200",
                state === "recording" ? "bg-destructive/25" : "bg-primary/15",
              )}
              style={{ transform: `scale(${1 + level * 0.25})` }}
            />
            <span
              aria-hidden
              className={cn(
                "absolute inset-7 rounded-full transition-colors",
                state === "recording"
                  ? "bg-destructive/15"
                  : "bg-card shadow-xs ring-1 ring-border/60",
              )}
            />
            <div className="absolute inset-0 grid place-items-center">
              <Mic
                className={cn(
                  "size-14 transition-colors",
                  state === "recording" ? "text-destructive" : "text-primary",
                )}
                strokeWidth={1.5}
              />
            </div>
            {state === "recording" && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground shadow-xs ring-1 ring-border/60">
                  {(elapsedMs / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-2xl bg-destructive-soft p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          {state === "idle" && (
            <>
              <p className="text-sm text-muted-foreground mb-5">
                Mikrofonni ishga tushiring va bolaga so'z aytishni iltimos qiling.
              </p>
              <Button
                onClick={start}
                size="lg"
                className="press h-14 rounded-2xl w-full shadow-glow"
              >
                <Mic className="size-5" /> Yozishni boshlash
              </Button>
            </>
          )}

          {state === "recording" && (
            <>
              {/* Live transcript */}
              <div className="mb-5 min-h-[64px] rounded-2xl bg-muted/40 px-4 py-3 text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="size-3" /> Jonli matn
                </div>
                <p className="mt-1 text-sm leading-snug text-foreground">
                  {liveTranscript || (
                    <span className="text-muted-foreground italic">Tinglanmoqda…</span>
                  )}
                </p>
              </div>
              <Button
                onClick={stop}
                size="lg"
                variant="destructive"
                className="press h-14 rounded-2xl w-full"
              >
                <Square className="size-5" fill="currentColor" strokeWidth={0} /> To'xtatish
              </Button>
            </>
          )}

          {state === "analyzing" && (
            <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Tahlil qilinmoqda…</span>
            </div>
          )}

          {state === "result" && result && (
            <ResultPanel
              result={result}
              onRetry={() => {
                setResult(null);
                setLevel(0);
                setElapsedMs(0);
                setLiveTranscript("");
                setState("idle");
              }}
              grade={grade(result)}
            />
          )}
        </div>

        {/* History */}
        <div className="mt-7">
          <div className="mb-3 px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tarix
            </p>
            <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight">
              So'nggi yozuvlar
            </h2>
          </div>
          {checks.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (checks.data?.checks ?? []).length === 0 ? (
            <div className="rounded-2xl bg-card p-5 shadow-card text-center text-sm text-muted-foreground">
              <Mic className="mx-auto mb-1 size-5 opacity-60" />
              Hozircha yozuvlar yo'q
            </div>
          ) : (
            <div className="space-y-2">
              {(checks.data?.checks ?? []).map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-2xl bg-card p-3 shadow-card"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-warm-soft text-warm-foreground shrink-0">
                    <Mic className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold tracking-tight">
                      {new Date(c.createdAt).toLocaleString("uz-UZ", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {c.note && (
                      <p className="mt-0.5 text-xs leading-snug text-foreground/80 line-clamp-2">
                        "{c.note}"
                      </p>
                    )}
                    <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      {(c.durationMs / 1000).toFixed(1)}s · faollik{" "}
                      {Math.round(c.voiceActivityRatio * 100)}%
                    </div>
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

function ResultPanel({
  result,
  onRetry,
  grade,
}: {
  result: AnalysisResult;
  onRetry: () => void;
  grade: { tone: "great" | "ok" | "watch"; label: string };
}) {
  const tone =
    grade.tone === "great"
      ? { kicker: "Yaxshi natija", text: "text-success", bg: "bg-success-soft" }
      : grade.tone === "ok"
        ? { kicker: "Aniqlandi", text: "text-primary", bg: "bg-primary-soft" }
        : { kicker: "Diqqat", text: "text-warm-foreground", bg: "bg-warm-soft" };

  return (
    <div>
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", tone.text)}>
        {tone.kicker}
      </p>
      <h3 className="mt-1 font-display text-[20px] font-semibold leading-snug tracking-tight">
        {grade.label}
      </h3>

      {/* Transcript */}
      {result.transcript ? (
        <div className={cn("mt-4 rounded-2xl p-4 text-left", tone.bg)}>
          <div
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider",
              tone.text,
            )}
          >
            <Sparkles className="size-3" /> Matnga aylantirildi
          </div>
          <p className="mt-1.5 text-sm leading-snug text-foreground">"{result.transcript}"</p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-muted/50 p-4 text-left text-sm text-muted-foreground">
          Matn aniqlanmadi. Mikrofonga yaqinroq, sekin va aniq gapiring.
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Davomiyligi" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
        <Metric label="So'zlar" value={`${result.wordCount}`} />
        <Metric
          label="Aniqlik"
          value={
            result.avgConfidence > 0 ? `${Math.round(result.avgConfidence * 100)}%` : "—"
          }
        />
      </div>
      <Button onClick={onRetry} variant="outline" className="press h-12 rounded-2xl w-full mt-4">
        <Mic className="size-4" /> Yana yozish
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}
