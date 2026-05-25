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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  LogOut,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCreatePatient, useMe, useSpecialistPatients, useSpecialistStats, useSignout } from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LogoWordmark } from "@/components/brand-icons";
import { Avatar } from "@/components/Avatar";

export const Route = createFileRoute("/specialist/")({ component: SpecialistDashboard });

type Filter = "all" | "active" | "new";

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

function SpecialistDashboard() {
  const me = useMe();
  const nav = useNavigate();
  const stats = useSpecialistStats();
  const patients = useSpecialistPatients();
  const signout = useSignout();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
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

  const all = patients.data?.patients ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((p) => {
        if (filter === "new") return p.implantMonths <= 3;
        if (filter === "active") {
          // "Bu hafta faol" — qarz mavjudligi yoki yaqin sessiyaga ko'ra.
          // lastSession satr ko'rinishida — "yaqinda" yoki sana — sodda filter:
          const s = (p.lastSession ?? "").toLowerCase();
          return s.includes("kun") || s.includes("bugun") || s.includes("kech");
        }
        return true;
      })
      .filter((p) => (needle ? p.name.toLowerCase().includes(needle) : true));
  }, [all, filter, q]);

  const newCount = all.filter((p) => p.implantMonths <= 3).length;

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

  const handleSignout = async () => {
    await signout.mutateAsync().catch(() => {});
    nav({ to: "/auth", replace: true });
  };

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
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              aria-label="Bildirishnomalar"
              className="grid size-10 place-items-center rounded-full bg-muted/40 hover:bg-muted no-underline text-foreground"
            >
              <Bell className="size-5" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full bg-muted/40 hover:bg-muted px-2 py-1 outline-none focus-ring">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold tracking-tight">
                    {me.data?.user.fullName ?? "Mutaxassis"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {me.data?.user.title ?? "Logoped"}
                  </div>
                </div>
                <Avatar
                  src={me.data?.user.avatarUrl ?? null}
                  fallback={me.data?.user.avatarLetter ?? "N"}
                  rounded="rounded-full"
                  bg="bg-primary-soft"
                  fg="text-primary"
                  className="size-9 text-sm"
                />
                <ChevronDown className="size-3.5 text-muted-foreground hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{me.data?.user.fullName ?? "Mutaxassis"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav({ to: "/settings/profile" })}>
                  <Settings className="size-4 mr-2" /> Profil sozlamalari
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/notifications" })}>
                  <Bell className="size-4 mr-2" /> Bildirishnomalar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignout} className="text-destructive focus:text-destructive">
                  <LogOut className="size-4 mr-2" /> Chiqish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hisobot
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-tight font-semibold tracking-tight">
              Bugungi holat
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Bemorlar bilan ishlash, qaydlar va topshiriqlar — bir joyda
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="press rounded-full h-11 px-5">
            <Plus className="size-4" /> Yangi bemor
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
            <div className="flex gap-2 flex-wrap">
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
            </div>
          </div>

          {/* Filter tabs */}
          <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
            {(
              [
                { key: "all" as const, label: "Barchasi", count: all.length },
                { key: "active" as const, label: "Bu hafta faol", count: stats.data?.activeThisWeek ?? 0 },
                { key: "new" as const, label: "Yangi (≤ 3 oy)", count: newCount },
              ]
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  {tab.label}
                  <span className={cn("text-[11px] tabular-nums", active ? "opacity-90" : "opacity-70")}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {patients.isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong/60 py-10 text-center text-sm text-muted-foreground">
              {q.trim() || filter !== "all" ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  to="/specialist/$id"
                  params={{ id: c.id }}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl bg-muted/30 p-4 ring-1 ring-border/40 transition-all hover:ring-primary/30 hover:bg-muted/50 no-underline",
                  )}
                >
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft font-display font-semibold text-primary">
                    {c.avatarLetter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold tracking-tight truncate">{c.name}</div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" /> {c.age} yosh
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" /> {c.implantMonths} oy
                      </span>
                      {c.implantMonths <= 3 && (
                        <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                          Yangi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Oxirgi seans
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold">
                      <Clock className="size-3 text-muted-foreground" /> {c.lastSession}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick tips */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TipCard
            icon={TrendingUp}
            tone="primary"
            title="Rivojlanishni kuzating"
            body="Har bemorning so'z boyligi va bosqichlari sahifasiga kirib, oylik grafikni ko'ring."
          />
          <TipCard
            icon={ClipboardList}
            tone="warm"
            title="Topshiriq yarating"
            body="Bemorga oddiy mashq topshiring — ota-ona Nutq yo'li ilovasidan bajaradi."
          />
          <TipCard
            icon={Bell}
            tone="success"
            title="Qayd yozib qoldiring"
            body="Seansdan keyin kuzatuvlaringizni qayd qiling — vaqt o'tib trend ko'rinadi."
          />
        </div>
      </main>

      <AddPatientDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function TipCard({
  icon: Icon,
  tone,
  title,
  body,
}: {
  icon: typeof TrendingUp;
  tone: "primary" | "warm" | "success";
  title: string;
  body: string;
}) {
  const tones = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    warm: { bg: "bg-warm-soft", text: "text-warm-foreground" },
    success: { bg: "bg-success-soft", text: "text-success" },
  };
  const t = tones[tone];
  return (
    <div className="rounded-[20px] bg-card p-5 shadow-card">
      <div className={cn("grid size-10 place-items-center rounded-xl", t.bg)}>
        <Icon className={cn("size-5", t.text)} />
      </div>
      <h3 className="mt-3 font-semibold tracking-tight text-sm">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
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
      label: "Reabilitatsiya boshlangan sana",
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
