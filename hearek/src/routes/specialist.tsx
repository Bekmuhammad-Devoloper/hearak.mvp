import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Activity, ChevronRight, ClipboardList, Loader2, Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCreatePatient, useMe, useSpecialistPatients, useSpecialistStats } from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LogoWordmark } from "@/components/brand-icons";

export const Route = createFileRoute("/specialist")({ component: Specialist });

const statTones: Record<
  "patients" | "active" | "assignments",
  { halo: string; iconBg: string; iconText: string }
> = {
  patients: {
    halo: "bg-primary/15",
    iconBg: "bg-primary-soft",
    iconText: "text-primary",
  },
  active: {
    halo: "bg-success/15",
    iconBg: "bg-success-soft",
    iconText: "text-success",
  },
  assignments: {
    halo: "bg-warm/25",
    iconBg: "bg-warm-soft",
    iconText: "text-warm-foreground",
  },
};

function Specialist() {
  const me = useMe();
  const nav = useNavigate();
  const stats = useSpecialistStats();
  const patients = useSpecialistPatients();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const role = me.data?.user.role;
  useEffect(() => {
    if (me.isError) {
      nav({ to: "/auth", replace: true });
    } else if (role === "admin") {
      nav({ to: "/admin/dashboard", replace: true });
    } else if (role === "parent") {
      toast.error("Bu sahifa faqat mutaxassislar uchun");
      nav({ to: "/dashboard", replace: true });
    }
  }, [me.isError, role, nav]);

  const filtered = useMemo(() => {
    const list = patients.data?.patients ?? [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(needle));
  }, [patients.data, q]);

  const statCards = [
    {
      key: "patients" as const,
      Icon: Users,
      label: "Bemorlar",
      value: stats.data?.patients ?? "—",
      sub: "Jami profillar",
    },
    {
      key: "active" as const,
      Icon: Activity,
      label: "Bu hafta faol",
      value: stats.data?.activeThisWeek ?? "—",
      sub: "Oxirgi 7 kunda mashq qilgan",
    },
    {
      key: "assignments" as const,
      Icon: ClipboardList,
      label: "Topshiriqlar",
      value: stats.data?.assignments ?? "—",
      sub: "Jami yaratilgan",
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <LogoWordmark />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Mutaxassis paneli
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold tracking-tight">
                {me.data?.user.fullName ?? "Mutaxassis"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {me.data?.user.title ?? "Logoped"}
              </div>
            </div>
            <div className="grid size-10 place-items-center rounded-full bg-primary-soft font-display font-semibold text-primary">
              {me.data?.user.avatarLetter ?? "N"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Hisobot
          </p>
          <h1 className="mt-1 font-display text-[32px] leading-tight font-semibold tracking-tight">
            Bugungi holat
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {statCards.map((s) => {
            const t = statTones[s.key];
            return (
              <div
                key={s.key}
                className="relative overflow-hidden rounded-[24px] bg-card p-5 shadow-card"
              >
                <span
                  aria-hidden
                  className={cn("absolute -right-8 -top-8 size-28 rounded-full blur-2xl", t.halo)}
                />
                <div className="relative">
                  <div className={cn("grid size-11 place-items-center rounded-2xl", t.iconBg)}>
                    <s.Icon className={cn("size-5", t.iconText)} />
                  </div>
                  <div className="mt-5 font-display text-[34px] font-semibold leading-none tabular-nums">
                    {s.value}
                  </div>
                  <div className="mt-1.5 text-sm font-semibold tracking-tight">{s.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-[28px] bg-card p-6 shadow-card">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Bemorlar
              </p>
              <h2 className="mt-0.5 font-display text-xl font-semibold tracking-tight">Ro'yxat</h2>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Bemorni qidirish…"
                  aria-label="Bemorni qidirish"
                  className="h-10 rounded-full bg-muted pl-9 pr-3 text-sm outline-none ring-1 ring-transparent transition-all focus:ring-primary/40 focus:bg-card"
                />
              </div>
              <Button onClick={() => setAddOpen(true)} className="press rounded-full">
                <Plus className="size-4" /> Qo'shish
              </Button>
            </div>
          </div>

          {patients.isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong/60 py-10 text-center text-sm text-muted-foreground">
              {q.trim() ? (
                "Bemorlar topilmadi"
              ) : (
                <>
                  Hozircha bemorlar yo'q.{" "}
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Birinchisini qo'shing
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl ring-1 ring-border/60">
              {filtered.map((c, idx) => (
                <Link
                  key={c.id}
                  to="/specialist/$id"
                  params={{ id: c.id }}
                  className={cn(
                    "group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50",
                    idx !== filtered.length - 1 && "border-b border-border/60",
                  )}
                >
                  <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft font-display font-semibold text-primary">
                    {c.avatarLetter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold tracking-tight truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.age} yosh · implantatsiya {c.implantMonths} oy oldin
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Oxirgi seans
                    </div>
                    <div className="text-xs font-semibold">{c.lastSession}</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddPatientDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function AddPatientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreatePatient();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [implantDate, setImplantDate] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setDob("");
      setImplantDate("");
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (create.isPending) return;
    if (!name.trim() || !dob || !implantDate) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }
    try {
      await create.mutateAsync({ name: name.trim(), dob, implantDate });
      toast.success("Yangi bemor qo'shildi");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  const fields: Array<{
    id: string;
    label: string;
    type?: string;
    value: string;
    placeholder?: string;
    set: (v: string) => void;
  }> = [
    {
      id: "patient-name",
      label: "Bolaning ismi",
      value: name,
      placeholder: "Diyora",
      set: setName,
    },
    { id: "patient-dob", label: "Tug'ilgan sana", type: "date", value: dob, set: setDob },
    {
      id: "patient-implant",
      label: "Implantatsiya sanasi",
      type: "date",
      value: implantDate,
      set: setImplantDate,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi bemor</DialogTitle>
          <DialogDescription>
            Bemor profili — barcha sayohat shu sahifadan boshlanadi
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label
                htmlFor={f.id}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {f.label}
              </Label>
              <Input
                id={f.id}
                type={f.type ?? "text"}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="h-11 rounded-xl"
                required
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={create.isPending}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={create.isPending} className="press">
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
