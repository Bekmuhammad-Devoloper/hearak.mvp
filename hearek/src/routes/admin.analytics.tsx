import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, Baby, Clock, BarChart3 } from "lucide-react";
import { AdminShell, StatCard, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminAnalytics } from "@/lib/queries";

export const Route = createFileRoute("/admin/analytics")({ component: AdminAnalytics });

const stageColors = [
  "bg-primary",
  "bg-accent",
  "bg-warm",
  "bg-success",
  "bg-primary-strong",
  "bg-destructive",
];

function AdminAnalytics() {
  const { data, isLoading, isError } = useAdminAnalytics();

  if (isLoading) {
    return (
      <AdminShell pageTitle="Tahlillar" pageDescription="Foydalanish va rivojlanish ko'rsatkichlari">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Skeleton className="col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
      </AdminShell>
    );
  }

  if (isError || !data) {
    return (
      <AdminShell pageTitle="Tahlillar">
        <EmptyState icon={BarChart3} title="Yuklashda xatolik" description="Tahlil ma'lumotlarini olib bo'lmadi." />
      </AdminShell>
    );
  }

  const max = Math.max(1, ...data.growth.map((d) => d.value));
  const points = data.growth.map((d, i) => {
    const x = (i / (data.growth.length - 1)) * 100;
    const y = 100 - (d.value / max) * 100;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,100 ${points} 100,100`;
  const totalChildren = data.ageGroups.reduce((s, a) => s + a.count, 0);

  const stagesWithColor = data.stages.map((s, i) => ({ ...s, color: stageColors[i % stageColors.length] }));

  return (
    <AdminShell pageTitle="Tahlillar" pageDescription="Foydalanish va rivojlanish ko'rsatkichlari">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="O'rtacha so'z (bola)" value={String(data.avgWords)} icon={TrendingUp} tone="primary" />
        <StatCard label="Yosh guruhi" value={String(data.ageGroups.length)} icon={Baby} tone="success" />
        <StatCard label="Mutaxassislar" value={String(data.topSpecialists.length)} icon={Users} tone="accent" />
        <StatCard label="Bosqichlar" value={String(data.stages.length)} icon={Clock} tone="warm" />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="col-span-2 bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">O'sish dinamikasi</h3>
              <p className="text-sm text-muted-foreground">12-oylik trend</p>
            </div>
            <div className="flex items-center gap-1.5 text-success">
              <TrendingUp className="size-4" />
              <span className="text-sm font-semibold">+{Math.round(((data.growth[data.growth.length - 1]?.value ?? 0) / (data.growth[0]?.value || 1) - 1) * 100)}%</span>
            </div>
          </div>

          <div className="mt-5 relative h-56">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.56 0.12 215)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="oklch(0.56 0.12 215)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#growthFill)" />
              <polyline points={points} fill="none" stroke="oklch(0.56 0.12 215)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            {data.growth.map((d) => <span key={d.month}>{d.month}</span>)}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground">Bosqichlar bo'yicha</h3>
          <p className="text-sm text-muted-foreground">Bolalar ulushi</p>

          {totalChildren === 0 ? (
            <div className="mt-8 text-center text-sm text-muted-foreground">Ma'lumot yo'q</div>
          ) : (
            <>
              <div className="mt-5 flex justify-center">
                <DonutChart segments={stagesWithColor} />
              </div>
              <div className="mt-5 space-y-2">
                {stagesWithColor.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <span className={"size-2.5 rounded-full " + s.color} />
                    <span className="flex-1 text-foreground">{s.name}</span>
                    <span className="font-semibold text-foreground">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <Baby className="size-5 text-primary" /> Yosh guruhi taqsimoti
          </h3>
          <p className="text-sm text-muted-foreground">Jami {totalChildren} bola</p>

          <div className="mt-5 space-y-4">
            {data.ageGroups.map((a) => (
              <div key={a.range}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{a.range}</span>
                  <span className="text-sm text-muted-foreground">{a.count} bola · {a.pct}%</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: a.pct + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground">Eng faol mutaxassislar</h3>
          <p className="text-sm text-muted-foreground">Topshiriqlar va izohlar bo'yicha</p>

          {data.topSpecialists.length === 0 ? (
            <div className="mt-6 text-sm text-muted-foreground text-center">Hali faol mutaxassis yo'q</div>
          ) : (
            <div className="mt-4 space-y-3">
              {data.topSpecialists.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-surface text-foreground font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.assignments} topshiriq · {s.notes} izoh</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function DonutChart({ segments }: { segments: { pct: number; color: string }[] }) {
  const colorMap: Record<string, string> = {
    "bg-primary": "oklch(0.56 0.12 215)",
    "bg-accent": "oklch(0.7 0.1 175)",
    "bg-warm": "oklch(0.75 0.13 75)",
    "bg-success": "oklch(0.65 0.13 155)",
    "bg-primary-strong": "oklch(0.46 0.13 220)",
    "bg-destructive": "oklch(0.6 0.18 25)",
  };
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="oklch(0.96 0.005 220)" strokeWidth="14" />
      {segments.map((s, i) => {
        const length = (s.pct / 100) * circumference;
        const dasharray = `${length} ${circumference - length}`;
        const dashoffset = -offset;
        offset += length;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={colorMap[s.color] ?? "#94a3b8"}
            strokeWidth="14"
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            pathLength={circumference}
          />
        );
      })}
    </svg>
  );
}
