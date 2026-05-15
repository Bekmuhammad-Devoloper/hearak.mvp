import { createFileRoute } from "@tanstack/react-router";
import { Mail, CheckCircle2, MoreVertical, Stethoscope } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminSpecialists } from "@/lib/queries";

export const Route = createFileRoute("/admin/specialists")({ component: AdminSpecialists });

function AdminSpecialists() {
  const { data, isLoading, isError } = useAdminSpecialists();

  return (
    <AdminShell pageTitle="Mutaxassislar" pageDescription="Surdolog, logoped, audiologlarni boshqarish">
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : isError || !data ? (
        <EmptyState icon={Stethoscope} title="Yuklashda xatolik" description="Mutaxassislar ro'yxatini olib bo'lmadi." />
      ) : data.specialists.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Hali mutaxassis yo'q" description="Ro'yxatdan o'tgan birorta mutaxassis topilmadi." />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data.specialists.map((s) => (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center">
                    {s.avatarLetter}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{s.fullName}</div>
                    <div className="text-xs text-muted-foreground">{s.title}</div>
                  </div>
                </div>
                <button className="size-8 rounded-lg hover:bg-surface flex items-center justify-center">
                  <MoreVertical className="size-4 text-muted-foreground" />
                </button>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" /> {s.email}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Topshiriqlar</div>
                  <div className="font-bold text-foreground">{s.assignments}</div>
                </div>
                {s.verified ? (
                  <Badge tone="success"><CheckCircle2 className="size-3 mr-1" />Tasdiqlangan</Badge>
                ) : (
                  <Badge tone="warning">Kutilmoqda</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
