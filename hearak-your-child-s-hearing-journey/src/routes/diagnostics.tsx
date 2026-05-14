import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useActiveChild, useDiagnosticsQuestions, useSubmitDiagnostics, type DiagnosticsResult } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnostics")({ component: Diagnostics });

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
    return (
      <div className="min-h-screen bg-gradient-calm px-6 py-10 max-w-md mx-auto flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="size-24 rounded-full bg-success/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="size-14 text-success" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-3">
            {result.pct >= 50 ? "Yaxshi natija!" : "Birgalikda ishlaymiz"}
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Bolangiz {result.pct}% rivojlanish ko'rsatkichlariga ega.
          </p>
          <div className="mt-8 bg-card rounded-3xl p-5 shadow-card text-left w-full">
            <h3 className="font-semibold mb-3">Tavsiyalar</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {result.recommendations.map((r, idx) => (
                <li key={idx}>• {r}</li>
              ))}
            </ul>
          </div>
        </div>
        <Link to="/dashboard" className="block mt-6">
          <Button size="lg" className="w-full h-14 rounded-2xl">
            Asosiy sahifaga qaytish
          </Button>
        </Link>
      </div>
    );
  }

  const q = qList[i];
  const isLast = i === qList.length - 1;
  const opts = [
    { label: "Hech qachon", v: 0 },
    { label: "Ba'zan", v: 1 },
    { label: "Tez-tez", v: 2 },
  ];

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

  return (
    <div className="min-h-screen bg-background px-6 py-8 max-w-md mx-auto flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <Link to="/dashboard" aria-label="Orqaga"><ArrowLeft className="size-5" /></Link>
        <span className="text-sm text-muted-foreground">{i + 1} / {qList.length}</span>
        <div className="size-5" />
      </div>
      <div
        className="h-1.5 rounded-full bg-muted overflow-hidden mb-12"
        role="progressbar"
        aria-valuenow={i + 1}
        aria-valuemin={1}
        aria-valuemax={qList.length}
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${((i + 1) / qList.length) * 100}%` }} />
      </div>

      <h2 className="font-display text-2xl font-semibold leading-snug mb-10">{q}</h2>

      <div className="space-y-3 mt-auto">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            disabled={submit.isPending}
            onClick={() => pickAnswer(o.v)}
            className="w-full text-left bg-card hover:bg-primary-soft border border-border rounded-2xl p-5 font-medium transition-colors shadow-card disabled:opacity-50"
          >
            {submit.isPending && isLast ? <Loader2 className="size-5 animate-spin" /> : o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
