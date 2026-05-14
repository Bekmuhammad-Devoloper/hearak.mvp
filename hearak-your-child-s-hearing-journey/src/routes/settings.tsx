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
  Heart,
  Loader2,
  LogOut,
  Plus,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useActiveChild,
  useMe,
  useSetActiveChild,
  useSignout,
  useUpdateMe,
} from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const items: Array<{ icon: typeof User; label: string; sublabel?: string; dlg: Dlg }> = [
    { icon: User, label: "Profil ma'lumotlari", sublabel: me.data?.user.email, dlg: "profile" },
    { icon: Heart, label: "Bola profillari", sublabel: undefined, dlg: "children" },
    { icon: Bell, label: "Bildirishnomalar", sublabel: undefined, dlg: "notifications" },
    { icon: Globe, label: "Til", sublabel: "O'zbekcha", dlg: "language" },
  ];

  return (
    <MobileShell>
      <div className="px-5 pt-10 pb-6">
        <h1 className="font-display text-2xl font-semibold">Sozlamalar</h1>
      </div>

      <div className="px-5">
        <div className="bg-card rounded-3xl p-5 shadow-card flex items-center gap-4 mb-5">
          <div className="size-14 rounded-2xl bg-warm/40 flex items-center justify-center text-xl font-display font-semibold text-warm-foreground">
            {me.data?.user.avatarLetter ?? "?"}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{me.data?.user.fullName ?? "Mehmon"}</h2>
            <p className="text-xs text-muted-foreground truncate">{me.data?.user.email ?? ""}</p>
          </div>
        </div>

        <div className="bg-card rounded-3xl shadow-card overflow-hidden">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setDlg(it.dlg)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 border-b last:border-0 border-border text-left"
            >
              <it.icon className="size-5 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium">{it.label}</span>
                {it.sublabel && <span className="block text-xs text-muted-foreground truncate">{it.sublabel}</span>}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {me.data?.user.role === "specialist" && (
          <Link to="/specialist">
            <Button variant="outline" className="w-full h-12 rounded-2xl mt-5">
              Mutaxassis paneliga o'tish
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          disabled={signout.isPending}
          onClick={handleSignout}
          className="w-full h-12 rounded-2xl mt-2 text-destructive"
        >
          {signout.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          Chiqish
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-8">Hearak v0.1 · Yaratilgan mehr bilan 💙</p>
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
          <div className="space-y-2">
            <Label htmlFor="profile-name">To'liq ism</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
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
            <Button type="submit" disabled={update.isPending}>
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
            <p className="text-sm text-muted-foreground py-4 text-center">Hozircha profillar yo'q</p>
          )}
          {children.map((c) => {
            const isActive = child?.id === c.id;
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
                  "w-full flex items-center gap-3 p-3 rounded-2xl border transition-colors text-left",
                  isActive ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/50",
                )}
              >
                <div className="size-12 rounded-2xl bg-warm/40 flex items-center justify-center text-2xl">
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.days} kun · {c.stage}
                  </div>
                </div>
                {isActive && <Check className="size-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Link to="/add-child" onClick={onClose} className="w-full">
            <Button variant="outline" className="w-full">
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
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-muted/50">
              <div className="min-w-0">
                <div className="text-sm font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
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
          <Button onClick={onClose}>Yopish</Button>
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
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-colors text-left",
                  active ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/50",
                )}
              >
                <div>
                  <div className="text-sm font-medium">{o.label}</div>
                  <div className="text-xs text-muted-foreground">{o.hint}</div>
                </div>
                {active && <Check className="size-5 text-primary" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
