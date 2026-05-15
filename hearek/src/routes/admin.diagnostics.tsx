import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Trash2, ClipboardCheck, TrendingUp } from "lucide-react";
import { AdminShell, Badge, StatCard, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminDiagnostics } from "@/lib/queries";
import { useState } from "react";

export const Route = createFileRoute("/admin/diagnostics")({ component: AdminDiagnostics });

function AdminDiagnostics() {
  const { data, isLoading, isError } = useAdminDiagnostics();
  const [tab, setTab] = useState<"questions" | "results">("questions");

  const questions = data?.questions ?? [];
  const results = data?.results ?? [];
  const avgPct = results.length ? Math.round(results.reduce((s, r) => s + r.pct, 0) / results.length) : 0;
  const highRisk = results.filter((r) => r.pct < 30).length;

  return (
    <AdminShell pageTitle="Diagnostika" pageDescription="Savollar to'plami va natijalar">
      <div className="grid grid-cols-4 gap-4">
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
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : isError || !data ? (
          <EmptyState icon={ClipboardCheck} title="Yuklashda xatolik" description="Ma'lumotlarni olib bo'lmadi." />
        ) : tab === "questions" ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <table className="w-full">
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
                        <button className="size-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground">
                          <Edit2 className="size-4" />
                        </button>
                        <button className="size-8 rounded-lg hover:bg-destructive-soft flex items-center justify-center text-destructive">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Natija yo'q" description="Hali birorta diagnostika topshirilmagan." />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <table className="w-full">
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
        )}
      </div>
    </AdminShell>
  );
}
