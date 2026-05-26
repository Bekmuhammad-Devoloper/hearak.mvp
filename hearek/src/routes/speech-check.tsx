import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useSaveSpeechCheck, useSpeechChecks } from "@/lib/queries";
import { isSpeechRecognitionSupported, startSpeech, type SpeechSession } from "@/lib/speech";
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

    if (!(await isSpeechRecognitionSupported())) {
      setErrorMsg(
        "Bu qurilmada nutqni tanish qo'llab-quvvatlanmaydi. Chrome yoki Edge brauzerida sinab ko'ring.",
      );
      return;
    }

    // Audio analiz uchun mikrofon stream — brauzerda mavjud. APK'da native
    // plagin o'z mikrofonini boshqaradi, biz parallel analyser ulay olmaymiz,
    // shu sababli volume/voice activity ko'rsatkichlari faqat browser'da to'liq.
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let analyserData: Uint8Array<ArrayBuffer> | null = null;
    const ACtor =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              AudioContext?: typeof AudioContext;
              webkitAudioContext?: typeof AudioContext;
            }
          ).AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia && ACtor) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ctx = new ACtor();
        const source = ctx.createMediaStreamSource(stream);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserData = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      } catch (err) {
        // APK'da getUserMedia mavjud bo'lmasligi yoki konflikt qilishi mumkin —
        // bu holda volume vizualizatsiyasiz davom etamiz, transkripsiya esa
        // native plagin orqali baribir ishlaydi.
        stream?.getTracks().forEach((t) => t.stop());
        stream = null;
        ctx = null;
        analyser = null;
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowed")) {
          // Ruxsat rad etilgan bo'lsa ham, native plagin o'zi qayta so'raydi.
          // Faqat brauzer rejimida bu xato — to'xtatamiz.
          if (!ACtor) {
            setErrorMsg(
              "Mikrofonga ruxsat berilmagan. Telefon Sozlamalari → Nutq yo'li → Ruxsatlar → Mikrofon — ruxsat bering.",
            );
            return;
          }
        }
      }
    }

    let total = 0;
    let active = 0;
    let sumRms = 0;
    const startTime = performance.now();
    let raf = 0;

    // Audio level vizualizatsiyasi — faqat brauzerda yoki APK'da getUserMedia
    // ishlasa. Aks holda level 0 da turaveradi (vizualka faqat dekorativ).
    const tick = () => {
      if (analyser && analyserData) {
        analyser.getByteTimeDomainData(analyserData);
        let sum = 0;
        for (let i = 0; i < analyserData.length; i++) {
          const v = (analyserData[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / analyserData.length);
        sumRms += rms;
        total++;
        if (rms > 0.05) active++;
        setLevel(Math.min(1, rms * 3));
      }
      setElapsedMs(Math.round(performance.now() - startTime));
      raf = requestAnimationFrame(tick);
    };

    let session: SpeechSession | null = null;
    let stopped = false;
    const transcriptRef = { current: "" };

    try {
      session = await startSpeech({
        lang: "uz-UZ",
        onPartial: (text) => {
          transcriptRef.current = text;
          setLiveTranscript(text);
        },
        onError: (code) => {
          if (code === "not-allowed" || code === "service-not-allowed") {
            setErrorMsg("Mikrofonga ruxsat berilmagan");
          } else if (code === "audio-capture") {
            setErrorMsg("Mikrofonga ulanib bo'lmadi");
          }
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Nutqni tanish ishga tushmadi";
      setErrorMsg(msg);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
      return;
    }

    if (!session) {
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
      return;
    }

    const stop = async () => {
      if (stopped) return;
      stopped = true;
      // 1) UI'ga darhol "analyzing" deb ko'rsatamiz — foydalanuvchi tugma
      //    bosilganini his qiladi, native stop() javobini kutmaymiz.
      cancelAnimationFrame(raf);
      setState("analyzing");
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
      // 2) Native sessiyani to'xtatib, yakuniy transkriptni olamiz.
      let transcript = "";
      try {
        transcript = (await session.stop()) || transcriptRef.current.trim();
      } catch {
        transcript = transcriptRef.current.trim();
      }
      const durationMs = Math.round(performance.now() - startTime);
      const avgLoudness = total > 0 ? sumRms / total : 0;
      const voiceActivityRatio = total > 0 ? active / total : 0;
      const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
      const analysis: AnalysisResult = {
        durationMs,
        avgLoudness: Math.min(1, avgLoudness * 2),
        voiceActivityRatio,
        transcript,
        wordCount,
        avgConfidence: 0,
      };
      setResult(analysis);
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
    };

    setState("recording");
    stopRef.current = () => {
      void stop();
    };
    raf = requestAnimationFrame(tick);
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
