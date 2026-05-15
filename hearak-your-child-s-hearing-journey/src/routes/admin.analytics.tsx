import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Repeat } from "lucide-react";
import { AdminShell, StatCard } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/analytics")({ component: AdminAnalytics });

const monthlyRevenue = [
  { m: "Yan", v: 18 }, { m: "Fev", v: 24 }, { m: "Mar", v: 32 },
  { m: "Apr", v: 28 }, { m: "May", v: 38 }, { m: "Iyn", v: 45 },
  { m: "Iyl", v: 41 }, { m: "Avg", v: 52 }, { m: "Sen", v: 48 },
  { m: "Okt", v: 62 }, { m: "Noy", v: 58 }, { m: "Dek", v: 74 },
];

const categoryShare = [
  { name: "Elektronika", pct: 38, color: "bg-[#2f5bff]" },
  { name: "Kurslar",     pct: 24, color: "bg-violet-500" },
  { name: "Kiyim",       pct: 16, color: "bg-rose-500" },
  { name: "Kosmetika",   pct: 12, color: "bg-emerald-500" },
  { name: "Boshqalar",   pct: 10, color: "bg-amber-500" },
];

const topProducts = [
  { name: "Robotics Starter Kit", revenue: "$5,580", growth: "+24%", up: true },
  { name: "Python Programming Masterclass", revenue: "$4,449", growth: "+18%", up: true },
  { name: "Smart soat Series 8 Ultra", revenue: "$3,230", growth: "+12%", up: true },
  { name: "Simsiz quloqchinlar P9 Max", revenue: "$1,875", growth: "-4%", up: false },
  { name: "O'yin konsoli djoystigi PS5", revenue: "$1,620", growth: "+8%", up: true },
];

function AdminAnalytics() {
  const max = Math.max(...monthlyRevenue.map((d) => d.v));
  const points = monthlyRevenue.map((d, i) => {
    const x = (i / (monthlyRevenue.length - 1)) * 100;
    const y = 100 - (d.v / max) * 100;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,100 ${points} 100,100`;

  return (
    <AdminShell pageTitle="Tahlillar">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="O'rtacha buyurtma" value="$127" delta="+5.2%" icon={ShoppingBag} tone="blue" />
        <StatCard label="Yillik tushum" value="$520K" delta="+18.4%" icon={DollarSign} tone="green" />
        <StatCard label="Yangi mijozlar" value="1,842" delta="+24%" icon={Users} tone="violet" />
        <StatCard label="Qaytgan mijozlar" value="68%" delta="+3.1%" icon={Repeat} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Yillik tushum dinamikasi</h3>
              <p className="text-sm text-slate-500">2025 yil oylar bo'yicha (ming $)</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <TrendingUp className="size-4" />
              <span className="text-sm font-semibold">+22.8% YoY</span>
            </div>
          </div>

          <div className="mt-5 relative h-56">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f5bff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2f5bff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#lineFill)" />
              <polyline points={points} fill="none" stroke="#2f5bff" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            {monthlyRevenue.map((d) => <span key={d.m}>{d.m}</span>)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-display text-lg font-bold text-slate-900">Kategoriya ulushi</h3>
          <p className="text-sm text-slate-500">Tushum bo'yicha</p>

          <div className="mt-5 flex justify-center">
            <DonutChart segments={categoryShare} />
          </div>

          <div className="mt-5 space-y-2.5">
            {categoryShare.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <span className={"size-2.5 rounded-full " + c.color} />
                <span className="flex-1 text-slate-700">{c.name}</span>
                <span className="font-semibold text-slate-900">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-display text-lg font-bold text-slate-900">Eng daromadli mahsulotlar</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {topProducts.map((p, i) => (
            <div key={p.name} className="px-5 py-3 flex items-center gap-4">
              <div className="size-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center">
                {i + 1}
              </div>
              <div className="flex-1 font-medium text-slate-900">{p.name}</div>
              <div className="font-bold text-slate-900">{p.revenue}</div>
              <div className={"flex items-center gap-1 text-sm font-semibold w-16 justify-end " + (p.up ? "text-emerald-600" : "text-rose-600")}>
                {p.up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {p.growth}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

function DonutChart({ segments }: { segments: { pct: number; color: string }[] }) {
  const colorMap: Record<string, string> = {
    "bg-[#2f5bff]": "#2f5bff",
    "bg-violet-500": "#8b5cf6",
    "bg-rose-500": "#f43f5e",
    "bg-emerald-500": "#10b981",
    "bg-amber-500": "#f59e0b",
  };
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segments.map((s, i) => {
        const length = (s.pct / 100) * circumference;
        const dasharray = `${length} ${circumference - length}`;
        const dashoffset = -offset;
        offset += length;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={colorMap[s.color] ?? "#94a3b8"}
            strokeWidth="14"
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            pathLength={circumference}
          />
        );
      })}
    </svg>
  );
}
