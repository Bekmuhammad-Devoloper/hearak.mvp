import { createFileRoute } from "@tanstack/react-router";
import { Mail, CheckCircle2, MoreVertical, Stethoscope, Eye, Trash2, BadgeCheck } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState, useAdminSearch } from "@/components/AdminShell";
import { useAdminSpecialists } from "@/lib/queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/specialists")({ component: AdminSpecialists });

function AdminSpecialists() {
  const { data, isLoading, isError } = useAdminSpecialists();
  const { query } = useAdminSearch();

  const all = data?.specialists ?? [];
  const q = query.trim().toLowerCase();
  const filtered = q
    ? all.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.title ?? "").toLowerCase().includes(q),
      )
    : all;

  return (
    <AdminShell pageTitle="Mutaxassislar" pageDescription="Surdolog, logoped, audiologlarni boshqarish">
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : isError || !data ? (
        <EmptyState icon={Stethoscope} title="Yuklashda xatolik" description="Mutaxassislar ro'yxatini olib bo'lmadi." />
      ) : all.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Hali mutaxassis yo'q" description="Ro'yxatdan o'tgan birorta mutaxassis topilmadi." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Topilmadi" description={`"${query}" bo'yicha mutaxassis topilmadi.`} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((s) => (
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
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label="Amallar"
                    className="size-8 rounded-lg hover:bg-surface flex items-center justify-center outline-none focus-ring"
                  >
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(s.email)
                          .then(() => toast.success("Email nusxalandi"))
                          .catch(() => toast.error("Nusxalashda xatolik"));
                      }}
                    >
                      <Mail className="size-4 mr-2" /> Email nusxalash
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`mailto:${s.email}`, "_blank")}>
                      <Eye className="size-4 mr-2" /> Aloqa qilish
                    </DropdownMenuItem>
                    {!s.verified && (
                      <DropdownMenuItem onClick={() => toast.info("Tasdiqlash funksiyasi tez orada qo'shiladi")}>
                        <BadgeCheck className="size-4 mr-2" /> Tasdiqlash
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toast.info("O'chirish funksiyasi tez orada qo'shiladi")}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4 mr-2" /> O'chirish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
