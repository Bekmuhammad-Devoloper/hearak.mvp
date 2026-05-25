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
  RefreshCw,
  Menu,
  X,
} from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-icons";
import { Avatar } from "@/components/Avatar";
import { useMe } from "@/lib/queries";
import { setToken } from "@/lib/api";
import { useLocale, useT, type DictKey, type Locale } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Admin sahifalarning sarlavhadagi global qidiruv bilan integratsiyasi uchun
 * context. Sahifa mountdaagi `useAdminSearch()` orqali joriy qidiruv qiymatini
 * o'qiydi va sahifa-mahalliy filtr qo'llaydi.
 */
type SearchCtx = { query: string; setQuery: (s: string) => void };
const AdminSearchContext = createContext<SearchCtx>({ query: "", setQuery: () => {} });
export function useAdminSearch() {
  return useContext(AdminSearchContext);
}

// Sidebar bo'limlari — `titleKey` va `labelKey` i18n kalitlari, render paytida
// `useT()` orqali tarjima qilinadi. Admin'da til o'zgartirilsa avtomatik
// yangilanadi.
const navGroups: Array<{
  titleKey: DictKey;
  items: Array<{ to: string; icon: typeof LayoutDashboard; labelKey: DictKey }>;
}> = [
  {
    titleKey: "adminGroupMain",
    items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, labelKey: "adminDashboard" },
      { to: "/admin/analytics", icon: BarChart3, labelKey: "adminAnalytics" },
    ],
  },
  {
    titleKey: "adminGroupUsers",
    items: [
      { to: "/admin/specialists", icon: Stethoscope, labelKey: "adminSpecialists" },
      { to: "/admin/parents", icon: Users, labelKey: "adminParents" },
      { to: "/admin/children", icon: Baby, labelKey: "adminChildrenNav" },
    ],
  },
  {
    titleKey: "adminGroupContent",
    items: [
      { to: "/admin/diagnostics", icon: ClipboardCheck, labelKey: "adminDiagnostics" },
      { to: "/admin/content", icon: Gamepad2, labelKey: "adminContent" },
      { to: "/admin/assignments", icon: ListTodo, labelKey: "adminAssignments" },
    ],
  },
  {
    titleKey: "adminGroupMessages",
    items: [
      { to: "/admin/notifications", icon: Megaphone, labelKey: "adminNotifications" },
    ],
  },
];

export function AdminShell({ children, pageTitle, pageDescription }: { children: React.ReactNode; pageTitle: string; pageDescription?: string }) {
  const loc = useLocation();
  const nav = useNavigate();
  const t = useT();
  const { data: me, isLoading: meLoading, isError: meError } = useMe();
  const [searchQuery, setSearchQuery] = useState("");
  const adminFetching = useIsFetching({ queryKey: ["admin"] });
  const qc = useQueryClient();
  const [lastSync, setLastSync] = useState<Date>(() => new Date());
  const [, setTick] = useState(0);

  // Oxirgi muvaffaqiyatli fetch tugagan paytni belgilab boramiz — vizualda
  // "oxirgi yangilanish" matnini ko'rsatamiz.
  useEffect(() => {
    if (adminFetching === 0) setLastSync(new Date());
  }, [adminFetching]);

  // Har 10 sekundda "X soniya/minut oldin" matnini qayta hisoblash uchun.
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  // Mobil sidebar (drawer) — telefon variantida ochilib yopiladi.
  const [mobileOpen, setMobileOpen] = useState(false);
  // Sahifa o'zgarsa, mobile drawer'ni yopib qo'yamiz.
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);

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
      {/* Mobil drawer fon — bosgan paytda yopiladi */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Yopish"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}
      <aside
        className={cn(
          "bg-surface-elevated border-r border-border flex flex-col",
          // Desktop: doimo ko'rinadi, sticky
          "lg:w-[260px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          // Mobile: drawer — chetdan chiqadi
          "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-5 py-5 border-b border-border">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <BrandLogo className="size-10 shrink-0" haloed={false} />
            <div>
              <div className="font-display font-bold text-foreground leading-none text-lg">Nutq yo'li</div>
              <div className="text-[11px] text-muted-foreground">{t("adminPanel")}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((g) => (
            <div key={g.titleKey}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                {t(g.titleKey)}
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
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border space-y-0.5">
          <Link
            to="/admin/settings"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface no-underline [&.active]:bg-primary-soft [&.active]:text-primary"
            activeProps={{ className: "bg-primary-soft text-primary" }}
          >
            <Settings className="size-4" /> {t("adminSettings")}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive-soft">
            <LogOut className="size-4" /> {t("adminLogout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-surface-elevated border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menyu"
              className="lg:hidden size-10 rounded-xl bg-surface hover:bg-muted flex items-center justify-center shrink-0"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-xl font-bold text-foreground leading-none truncate">{pageTitle}</h1>
              {pageDescription && <p className="hidden sm:block text-xs text-muted-foreground mt-1 truncate">{pageDescription}</p>}
            </div>
            <LiveStatusI18n fetching={adminFetching > 0} lastSync={lastSync} onRefresh={refresh} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative hidden md:block">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("adminSearch")}
                className="w-72 h-10 pl-9 pr-3 rounded-xl bg-surface border-0 text-sm outline-none focus:bg-surface-elevated focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <Link
              to="/admin/notifications"
              aria-label="Bildirishnomalar"
              className="size-10 rounded-xl bg-surface hover:bg-muted flex items-center justify-center relative no-underline"
            >
              <Bell className="size-5 text-foreground" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-warm" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 pl-1 pr-1 sm:pl-2 sm:pr-3 h-10 rounded-xl hover:bg-surface outline-none focus-ring">
                <Avatar
                  src={user.avatarUrl}
                  fallback={user.avatarLetter}
                  rounded="rounded-full"
                  bg="bg-primary"
                  fg="text-primary-foreground"
                  className="size-7 text-xs"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-foreground leading-none">{user.fullName}</div>
                  <div className="text-[10px] text-muted-foreground">{user.title ?? t("adminSuperAdmin")}</div>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav({ to: "/admin/settings" })}>
                  <Settings className="size-4 mr-2" /> {t("adminSettings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/admin/notifications" })}>
                  <Bell className="size-4 mr-2" /> {t("adminNotifications")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="size-4 mr-2" /> {t("adminLogout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <AdminSearchContext.Provider value={{ query: searchQuery, setQuery: setSearchQuery }}>
            {children}
          </AdminSearchContext.Provider>
        </main>
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

/**
 * Live sync indikator — har 20 sekundda admin'ga ko'rsatadi:
 *  • Yashil pulsatsiya: hozir yangilanmoqda (fetching)
 *  • Yashil to'liq: jonli, oxirgi yangilanish "X soniya oldin"
 *  • Refresh tugmasi: foydalanuvchi qo'lda yangilashi mumkin
 */
/** Til-aware versiyasi — LiveStatus'ning yangi ko'rinishi. */
function LiveStatusI18n({
  fetching,
  lastSync,
  onRefresh,
}: {
  fetching: boolean;
  lastSync: Date;
  onRefresh: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const ago = relativeShort(Date.now() - lastSync.getTime(), locale, t);
  return (
    <div className="hidden md:flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 border border-border">
      <span className="relative inline-flex size-2">
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            fetching ? "bg-success animate-ping" : "bg-success",
          )}
        />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span className="text-[11px] font-semibold text-foreground">{t("adminLive")}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">· {ago}</span>
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh"
        className="ml-1 grid size-6 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className={cn("size-3", fetching && "animate-spin")} />
      </button>
    </div>
  );
}

function relativeShort(ms: number, locale: Locale, t: (k: DictKey) => string): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 5) return t("adminJustNow");
  // Intl.RelativeTimeFormat — uz va ru uchun avtomatik to'g'ri shaklda
  try {
    const rtf = new Intl.RelativeTimeFormat(locale === "ru" ? "ru" : "uz", { numeric: "auto" });
    if (s < 60) return rtf.format(-s, "second");
    const m = Math.floor(s / 60);
    if (m < 60) return rtf.format(-m, "minute");
    const h = Math.floor(m / 60);
    return rtf.format(-h, "hour");
  } catch {
    // Eski brauzerlarda — sodda fallback
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  }
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
