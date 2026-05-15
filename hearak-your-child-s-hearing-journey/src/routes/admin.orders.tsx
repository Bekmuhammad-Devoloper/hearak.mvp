import { createFileRoute } from "@tanstack/react-router";
import { Search, Download, ChevronRight } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/AdminShell";
import { useState } from "react";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

type OrderStatus = "delivered" | "ontheway" | "cancelled" | "pending";

const orders: { id: string; customer: string; email: string; date: string; items: number; total: string; payment: string; status: OrderStatus }[] = [
  { id: "#MRJ-8492", customer: "Aziz Karimov", email: "aziz@gmail.com", date: "16 Okt, 10:23", items: 3, total: "1 240 000", payment: "Payme", status: "delivered" },
  { id: "#MRJ-9011", customer: "Malika Rasulova", email: "malika.r@gmail.com", date: "18 Okt, 14:30", items: 1, total: "450 000", payment: "Click", status: "ontheway" },
  { id: "#MRJ-7723", customer: "Sherzod Toshev", email: "sherzod.t@mail.uz", date: "12 Okt, 09:15", items: 2, total: "890 000", payment: "Uzum", status: "cancelled" },
  { id: "#MRJ-5501", customer: "Dilnoza Yusupova", email: "dilnoza@gmail.com", date: "05 Okt, 16:45", items: 4, total: "2 100 000", payment: "Payme", status: "delivered" },
  { id: "#MRJ-4310", customer: "Bekzod Olimov", email: "bekzod.o@gmail.com", date: "03 Okt, 11:00", items: 2, total: "320 000", payment: "Bank karta", status: "pending" },
  { id: "#MRJ-4205", customer: "Nilufar Akramova", email: "nilufar.a@gmail.com", date: "02 Okt, 19:22", items: 1, total: "190 000", payment: "Click", status: "delivered" },
  { id: "#MRJ-4099", customer: "Jasur Rakhimov", email: "jasur@mail.uz", date: "01 Okt, 08:40", items: 5, total: "1 580 000", payment: "Payme", status: "ontheway" },
];

const counts = {
  all: orders.length,
  pending: orders.filter((o) => o.status === "pending").length,
  ontheway: orders.filter((o) => o.status === "ontheway").length,
  delivered: orders.filter((o) => o.status === "delivered").length,
  cancelled: orders.filter((o) => o.status === "cancelled").length,
};

function AdminOrders() {
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);

  return (
    <AdminShell pageTitle="Buyurtmalar">
      <div className="grid grid-cols-4 gap-4">
        <MiniStat label="Jami buyurtma" value="1,284" sub="bu oy" />
        <MiniStat label="Kutilmoqda" value={String(counts.pending)} sub="javob talab qilinadi" tone="amber" />
        <MiniStat label="Yo'lda" value={String(counts.ontheway)} sub="yetkazib berilmoqda" tone="blue" />
        <MiniStat label="Yetkazildi" value={String(counts.delivered)} sub="muvaffaqiyatli" tone="green" />
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-100">
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            {([
              ["all", "Barchasi", counts.all],
              ["pending", "Kutilmoqda", counts.pending],
              ["ontheway", "Yo'lda", counts.ontheway],
              ["delivered", "Yetkazildi", counts.delivered],
              ["cancelled", "Bekor", counts.cancelled],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                  (tab === key ? "bg-[#eaf0ff] text-[#2f5bff]" : "text-slate-600 hover:bg-slate-50")
                }
              >
                {label} <span className="ml-1 text-xs opacity-70">{count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="ID yoki mijoz..."
                className="w-56 h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-[#2f5bff]"
              />
            </div>
            <button className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50">
              <Download className="size-4" /> Eksport
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="py-3 px-5 font-semibold">Buyurtma</th>
              <th className="py-3 px-5 font-semibold">Mijoz</th>
              <th className="py-3 px-5 font-semibold">Sana</th>
              <th className="py-3 px-5 font-semibold">Mahsulot</th>
              <th className="py-3 px-5 font-semibold">To'lov</th>
              <th className="py-3 px-5 font-semibold">Summa</th>
              <th className="py-3 px-5 font-semibold">Holat</th>
              <th className="py-3 px-5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer">
                <td className="py-3 px-5 font-semibold text-slate-900 text-sm">{o.id}</td>
                <td className="py-3 px-5">
                  <div className="text-sm font-medium text-slate-900">{o.customer}</div>
                  <div className="text-xs text-slate-500">{o.email}</div>
                </td>
                <td className="py-3 px-5 text-sm text-slate-500">{o.date}</td>
                <td className="py-3 px-5 text-sm text-slate-700">{o.items} ta</td>
                <td className="py-3 px-5 text-sm text-slate-700">{o.payment}</td>
                <td className="py-3 px-5 font-semibold text-slate-900 text-sm">{o.total} so'm</td>
                <td className="py-3 px-5"><StatusBadge status={o.status} /></td>
                <td className="py-3 px-5 text-right">
                  <ChevronRight className="size-4 text-slate-400 inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function MiniStat({ label, value, sub, tone = "slate" }: { label: string; value: string; sub: string; tone?: "slate" | "amber" | "blue" | "green" }) {
  const tones = {
    slate: "text-slate-900",
    amber: "text-amber-600",
    blue: "text-[#2f5bff]",
    green: "text-emerald-600",
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={"font-display text-2xl font-bold mt-1 " + tones[tone]}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}
