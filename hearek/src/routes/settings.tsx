import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
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
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Check,
  ChevronRight,
  Globe,
  Loader2,
  LogOut,
  Plus,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useActiveChild, useMe, useSetActiveChild, useSignout, useUpdateMe } from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logomark } from "@/components/brand-icons";

export const Route = createFileRoute("/settings")({ component: Settings });

type Dlg = "profile" | "children" | "notifications" | "language" | null;

function Settings() {
  const me = useMe();
  const signout = useSignout();
  const nav = useNavigate();
  const [dlg, setDlg] = useState<Dlg>(null);

  const handleSignout = async () => {
    await signout.mutateAsync().catch(() => {});
    nav({ to: "/auth", replace: true });
  };

  const items: Array<{
    icon: typeof User;
    label: string;
    sublabel?: string;
    dlg: Dlg;
    tone: "primary" | "warm" | "accent" | "success";
  }> = [
    {
      icon: User,
      label: "Profil ma'lumotlari",
      sublabel: me.data?.user.email,
      dlg: "profile",
      tone: "primary",
    },
    { icon: Users, label: "Bola profillari", dlg: "children", tone: "warm" },
    { icon: Bell, label: "Bildirishnomalar", dlg: "notifications", tone: "accent" },
    { icon: Globe, label: "Til", sublabel: "O'zbekcha", dlg: "language", tone: "success" },
  ];

  const tone = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    warm: { bg: "bg-warm-soft", text: "text-warm-foreground" },
    accent: { bg: "bg-accent-soft", text: "text-accent-foreground" },
    success: { bg: "bg-success-soft", text: "text-success" },
  } as const;

  return (
    <MobileShell>
      <header className="px-5 pt-12 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Sozlamalar
        </p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-semibold tracking-tight">
          Hisobingiz
        </h1>
      </header>

      <div className="px-5 space-y-5">
        {/* Profile card */}
        <div className="relative overflow-hidden rounded-[28px] bg-card p-5 shadow-card">
          <span
            aria-hidden
            className="absolute -right-6 -top-6 size-28 rounded-full bg-primary/15 blur-2xl"
          />
          <div className="relative flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft font-display text-2xl font-semibold text-primary">
              {me.data?.user.avatarLetter ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {me.data?.user.role === "specialist" ? "Mutaxassis" : "Ota-ona"}
              </p>
              <h2 className="font-display text-[17px] font-semibold tracking-tight truncate">
                {me.data?.user.fullName ?? "Mehmon"}
              </h2>
              <p className="text-xs text-muted-foreground truncate">{me.data?.user.email ?? ""}</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="overflow-hidden rounded-[28px] bg-card shadow-card">
          {items.map((it, i) => {
            const t = tone[it.tone];
            return (
              <button
                key={i}
                type="button"
                onClick={() => setDlg(it.dlg)}
                className="press w-full flex items-center gap-3.5 border-b border-border/60 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 last:border-0"
              >
                <span className={cn("grid size-10 place-items-center rounded-xl shrink-0", t.bg)}>
                  <it.icon className={cn("size-[18px]", t.text)} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold leading-tight">{it.label}</span>
                  {it.sublabel && (
                    <span className="mt-0.5 block text-xs text-muted-foreground truncate">
                      {it.sublabel}
                    </span>
                  )}
                </span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        {me.data?.user.role === "specialist" && (
          <Link to="/specialist">
            <Button
              variant="outline"
              className="press w-full h-12 rounded-2xl border-border-strong/60"
            >
              <Stethoscope className="size-4" />
              Mutaxassis paneliga o'tish
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          disabled={signout.isPending}
          onClick={handleSignout}
          className="press w-full h-12 rounded-2xl text-destructive hover:bg-destructive-soft hover:text-destructive"
        >
          {signout.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Chiqish
        </Button>

        <div className="flex flex-col items-center gap-2 pt-6 pb-2">
          <Logomark className="h-6 w-6 text-muted-foreground/60" duotone={false} />
          <p className="text-[11px] text-muted-foreground">Hearak v0.1 · mehr bilan ishlangan</p>
        </div>
      </div>

      <ProfileDialog open={dlg === "profile"} onClose={() => setDlg(null)} />
      <ChildrenDialog open={dlg === "children"} onClose={() => setDlg(null)} />
      <NotificationsDialog open={dlg === "notifications"} onClose={() => setDlg(null)} />
      <LanguageDialog open={dlg === "language"} onClose={() => setDlg(null)} />
    </MobileShell>
  );
}

function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe();
  const update = useUpdateMe();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open && me.data) {
      setFullName(me.data.user.fullName);
      setEmail(me.data.user.email);
    }
  }, [open, me.data]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (update.isPending) return;
    if (!fullName.trim() || !email.trim()) {
      toast.error("Ism va email bo'sh bo'lmasligi kerak");
      return;
    }
    try {
      await update.mutateAsync({ fullName: fullName.trim(), email: email.trim() });
      toast.success("Profil saqlandi");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profil ma'lumotlari</DialogTitle>
          <DialogDescription>Hisobingiz ma'lumotlarini yangilang</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              To'liq ism
            </Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Email
            </Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={update.isPending}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={update.isPending} className="press">
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : "Saqlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChildrenDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { children, child } = useActiveChild();
  const setActive = useSetActiveChild();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bola profillari</DialogTitle>
          <DialogDescription>Faol bolani tanlang yoki yangi profil qo'shing</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {children.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Hozircha profillar yo'q
            </p>
          )}
          {children.map((c) => {
            const isActive = child?.id === c.id;
            const monogram = c.name.charAt(0).toUpperCase();
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActive(c.id);
                  toast.success(`${c.name} faol bola sifatida tanlandi`);
                  onClose();
                }}
                className={cn(
                  "press w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-colors",
                  isActive
                    ? "bg-primary-soft ring-1 ring-primary/30"
                    : "bg-muted/40 hover:bg-muted/70",
                )}
              >
                <div className="relative">
                  <div className="grid size-12 place-items-center rounded-2xl bg-card font-display text-lg font-semibold text-primary shadow-xs">
                    {monogram}
                  </div>
                  <span
                    aria-hidden
                    className="absolute -bottom-1 -right-1 rounded-full bg-card px-1 text-base leading-none shadow-xs ring-1 ring-border"
                  >
                    {c.emoji}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold tracking-tight truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.days} kun · {c.stage}
                  </div>
                </div>
                {isActive && <Check className="size-5 text-primary shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Link to="/add-child" onClick={onClose} className="w-full">
            <Button variant="outline" className="press w-full">
              <Plus className="size-4" /> Yangi profil qo'shish
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const NOTIFS_KEY = "hearak.notifs";
type NotifPrefs = { daily: boolean; milestones: boolean; specialist: boolean };
const defaultPrefs: NotifPrefs = { daily: true, milestones: true, specialist: false };

function NotificationsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem(NOTIFS_KEY);
      if (raw) setPrefs({ ...defaultPrefs, ...(JSON.parse(raw) as NotifPrefs) });
    } catch {
      /* ignore */
    }
  }, [open]);

  const update = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      window.localStorage.setItem(NOTIFS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const rows: Array<{ key: keyof NotifPrefs; title: string; desc: string }> = [
    { key: "daily", title: "Kunlik mashqlar", desc: "Har kuni eslatma yuboramiz" },
    { key: "milestones", title: "Yangi bosqichlar", desc: "Bola yangi yutuqqa erishganda" },
    { key: "specialist", title: "Mutaxassis xabarlari", desc: "Yangi qayd yoki topshiriqlar" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bildirishnomalar</DialogTitle>
          <DialogDescription>Qaysi xabarlarni olishni tanlang</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.key}
              className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 p-3.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight">{r.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <Switch
                checked={prefs[r.key]}
                onCheckedChange={(v) => update({ [r.key]: v } as Partial<NotifPrefs>)}
                aria-label={r.title}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="press">
            Yopish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const LANG_KEY = "hearak.lang";

function LanguageDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  useEffect(() => {
    if (!open) return;
    try {
      const raw = window.localStorage.getItem(LANG_KEY);
      if (raw === "ru" || raw === "uz") setLang(raw);
    } catch {
      /* ignore */
    }
  }, [open]);

  const pick = (v: "uz" | "ru") => {
    setLang(v);
    try {
      window.localStorage.setItem(LANG_KEY, v);
    } catch {
      /* ignore */
    }
    toast.success(v === "uz" ? "O'zbekcha tanlandi" : "Выбран русский");
    onClose();
  };

  const options: Array<{ v: "uz" | "ru"; label: string; hint: string }> = [
    { v: "uz", label: "O'zbekcha", hint: "Asosiy til" },
    { v: "ru", label: "Русский", hint: "Tez orada" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Til</DialogTitle>
          <DialogDescription>Interfeys tilini tanlang</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {options.map((o) => {
            const active = lang === o.v;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => pick(o.v)}
                className={cn(
                  "press w-full flex items-center justify-between rounded-2xl p-4 text-left transition-colors",
                  active
                    ? "bg-primary-soft ring-1 ring-primary/30"
                    : "bg-muted/40 hover:bg-muted/70",
                )}
              >
                <div>
                  <div className="text-sm font-semibold tracking-tight">{o.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{o.hint}</div>
                </div>
                {active && <Check className="size-5 text-primary" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
