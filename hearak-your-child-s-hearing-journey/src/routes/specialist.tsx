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
import { Activity, ClipboardList, Ear, Loader2, Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useCreatePatient,
  useMe,
  useSpecialistPatients,
  useSpecialistStats,
} from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/specialist")({ component: Specialist });

function Specialist() {
  const me = useMe();
  const nav = useNavigate();
  const stats = useSpecialistStats();
  const patients = useSpecialistPatients();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (me.isError) nav({ to: "/auth", replace: true });
    if (me.data?.user.role === "parent") {
      toast.error("Bu sahifa faqat mutaxassislar uchun");
      nav({ to: "/dashboard", replace: true });
    }
  }, [me.isError, me.data, nav]);

  const filtered = useMemo(() => {
    const list = patients.data?.patients ?? [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(needle));
  }, [patients.data, q]);

  const headerCards = [
    { icon: Users, label: "Bemorlar", value: stats.data?.patients ?? "—", color: "text-primary" },
    { icon: Activity, label: "Bu hafta faol", value: stats.data?.activeThisWeek ?? "—", color: "text-success" },
    { icon: ClipboardList, label: "Topshiriqlar", value: stats.data?.assignments ?? "—", color: "text-warm-foreground" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary-soft flex items-center justify-center">
              <Ear className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold leading-tight">Hearak</h1>
              <p className="text-xs text-muted-foreground">Mutaxassis paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{me.data?.user.fullName ?? "Mutaxassis"}</div>
              <div className="text-xs text-muted-foreground">{me.data?.user.title ?? "Logoped"}</div>
            </div>
            <div className="size-10 rounded-full bg-warm/40 flex items-center justify-center font-semibold text-warm-foreground">
              {me.data?.user.avatarLetter ?? "N"}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {headerCards.map((s, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 shadow-card">
              <s.icon className={`size-6 ${s.color} mb-3`} />
              <div className="font-display text-3xl font-semibold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-3xl shadow-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="font-display text-xl font-semibold">Bemorlar ro'yxati</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Qidirish..."
                  aria-label="Bemorni qidirish"
                  className="h-10 pl-9 pr-3 bg-muted rounded-xl text-sm outline-none"
                />
              </div>
              <Button onClick={() => setAddOpen(true)} className="rounded-xl">
                <Plus className="size-4" /> Qo'shish
              </Button>
            </div>
          </div>

          {patients.isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {q.trim() ? "Bemorlar topilmadi" : "Hozircha bemorlar yo'q. \"Qo'shish\" tugmasini bosing."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  to="/specialist/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-4 py-4 hover:bg-muted/40 px-2 -mx-2 rounded-xl transition-colors"
                >
                  <div className="size-12 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-semibold text-primary">
                    {c.avatarLetter}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.age} yosh · implantatsiya {c.implantMonths} oy oldin
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Oxirgi seans: {c.lastSession}</div>
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yangi bemor</DialogTitle>
          <DialogDescription>Bemor profilini yarating — barcha sayohat shu sahifadan boshlanadi</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient-name">Bolaning ismi</Label>
            <Input
              id="patient-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Diyora"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-dob">Tug'ilgan sana</Label>
            <Input
              id="patient-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-implant">Implantatsiya sanasi</Label>
            <Input
              id="patient-implant"
              type="date"
              value={implantDate}
              onChange={(e) => setImplantDate(e.target.value)}
              className="h-11 rounded-xl"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={create.isPending}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
