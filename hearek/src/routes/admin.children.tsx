import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, AlertTriangle, TrendingUp, Calendar, Baby, ChevronRight } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState, useAdminSearch } from "@/components/AdminShell";
import { Avatar } from "@/components/Avatar";
import { useAdminChildren, type AdminChildRow } from "@/lib/queries";
import { useState } from "react";

export const Route = createFileRoute("/admin/children")({ component: AdminChildren });

type Risk = AdminChildRow["risk"];

function riskBadge(r: Risk) {
  if (r === "high")   return <Badge tone="danger"><AlertTriangle className="size-3 mr-1" />Yuqori</Badge>;
  if (r === "medium") return <Badge tone="warning">O'rta</Badge>;
  return <Badge tone="success">Past</Badge>;
}

function AdminChildren() {
  const { data, isLoading, isError } = useAdminChildren();
  const nav = useNavigate();
  const { query: globalQuery } = useAdminSearch();
  const [tab, setTab] = useState<"all" | Risk>("all");
  const [localQuery, setLocalQuery] = useState("");
  const list = data?.children ?? [];
  const byTab = tab === "all" ? list : list.filter((c) => c.risk === tab);
  const q = (localQuery || globalQuery).trim().toLowerCase();
  const filtered = q
    ? byTab.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.parentName ?? "").toLowerCase().includes(q) ||
          (c.specialistName ?? "").toLowerCase().includes(q),
      )
    : byTab;

  const total = list.length;
  const avgWords = total ? Math.round(list.reduce((s, c) => s + c.wordCount, 0) / total) : 0;
  const highRisk = list.filter((c) => c.risk === "high").length;
  const avgActivity = total ? Math.round(list.reduce((s, c) => s + c.activity, 0) / total) : 0;

  return (
    <AdminShell pageTitle="Bolalar" pageDescription="Platformadagi barcha bolalar va ularning rivojlanish bosqichi">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MiniStat label="Jami bolalar" value={String(total)} sub="ro'yxatdan o'tgan" />
        <MiniStat label="O'rtacha so'z" value={String(avgWords)} sub="bola boshiga" />
        <MiniStat label="Faollik" value={avgActivity + "%"} sub="o'rtacha" tone="success" />
        <MiniStat label="Yuqori xavf" value={String(highRisk)} sub="diqqat talab qiladi" tone="danger" />
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          {([
            ["all", "Barchasi", total],
            ["high", "Yuqori xavf", list.filter((c) => c.risk === "high").length],
            ["medium", "O'rta", list.filter((c) => c.risk === "medium").length],
            ["low", "Past", list.filter((c) => c.risk === "low").length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                (tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface")
              }
            >
              {label} <span className="ml-1 text-xs opacity-80">{count}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Bola ismi..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-card border border-border text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : isError || !data ? (
          <EmptyState icon={Baby} title="Yuklashda xatolik" description="Bolalar ro'yxatini olib bo'lmadi." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Baby} title="Bo'sh" description="Tanlangan filtr bo'yicha bola topilmadi." />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-surface">
                  <th className="py-3 px-5 font-semibold">Bola</th>
                  <th className="py-3 px-5 font-semibold">Ota-ona</th>
                  <th className="py-3 px-5 font-semibold">Mutaxassis</th>
                  <th className="py-3 px-5 font-semibold">Bosqich</th>
                  <th className="py-3 px-5 font-semibold">So'z</th>
                  <th className="py-3 px-5 font-semibold">Davomiyligi</th>
                  <th className="py-3 px-5 font-semibold">Rivojlanish</th>
                  <th className="py-3 px-5 font-semibold">Xavf</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => nav({ to: "/admin/children/$id", params: { id: c.id } })}
                    className="border-b border-border last:border-0 hover:bg-surface/60 cursor-pointer"
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {c.avatarUrl ? (
                          <Avatar
                            src={c.avatarUrl}
                            fallback={c.name.charAt(0).toUpperCase()}
                            rounded="rounded-2xl"
                            bg="bg-primary-soft"
                            fg="text-primary"
                            className="size-10 text-base"
                          />
                        ) : (
                          <div className="size-10 rounded-2xl bg-primary-soft text-2xl flex items-center justify-center">
                            {c.emoji}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground text-sm">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.age} yosh</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-sm text-foreground">{c.parentName}</td>
                    <td className="py-3 px-5 text-sm text-muted-foreground">{c.specialistName}</td>
                    <td className="py-3 px-5">
                      <div className="text-sm font-semibold text-foreground">{c.stage}/{c.totalStages}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{c.stageName}</div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                        <TrendingUp className="size-3.5 text-success" /> {c.wordCount}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-sm text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="size-3.5" /> {c.days} kun
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: c.progress + "%" }} />
                        </div>
                        <span className="text-xs font-semibold text-foreground w-8">{c.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2 justify-between">
                        {riskBadge(c.risk)}
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function MiniStat({ label, value, sub, tone = "neutral" }: { label: string; value: string; sub: string; tone?: "neutral" | "success" | "danger" }) {
  const tones = {
    neutral: "text-foreground",
    success: "text-success",
    danger: "text-destructive",
  };
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={"font-display text-2xl font-bold mt-1 " + tones[tone]}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
