import { createFileRoute } from "@tanstack/react-router";
import { Mail, CheckCircle2, MoreVertical, Stethoscope, Eye, Trash2, BadgeCheck, Plus, Loader2 } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState, useAdminSearch } from "@/components/AdminShell";
import { Avatar } from "@/components/Avatar";
import { useAdminCreateSpecialist, useAdminSpecialists } from "@/lib/queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const Route = createFileRoute("/admin/specialists")({ component: AdminSpecialists });

function AdminSpecialists() {
  const { data, isLoading, isError } = useAdminSpecialists();
  const { query } = useAdminSearch();
  const [addOpen, setAddOpen] = useState(false);

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
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {q ? `${filtered.length} / ${all.length}` : `Jami ${all.length} ta mutaxassis`}
        </span>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
        >
          <Plus className="size-4" /> Mutaxassis qo'shish
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : isError || !data ? (
        <EmptyState icon={Stethoscope} title="Yuklashda xatolik" description="Mutaxassislar ro'yxatini olib bo'lmadi." />
      ) : all.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Hali mutaxassis yo'q" description='"Mutaxassis qo&apos;shish" tugmasini bosing.' />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="Topilmadi" description={`"${query}" bo'yicha mutaxassis topilmadi.`} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={s.avatarUrl}
                    fallback={s.avatarLetter}
                    rounded="rounded-full"
                    bg="bg-primary-soft"
                    fg="text-primary"
                    className="size-12 text-base"
                  />
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

      <CreateSpecialistDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </AdminShell>
  );
}

function CreateSpecialistDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useAdminCreateSpecialist();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setTitle("");
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (create.isPending) return;
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring (parol — kamida 6 ta belgi)");
      return;
    }
    try {
      await create.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        title: title.trim() || undefined,
      });
      toast.success("Yangi mutaxassis qo'shildi");
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
          <DialogTitle>Yangi mutaxassis</DialogTitle>
          <DialogDescription>
            Mutaxassis hisobini yarating. Email va parol bilan tizimga kira oladi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="sp-name" className={labelCls}>To'liq ism</label>
            <input
              id="sp-name"
              type="text"
              autoCapitalize="words"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Nigora Yusupova"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="sp-title" className={labelCls}>Lavozim</label>
            <input
              id="sp-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Logoped / Audiolog / Surdolog"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="sp-email" className={labelCls}>Email</label>
            <input
              id="sp-email"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nigora@misol.uz"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="sp-password" className={labelCls}>Vaqtinchalik parol</label>
            <input
              id="sp-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kamida 6 ta belgi"
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Mutaxassis birinchi kirgandan keyin parolni o'zgartira oladi.
            </p>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={create.isPending}
              className="h-10 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : "Qo'shish"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
