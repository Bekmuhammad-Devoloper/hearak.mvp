import { createFileRoute } from "@tanstack/react-router";
import { ListTodo, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminAssignments, type AdminAssignment } from "@/lib/queries";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/admin/assignments")({ component: AdminAssignments });

type Status = AdminAssignment["status"];

const statusMap: Record<Status, { label: string; tone: "success" | "primary" | "danger" | "neutral"; icon: typeof CheckCircle2 }> = {
  completed:   { label: "Bajarildi",     tone: "success", icon: CheckCircle2 },
  in_progress: { label: "Jarayonda",     tone: "primary", icon: Clock },
  overdue:     { label: "Muddati o'tdi", tone: "danger",  icon: AlertCircle },
  new:         { label: "Yangi",         tone: "neutral", icon: ListTodo },
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const day = Math.floor(ms / (24 * 3600 * 1000));
  if (day < 1) return "Bugun";
  if (day === 1) return "Kecha";
  if (day < 7) return `${day} kun oldin`;
  if (day < 30) return `${Math.floor(day / 7)} hafta oldin`;
  return `${Math.floor(day / 30)} oy oldin`;
}

function AdminAssignments() {
  const t = useT();
  const { data, isLoading, isError } = useAdminAssignments();
  const list = data?.assignments ?? [];

  const counts = {
    new: list.filter((a) => a.status === "new").length,
    in_progress: list.filter((a) => a.status === "in_progress").length,
    completed: list.filter((a) => a.status === "completed").length,
    overdue: list.filter((a) => a.status === "overdue").length,
  };

  return (
    <AdminShell pageTitle={t("adminAssignments")} pageDescription={t("adminAssignmentsDesc")}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MiniCard label="Yangi" value={counts.new} tone="neutral" icon={ListTodo} />
        <MiniCard label="Jarayonda" value={counts.in_progress} tone="primary" icon={Clock} />
        <MiniCard label="Bajarilgan" value={counts.completed} tone="success" icon={CheckCircle2} />
        <MiniCard label="Muddati o'tgan" value={counts.overdue} tone="danger" icon={AlertCircle} />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : isError || !data ? (
          <EmptyState icon={ListTodo} title="Yuklashda xatolik" description="Topshiriqlarni olib bo'lmadi." />
        ) : list.length === 0 ? (
          <EmptyState icon={ListTodo} title="Topshiriq yo'q" description="Hali birorta topshiriq berilmagan." />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-surface">
                  <th className="py-3 px-5 font-semibold">Topshiriq</th>
                  <th className="py-3 px-5 font-semibold">Bola</th>
                  <th className="py-3 px-5 font-semibold">Mutaxassis</th>
                  <th className="py-3 px-5 font-semibold">Yaratilgan</th>
                  <th className="py-3 px-5 font-semibold">Bajarish</th>
                  <th className="py-3 px-5 font-semibold">Holat</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const s = statusMap[a.status];
                  const Icon = s.icon;
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                      <td className="py-3 px-5 text-sm font-medium text-foreground">{a.title}</td>
                      <td className="py-3 px-5 text-sm text-foreground">{a.childName}</td>
                      <td className="py-3 px-5 text-sm text-muted-foreground">{a.specialistName}</td>
                      <td className={"py-3 px-5 text-sm " + (a.status === "overdue" ? "text-destructive font-semibold" : "text-muted-foreground")}>
                        {relativeTime(a.createdAt)}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden">
                            <div
                              className={
                                "h-full rounded-full " +
                                (a.progress === 100 ? "bg-success" : a.status === "overdue" ? "bg-destructive" : "bg-primary")
                              }
                              style={{ width: a.progress + "%" }}
                            />
                          </div>
                          <span className="text-xs w-9 text-muted-foreground">{a.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <Badge tone={s.tone}><Icon className="size-3 mr-1" />{s.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function MiniCard({ label, value, tone, icon: Icon }: { label: string; value: number; tone: "neutral" | "primary" | "success" | "danger"; icon: typeof CheckCircle2 }) {
  const tones = {
    neutral: "bg-surface text-muted-foreground",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    danger:  "bg-destructive-soft text-destructive",
  };
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card flex items-center gap-4">
      <div className={"size-12 rounded-xl flex items-center justify-center " + tones[tone]}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
