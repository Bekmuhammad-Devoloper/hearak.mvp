import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Trash2, ClipboardCheck, TrendingUp, Plus, Loader2 } from "lucide-react";
import { AdminShell, Badge, StatCard, Skeleton, EmptyState } from "@/components/AdminShell";
import {
  useAdminCreateDxQuestion,
  useAdminDeleteDxQuestion,
  useAdminDiagnostics,
  useAdminUpdateDxQuestion,
  type AdminDxQuestion,
} from "@/lib/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/admin/diagnostics")({ component: AdminDiagnostics });

function AdminDiagnostics() {
  const t = useT();
  const { data, isLoading, isError } = useAdminDiagnostics();
  const [tab, setTab] = useState<"questions" | "results">("questions");
  const [editing, setEditing] = useState<AdminDxQuestion | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const deleteQ = useAdminDeleteDxQuestion();

  const questions = data?.questions ?? [];
  const results = data?.results ?? [];
  const avgPct = results.length ? Math.round(results.reduce((s, r) => s + r.pct, 0) / results.length) : 0;
  const highRisk = results.filter((r) => r.pct < 30).length;

  const handleDelete = async (q: AdminDxQuestion) => {
    if (!window.confirm("Bu savolni o'chirmoqchimisiz?")) return;
    try {
      await deleteQ.mutateAsync(q.id);
      toast.success("Savol o'chirildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "O'chirish muvaffaqiyatsiz");
    }
  };

  return (
    <AdminShell pageTitle={t("adminDiagnostics")} pageDescription={t("adminDiagnosticsDesc")}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Faol savollar" value={String(questions.filter((q) => q.active).length)} icon={ClipboardCheck} tone="primary" />
        <StatCard label="Jami topshirilgan" value={String(results.length)} icon={TrendingUp} tone="success" />
        <StatCard label="O'rtacha ball" value={avgPct + "%"} icon={ClipboardCheck} tone="accent" />
        <StatCard label="Yuqori xavf" value={String(highRisk)} icon={ClipboardCheck} tone="warm" />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {([
            ["questions", "Savollar bazasi"],
            ["results", "Natijalar"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                (tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "questions" && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            <Plus className="size-4" /> Savol qo'shish
          </button>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : isError || !data ? (
          <EmptyState icon={ClipboardCheck} title="Yuklashda xatolik" description="Ma'lumotlarni olib bo'lmadi." />
        ) : tab === "questions" ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-surface">
                  <th className="py-3 px-5 font-semibold w-16">ID</th>
                  <th className="py-3 px-5 font-semibold">Savol</th>
                  <th className="py-3 px-5 font-semibold">Kategoriya</th>
                  <th className="py-3 px-5 font-semibold">Yosh</th>
                  <th className="py-3 px-5 font-semibold">Vazn</th>
                  <th className="py-3 px-5 font-semibold">Holat</th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                    <td className="py-3 px-5 text-sm font-semibold text-muted-foreground">{q.id}</td>
                    <td className="py-3 px-5 text-sm text-foreground max-w-[420px]">{q.text}</td>
                    <td className="py-3 px-5"><Badge tone="primary">{q.category}</Badge></td>
                    <td className="py-3 px-5 text-sm text-muted-foreground">{q.ageGroup}</td>
                    <td className="py-3 px-5">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={"size-1.5 rounded-full " + (i < q.weight ? "bg-primary" : "bg-surface")} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-5">{q.active ? <Badge tone="success">Faol</Badge> : <Badge tone="neutral">O'chirilgan</Badge>}</td>
                    <td className="py-3 px-5 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(q)}
                          aria-label="Tahrirlash"
                          className="size-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(q)}
                          disabled={deleteQ.isPending}
                          aria-label="O'chirish"
                          className="size-8 rounded-lg hover:bg-destructive-soft flex items-center justify-center text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Natija yo'q" description="Hali birorta diagnostika topshirilmagan." />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-surface">
                  <th className="py-3 px-5 font-semibold">Bola</th>
                  <th className="py-3 px-5 font-semibold">Sana</th>
                  <th className="py-3 px-5 font-semibold">Ball</th>
                  <th className="py-3 px-5 font-semibold">Foiz</th>
                  <th className="py-3 px-5 font-semibold">Tavsiya</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                    <td className="py-3 px-5 text-sm font-medium text-foreground">{r.childName}</td>
                    <td className="py-3 px-5 text-sm text-muted-foreground">{r.submittedAt.slice(0, 10)}</td>
                    <td className="py-3 px-5 text-sm font-semibold text-foreground">{r.score} / {r.maxScore}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className={
                              "h-full rounded-full " +
                              (r.pct >= 80 ? "bg-success" : r.pct >= 50 ? "bg-primary" : r.pct >= 30 ? "bg-warm" : "bg-destructive")
                            }
                            style={{ width: r.pct + "%" }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-9 text-foreground">{r.pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-sm text-muted-foreground max-w-md truncate">{r.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <DxQuestionDialog
        open={addOpen || !!editing}
        question={editing}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
      />
    </AdminShell>
  );
}

function DxQuestionDialog({
  open,
  question,
  onClose,
}: {
  open: boolean;
  question: AdminDxQuestion | null;
  onClose: () => void;
}) {
  const create = useAdminCreateDxQuestion();
  const update = useAdminUpdateDxQuestion();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [weight, setWeight] = useState<number>(2);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open) {
      setText(question?.text ?? "");
      setCategory(question?.category ?? "");
      setAgeGroup(question?.ageGroup ?? "");
      setWeight(question?.weight ?? 2);
      setActive(question?.active ?? true);
    }
  }, [open, question]);

  const pending = create.isPending || update.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (text.trim().length < 3) {
      toast.error("Savol matni juda qisqa");
      return;
    }
    try {
      const body = {
        text: text.trim(),
        category: category.trim() || undefined,
        ageGroup: ageGroup.trim() || undefined,
        weight,
        active,
      };
      if (question) {
        await update.mutateAsync({ id: question.id, ...body });
        toast.success("Savol yangilandi");
      } else {
        await create.mutateAsync(body);
        toast.success("Savol qo'shildi");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  const inputCls =
    "block w-full h-11 px-3 rounded-xl border border-input bg-transparent text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{question ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle>
          <DialogDescription>
            Diagnostika savollari bazasi — ota-ona shu savollarga javob beradi va natijalar shu yerda saqlanadi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="dx-text" className={labelCls}>Savol matni</label>
            <textarea
              id="dx-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className={inputCls + " h-auto py-2.5"}
              placeholder="Bola o'z ismiga reaksiya bildiradimi?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dx-cat" className={labelCls}>Kategoriya</label>
              <input
                id="dx-cat"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
                placeholder="Reaksiya"
              />
            </div>
            <div>
              <label htmlFor="dx-age" className={labelCls}>Yosh guruhi</label>
              <input
                id="dx-age"
                type="text"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className={inputCls}
                placeholder="0–2 yosh"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label htmlFor="dx-weight" className={labelCls}>Vazn (1–5)</label>
              <input
                id="dx-weight"
                type="number"
                min={1}
                max={5}
                value={weight}
                onChange={(e) => setWeight(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-input text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-4"
              />
              Faol
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : question ? "Saqlash" : "Qo'shish"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
