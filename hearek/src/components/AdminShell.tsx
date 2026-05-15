import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Baby,
  ClipboardCheck,
  Gamepad2,
  ListTodo,
  BarChart3,
  Bell,
  Megaphone,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-icons";
import { useMe } from "@/lib/queries";
import { setToken } from "@/lib/api";

const navGroups = [
  {
    title: "Asosiy",
    items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/analytics", icon: BarChart3, label: "Tahlillar" },
    ],
  },
  {
    title: "Foydalanuvchilar",
    items: [
      { to: "/admin/specialists", icon: Stethoscope, label: "Mutaxassislar" },
      { to: "/admin/parents", icon: Users, label: "Ota-onalar" },
      { to: "/admin/children", icon: Baby, label: "Bolalar" },
    ],
  },
  {
    title: "Kontent",
    items: [
      { to: "/admin/diagnostics", icon: ClipboardCheck, label: "Diagnostika" },
      { to: "/admin/content", icon: Gamepad2, label: "Mashqlar va o'yinlar" },
      { to: "/admin/assignments", icon: ListTodo, label: "Topshiriqlar" },
    ],
  },
  {
    title: "Habarlar",
    items: [
      { to: "/admin/notifications", icon: Megaphone, label: "Bildirishnomalar" },
    ],
  },
];

export function AdminShell({ children, pageTitle, pageDescription }: { children: React.ReactNode; pageTitle: string; pageDescription?: string }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { data: me, isLoading: meLoading, isError: meError } = useMe();

  if (meLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (meError || !me) {
    return <AccessDenied reason="login" />;
  }

  if (me.user.role !== "admin") {
    return <AccessDenied reason="role" actualRole={me.user.role} userName={me.user.fullName} />;
  }

  const user = me.user;

  function handleLogout() {
    setToken(null);
    nav({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="w-[260px] shrink-0 bg-surface-elevated border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <BrandLogo className="size-10 shrink-0" haloed={false} />
            <div>
              <div className="font-display font-bold text-foreground leading-none text-lg">Hearak</div>
              <div className="text-[11px] text-muted-foreground">Admin panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((g) => (
            <div key={g.title}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                {g.title}
              </div>
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const active = loc.pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-soft text-primary"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface">
            <Settings className="size-4" /> Sozlamalar
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive-soft">
            <LogOut className="size-4" /> Chiqish
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-surface-elevated border-b border-border px-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground leading-none">{pageTitle}</h1>
            {pageDescription && <p className="text-xs text-muted-foreground mt-1">{pageDescription}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Qidirish..."
                className="w-72 h-10 pl-9 pr-3 rounded-xl bg-surface border-0 text-sm outline-none focus:bg-surface-elevated focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <button className="size-10 rounded-xl bg-surface hover:bg-muted flex items-center justify-center relative">
              <Bell className="size-5 text-foreground" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-warm" />
            </button>
            <button className="flex items-center gap-2 pl-2 pr-3 h-10 rounded-xl hover:bg-surface">
              <div className="size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                {user.avatarLetter}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-foreground leading-none">{user.fullName}</div>
                <div className="text-[10px] text-muted-foreground">{user.title ?? "Super admin"}</div>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function AccessDenied({ reason, actualRole, userName }: { reason: "login" | "role"; actualRole?: string; userName?: string }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 shadow-card text-center">
        <div className="size-16 rounded-2xl bg-destructive-soft text-destructive inline-flex items-center justify-center">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mt-5">
          {reason === "login" ? "Tizimga kirish kerak" : "Ruxsat berilmadi"}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
          {reason === "login" ? (
            <>Admin paneliga kirish uchun avval admin akkaunt bilan tizimga kiring.</>
          ) : (
            <>
              <span className="font-medium text-foreground">{userName}</span>{" "}
              ({actualRole}) sifatida kirgansiz, lekin bu sahifa faqat <strong className="text-foreground">admin</strong> rolidagi foydalanuvchilar uchun.
            </>
          )}
        </p>
        <div className="mt-6 flex gap-2">
          <Link
            to="/admin/login"
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center justify-center"
            onClick={() => setToken(null)}
          >
            Admin panelga kirish
          </Link>
          <Link
            to="/"
            className="flex-1 h-11 rounded-xl border border-border text-foreground font-semibold inline-flex items-center justify-center"
          >
            Asosiy sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: typeof Bell;
  tone?: "primary" | "success" | "warm" | "accent";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warm:    "bg-warm-soft text-warm-foreground",
    accent:  "bg-accent-soft text-accent-foreground",
  };
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
      <div className="flex items-start justify-between">
        <div className={"size-11 rounded-xl flex items-center justify-center " + tones[tone]}>
          <Icon className="size-5" />
        </div>
        {delta && (
          <span className="text-xs font-semibold text-success bg-success-soft px-2 py-1 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-bold text-foreground mt-1">{value}</div>
      </div>
    </div>
  );
}

export function Skeleton({ className = "h-24" }: { className?: string }) {
  return <div className={"rounded-2xl bg-surface animate-pulse " + className} />;
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: typeof Bell }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-card">
      <div className="size-14 rounded-2xl bg-primary-soft text-primary inline-flex items-center justify-center">
        <Icon className="size-7" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral" | "primary";
  children: React.ReactNode;
}) {
  const map = {
    success: "bg-success-soft text-success border-success/20",
    warning: "bg-warm-soft text-warm-foreground border-warm/30",
    danger:  "bg-destructive-soft text-destructive border-destructive/20",
    neutral: "bg-surface text-muted-foreground border-border",
    primary: "bg-primary-soft text-primary border-primary/20",
  };
  return (
    <span className={"inline-flex items-center text-[11px] font-semibold border px-2 py-0.5 rounded-full " + map[tone]}>
      {children}
    </span>
  );
}
