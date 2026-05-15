import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, ArrowUpRight } from "lucide-react";
import { AdminShell, StatCard, StatusBadge } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

const recentOrders = [
  { id: "#MRJ-8492", customer: "Aziz Karimov", date: "16 Okt, 10:23", total: "1 240 000", status: "delivered" as const },
  { id: "#MRJ-9011", customer: "Malika Rasulova", date: "18 Okt, 14:30", total: "450 000", status: "ontheway" as const },
  { id: "#MRJ-7723", customer: "Sherzod Toshev", date: "12 Okt, 09:15", total: "890 000", status: "cancelled" as const },
  { id: "#MRJ-5501", customer: "Dilnoza Yusupova", date: "05 Okt, 16:45", total: "2 100 000", status: "delivered" as const },
  { id: "#MRJ-4310", customer: "Bekzod Olimov", date: "03 Okt, 11:00", total: "320 000", status: "pending" as const },
];

const chartData = [
  { day: "Du", v: 38 }, { day: "Se", v: 52 }, { day: "Chr", v: 41 },
  { day: "Pa", v: 67 }, { day: "Ju", v: 58 }, { day: "Sh", v: 82 }, { day: "Ya", v: 73 },
];

const topProducts = [
  { name: "Robotics Starter Kit", sold: 124, revenue: "$5 580", emoji: "🤖", bg: "bg-slate-800" },
  { name: "Python Programming Masterclass", sold: 89, revenue: "$4 449", emoji: "🐍", bg: "bg-slate-900" },
  { name: "Smart soat Series 8 Ultra", sold: 67, revenue: "$3 230", emoji: "⌚", bg: "bg-slate-200" },
  { name: "Simsiz quloqchinlar P9 Max", sold: 54, revenue: "$1 875", emoji: "🎧", bg: "bg-orange-100" },
];

function AdminDashboard() {
  const max = Math.max(...chartData.map((d) => d.v));
  return (
    <AdminShell pageTitle="Dashboard">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Bu oydagi tushum" value="$48,245" delta="+12.5%" icon={DollarSign} tone="blue" />
        <StatCard label="Buyurtmalar" value="1,284" delta="+8.2%" icon={ShoppingBag} tone="green" />
        <StatCard label="Yangi mijozlar" value="342" delta="+24%" icon={Users} tone="violet" />
        <StatCard label="Sotuvdagi mahsulot" value="186" delta="+5" icon={Package} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Haftalik tushum</h3>
              <p className="text-sm text-slate-500">Oxirgi 7 kun</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <TrendingUp className="size-4" />
              <span className="text-sm font-semibold">+18.4%</span>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-4 h-48">
            {chartData.map((d) => {
              const h = (d.v / max) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end h-full">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#2f5bff] to-[#7da3ff] transition-all"
                      style={{ height: h + "%" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-display text-lg font-bold text-slate-900">Eng ko'p sotilgan</h3>
          <div className="mt-4 space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className={"size-10 rounded-xl flex items-center justify-center text-xl shrink-0 " + p.bg}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.sold} dona sotildi</div>
                </div>
                <div className="text-sm font-bold text-slate-900">{p.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-100">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-display text-lg font-bold text-slate-900">So'nggi buyurtmalar</h3>
          <Link to="/admin/orders" className="text-sm font-semibold text-[#2f5bff] inline-flex items-center gap-1">
            Barchasi <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="py-3 px-5 font-semibold">ID</th>
              <th className="py-3 px-5 font-semibold">Mijoz</th>
              <th className="py-3 px-5 font-semibold">Sana</th>
              <th className="py-3 px-5 font-semibold">Summa</th>
              <th className="py-3 px-5 font-semibold">Holat</th>
              <th className="py-3 px-5" />
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="py-3 px-5 font-semibold text-slate-900 text-sm">{o.id}</td>
                <td className="py-3 px-5 text-slate-700 text-sm">{o.customer}</td>
                <td className="py-3 px-5 text-slate-500 text-sm">{o.date}</td>
                <td className="py-3 px-5 font-semibold text-slate-900 text-sm">{o.total} so'm</td>
                <td className="py-3 px-5"><StatusBadge status={o.status} /></td>
                <td className="py-3 px-5 text-right">
                  <button className="text-sm font-semibold text-[#2f5bff]">Ko'rish</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
