import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useActiveChild,
  useDiagnosticsQuestions,
  useSubmitDiagnostics,
  type DiagnosticsResult,
} from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnostics")({ component: Diagnostics });

const optionMeta: Array<{
  label: string;
  v: number;
  hint: string;
  tone: "destructive" | "warm" | "success";
}> = [
  { label: "Hech qachon", v: 0, hint: "Hozircha ko'rmaganman", tone: "destructive" },
  { label: "Ba'zan", v: 1, hint: "Vaqti-vaqti bilan", tone: "warm" },
  { label: "Tez-tez", v: 2, hint: "Doim yoki ko'p", tone: "success" },
];

const toneStyles: Record<"destructive" | "warm" | "success", { dot: string; ring: string }> = {
  destructive: { dot: "bg-destructive/70", ring: "ring-destructive/30" },
  warm: { dot: "bg-warm", ring: "ring-warm/30" },
  success: { dot: "bg-success", ring: "ring-success/30" },
};

function Diagnostics() {
  const { child } = useActiveChild();
  const questions = useDiagnosticsQuestions();
  const submit = useSubmitDiagnostics(child?.id);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<DiagnosticsResult | null>(null);

  if (questions.isLoading || !questions.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const qList = questions.data.questions;

  if (result) {
    const tier = result.pct >= 80 ? "great" : result.pct >= 50 ? "ok" : "watch";
    const heading =
      tier === "great"
        ? "Ajoyib rivojlanish"
        : tier === "ok"
          ? "Yaxshi natija"
          : "Birgalikda ishlaymiz";
    const tone =
      tier === "great"
        ? { ring: "ring-success/30", text: "text-success", bg: "bg-success-soft" }
        : tier === "ok"
          ? { ring: "ring-primary/30", text: "text-primary", bg: "bg-primary-soft" }
          : { ring: "ring-warm/40", text: "text-warm-foreground", bg: "bg-warm-soft" };

    return (
      <div className="min-h-screen bg-gradient-calm px-6 py-10 max-w-md mx-auto flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            className={cn(
              "grid size-24 place-items-center rounded-3xl ring-1 mb-6",
              tone.bg,
              tone.ring,
            )}
          >
            <CheckCircle2 className={cn("size-12", tone.text)} strokeWidth={1.5} />
          </div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", tone.text)}>
            Diagnostika natijasi
          </p>
          <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight tracking-tight">
            {heading}
          </h1>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-[44px] font-semibold tabular-nums">
              {result.pct}%
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {result.score}/{result.maxScore}
            </span>
          </div>

          <div className="mt-7 w-full rounded-[28px] bg-card p-5 shadow-card text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Keyingi qadamlar
            </p>
            <h3 className="mt-0.5 font-display text-lg font-semibold tracking-tight">Tavsiyalar</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {result.recommendations.map((r, idx) => (
                <li key={idx} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-1.5 inline-block size-1.5 rounded-full shrink-0",
                      tone.text.replace("text-", "bg-"),
                    )}
                  />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link to="/dashboard" className="mt-6 block">
          <Button size="lg" className="press w-full h-14 rounded-2xl shadow-glow">
            Asosiy sahifaga qaytish
          </Button>
        </Link>
      </div>
    );
  }

  const q = qList[i];
  const isLast = i === qList.length - 1;

  const pickAnswer = async (v: number) => {
    const next = [...answers, v];
    if (!isLast) {
      setAnswers(next);
      setI(i + 1);
      return;
    }
    if (!child) {
      toast.error("Avval bola profilini qo'shing");
      return;
    }
    try {
      const res = await submit.mutateAsync(next);
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuborilmadi");
    }
  };

  const pct = ((i + 1) / qList.length) * 100;

  return (
    <div className="min-h-screen bg-background px-6 py-8 max-w-md mx-auto flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/dashboard"
          aria-label="Orqaga"
          className="press grid size-9 place-items-center rounded-full bg-card shadow-xs"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
          {i + 1} / {qList.length}
        </span>
        <div className="size-9" />
      </div>
      <div
        className="h-1.5 rounded-full bg-muted overflow-hidden mb-10"
        role="progressbar"
        aria-valuenow={i + 1}
        aria-valuemin={1}
        aria-valuemax={qList.length}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
          style={{ width: `${pct}%`, transitionTimingFunction: "var(--ease-emphasized)" }}
        />
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Savol {i + 1}
      </p>
      <h2
        key={i}
        className="mt-2 font-display text-[24px] font-semibold leading-snug tracking-tight mb-10 animate-in fade-in slide-in-from-bottom-1 duration-400"
        style={{ animationTimingFunction: "var(--ease-emphasized)" }}
      >
        {q}
      </h2>

      <div className="space-y-2.5 mt-auto">
        {optionMeta.map((o) => {
          const t = toneStyles[o.tone];
          return (
            <button
              key={o.v}
              type="button"
              disabled={submit.isPending}
              onClick={() => pickAnswer(o.v)}
              className={cn(
                "press group w-full flex items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-card ring-1 ring-border/60 transition-all hover:shadow-soft hover:ring-2 disabled:opacity-50",
                "hover:" + t.ring,
              )}
            >
              <span className={cn("size-3 rounded-full shrink-0 ring-4 ring-card", t.dot)} />
              <span className="flex-1 min-w-0">
                <span className="block font-semibold tracking-tight">{o.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{o.hint}</span>
              </span>
              {submit.isPending && isLast && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
