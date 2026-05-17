import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Stethoscope, Baby, TrendingUp, ArrowUpRight, ClipboardCheck, Activity, Inbox } from "lucide-react";
import { AdminShell, StatCard, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminStats } from "@/lib/queries";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const { data, isLoading, isError } = useAdminStats();

  return (
    <AdminShell pageTitle="Dashboard" pageDescription="Platforma holati va so'nggi faollik">
      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <EmptyState
          icon={Activity}
          title="Ma'lumot yuklanmadi"
          description="Server bilan bog'lanishda xatolik. Sahifani yangilang yoki keyinroq urinib ko'ring."
        />
      ) : (
        <DashboardContent data={data} />
      )}
    </AdminShell>
  );
}

function DashboardContent({ data }: { data: NonNullable<ReturnType<typeof useAdminStats>["data"]> }) {
  const { counts, week, stages, recentCompletions } = data;
  const max = Math.max(1, ...week.map((d) => d.value));

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Ro'yxatdan o'tgan bolalar" value={String(counts.children)} icon={Baby} tone="primary" />
        <StatCard label="Faol ota-onalar"           value={String(counts.parents)} icon={Users} tone="accent" />
        <StatCard label="Mutaxassislar"             value={String(counts.specialists)} icon={Stethoscope} tone="success" />
        <StatCard label="Haftalik faollik"          value={counts.weeklyActivityPct + "%"} icon={TrendingUp} tone="warm" />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="sm:col-span-2 bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Haftalik mashqlar</h3>
              <p className="text-sm text-muted-foreground">Tugatilgan mashqlar soni</p>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <Activity className="size-4" />
              <span className="text-sm font-semibold">{counts.activeThisWeek} faol bola</span>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-4 h-48">
            {week.map((d, i) => {
              const h = (d.value / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end h-full">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/40 transition-all"
                      style={{ height: Math.max(2, h) + "%" }}
                      title={`${d.value} ta`}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground">Bosqichlar bo'yicha</h3>
          <p className="text-sm text-muted-foreground">Bolalar taqsimoti</p>
          <div className="mt-4 space-y-3">
            {stages.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium truncate pr-2">{s.stage}. {s.name}</span>
                  <span className="text-muted-foreground shrink-0">{s.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: s.pct + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card rounded-2xl border border-border shadow-card">
        <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-b border-border gap-3">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground">So'nggi mashqlar</h3>
          <Link to="/admin/analytics" className="text-xs sm:text-sm font-semibold text-primary inline-flex items-center gap-1 shrink-0">
            Tahlillar <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        {recentCompletions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Inbox className="size-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Hali bajarilgan mashq yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentCompletions.map((r, i) => (
              <div key={i} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                <div className="size-9 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {r.childName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug break-words">
                    <span className="font-semibold text-foreground">{r.childName}</span>{" "}
                    <span className="text-muted-foreground">tugatdi:</span>{" "}
                    <span className="font-medium text-foreground">{r.exerciseTitle}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{relativeTime(r.completedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Skeleton className="sm:col-span-2 h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="mt-6 h-64" />
    </>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Hozir";
  if (min < 60) return `${min} daq oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  return `${d} kun oldin`;
}
