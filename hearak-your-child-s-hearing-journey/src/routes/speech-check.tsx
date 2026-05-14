import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useSaveSpeechCheck, useSpeechChecks } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/speech-check")({ component: SpeechCheckPage });

type AnalysisResult = {
  durationMs: number;
  avgLoudness: number;
  voiceActivityRatio: number;
};

function SpeechCheckPage() {
  const nav = useNavigate();
  const { child } = useActiveChild();
  const checks = useSpeechChecks(child?.id);
  const save = useSaveSpeechCheck(child?.id);

  const [state, setState] = useState<"idle" | "recording" | "analyzing" | "result">("idle");
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  const start = async () => {
    setErrorMsg(null);
    setResult(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg("Mikrofonga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.");
      return;
    }
    const ACtor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
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

    setState("recording");
    let total = 0;
    let active = 0;
    let sumRms = 0;
    let max = 0;
    const start = performance.now();
    let raf = 0;

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
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
      const durationMs = Math.round(performance.now() - start);
      const avgLoudness = total > 0 ? sumRms / total : 0;
      const voiceActivityRatio = total > 0 ? active / total : 0;
      const analysis = {
        durationMs,
        avgLoudness: Math.min(1, avgLoudness * 2),
        voiceActivityRatio,
      };
      setResult(analysis);
      setState("analyzing");
      save
        .mutateAsync(analysis)
        .then(() => {
          setState("result");
        })
        .catch(() => {
          toast.error("Saqlash muvaffaqiyatsiz");
          setState("result");
        });
    };

    stopRef.current = stop;
    raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
  };

  const grade = (analysis: AnalysisResult) => {
    const { avgLoudness, voiceActivityRatio, durationMs } = analysis;
    if (durationMs < 1500) return { tone: "watch", label: "Yozuv juda qisqa" };
    if (voiceActivityRatio > 0.3 && avgLoudness > 0.15)
      return { tone: "great", label: "Nutq faolligi yaxshi ko'rinmoqda" };
    if (voiceActivityRatio > 0.1) return { tone: "ok", label: "Nutq aniqlandi" };
    return { tone: "watch", label: "Tovush juda past — yana sinab ko'ring" };
  };

  return (
    <MobileShell>
      <div className="px-5 pt-10 pb-4 flex items-center gap-2">
        <button type="button" onClick={() => nav({ to: "/dashboard" })} aria-label="Orqaga">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Nutqni tinglash</h1>
          <p className="text-sm text-muted-foreground">Bola ovozini yozib, faollikni baholang</p>
        </div>
      </div>

      <div className="px-5">
        <div className="bg-card rounded-3xl p-6 shadow-card text-center">
          <div className="relative size-36 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-primary-soft" />
            <div
              className="absolute inset-0 rounded-full bg-primary/30 transition-transform"
              style={{ transform: `scale(${1 + level * 0.5})` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Mic
                className={cn(
                  "size-14 transition-colors",
                  state === "recording" ? "text-destructive" : "text-primary",
                )}
                strokeWidth={1.5}
              />
            </div>
          </div>

          {errorMsg && <p className="text-sm text-destructive mb-3">{errorMsg}</p>}

          {state === "idle" && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Mikrofonni ishga tushiring va bolaga so'z aytishni iltimos qiling. Diagnostika o'rnini bosmaydi —
                bu faqat nutq faolligini kuzatish uchun.
              </p>
              <Button onClick={start} size="lg" className="h-14 rounded-2xl w-full">
                <Mic className="size-5" /> Yozishni boshlash
              </Button>
            </>
          )}

          {state === "recording" && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Yozilmoqda... Tugmani bossangiz to'xtaydi
              </p>
              <Button onClick={stop} size="lg" variant="destructive" className="h-14 rounded-2xl w-full">
                <Square className="size-5" /> To'xtatish
              </Button>
            </>
          )}

          {state === "analyzing" && (
            <div className="py-4 flex items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Tahlil qilinmoqda...</span>
            </div>
          )}

          {state === "result" && result && (
            <ResultPanel
              result={result}
              onRetry={() => {
                setResult(null);
                setLevel(0);
                setState("idle");
              }}
              grade={grade(result)}
            />
          )}
        </div>

        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold mb-3">Tarix</h2>
          {checks.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (checks.data?.checks ?? []).length === 0 ? (
            <div className="bg-card rounded-2xl p-5 shadow-card text-center text-sm text-muted-foreground">
              Hozircha yozuvlar yo'q
            </div>
          ) : (
            <div className="space-y-2">
              {(checks.data?.checks ?? []).map((c) => (
                <div key={c.id} className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary-soft flex items-center justify-center">
                    <Mic className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {new Date(c.createdAt).toLocaleString("uz-UZ", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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

function ResultPanel({
  result,
  onRetry,
  grade,
}: {
  result: AnalysisResult;
  onRetry: () => void;
  grade: { tone: string; label: string };
}) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-1">{grade.label}</h3>
      <p className="text-xs text-muted-foreground mb-4">Diagnostika o'rnini bosmaydi</p>
      <div className="grid grid-cols-3 gap-2 text-xs mb-4">
        <Metric label="Davom etish" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
        <Metric label="Ovoz balandligi" value={`${Math.round(result.avgLoudness * 100)}%`} />
        <Metric label="Faollik" value={`${Math.round(result.voiceActivityRatio * 100)}%`} />
      </div>
      <Button onClick={onRetry} variant="outline" className="h-12 rounded-2xl w-full">
        <Mic className="size-4" /> Yana yozish
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  );
}
