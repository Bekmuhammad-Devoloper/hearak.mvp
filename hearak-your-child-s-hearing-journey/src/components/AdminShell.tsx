import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  GraduationCap,
  Tag,
  BarChart3,
  Bell,
  Search,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Asosiy",
    items: [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/analytics", icon: BarChart3, label: "Tahlillar" },
    ],
  },
  {
    title: "Savdo",
    items: [
      { to: "/admin/products", icon: Package, label: "Mahsulotlar" },
      { to: "/admin/orders", icon: ShoppingBag, label: "Buyurtmalar" },
      { to: "/admin/categories", icon: Tag, label: "Kategoriyalar" },
    ],
  },
  {
    title: "Foydalanuvchilar",
    items: [
      { to: "/admin/users", icon: Users, label: "Mijozlar" },
      { to: "/admin/courses", icon: GraduationCap, label: "Kurslar" },
    ],
  },
];

export function AdminShell({ children, pageTitle }: { children: React.ReactNode; pageTitle: string }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      <aside className="w-[260px] shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[#2f5bff] to-violet-500 text-white font-bold flex items-center justify-center">
              M
            </div>
            <div>
              <div className="font-display font-bold text-slate-900 leading-none">Marja</div>
              <div className="text-[11px] text-slate-500">Admin panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((g) => (
            <div key={g.title}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
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
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-[#eaf0ff] text-[#2f5bff]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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

        <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Settings className="size-4" /> Sozlamalar
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50">
            <LogOut className="size-4" /> Chiqish
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-display text-xl font-bold text-slate-900">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Qidirish..."
                className="w-72 h-10 pl-9 pr-3 rounded-xl bg-slate-100 border-0 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#2f5bff]/20"
              />
            </div>
            <button className="size-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center relative">
              <Bell className="size-5 text-slate-700" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500" />
            </button>
            <button className="flex items-center gap-2 pl-2 pr-3 h-10 rounded-xl hover:bg-slate-100">
              <div className="size-7 rounded-full bg-gradient-to-br from-[#2f5bff] to-violet-500 text-white font-bold text-xs flex items-center justify-center">
                BD
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-900 leading-none">Bekmuhammad</div>
                <div className="text-[10px] text-slate-500">Super admin</div>
              </div>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: typeof Bell;
  tone?: "blue" | "green" | "violet" | "amber";
}) {
  const tones = {
    blue: "bg-[#eaf0ff] text-[#2f5bff]",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="flex items-start justify-between">
        <div className={"size-11 rounded-xl flex items-center justify-center " + tones[tone]}>
          <Icon className="size-5" />
        </div>
        {delta && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="font-display text-2xl font-bold text-slate-900 mt-1">{value}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "delivered" | "ontheway" | "cancelled" | "pending" | "active" | "draft" | "archived" }) {
  const map = {
    delivered:  { label: "Yetkazildi",   cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    ontheway:   { label: "Yo'lda",       cls: "bg-[#eaf0ff] text-[#2f5bff] border-[#cdd9ff]" },
    cancelled:  { label: "Bekor",        cls: "bg-rose-50 text-rose-600 border-rose-200" },
    pending:    { label: "Kutilmoqda",   cls: "bg-amber-50 text-amber-600 border-amber-200" },
    active:     { label: "Faol",         cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    draft:      { label: "Qoralama",     cls: "bg-slate-100 text-slate-600 border-slate-200" },
    archived:   { label: "Arxivlangan",  cls: "bg-rose-50 text-rose-600 border-rose-200" },
  } as const;
  const s = map[status];
  return (
    <span className={"inline-flex items-center text-[11px] font-semibold border px-2 py-0.5 rounded-full " + s.cls}>
      {s.label}
    </span>
  );
}
