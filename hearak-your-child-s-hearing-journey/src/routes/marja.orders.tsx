import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarjaShell, PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/orders")({ component: OrdersPage });

type Status = "delivered" | "ontheway" | "cancelled";

const orders: { id: string; date: string; count: string; total: string; status: Status }[] = [
  { id: "#MRJ-8492", date: "16 Oktyabr, 10:23", count: "3 ta mahsulot", total: "1 240 000 so'm", status: "delivered" },
  { id: "#MRJ-9011", date: "18 Oktyabr, 14:30", count: "1 ta mahsulot", total: "450 000 so'm", status: "ontheway" },
  { id: "#MRJ-7723", date: "12 Oktyabr, 09:15", count: "2 ta mahsulot", total: "890 000 so'm", status: "cancelled" },
  { id: "#MRJ-5501", date: "05 Sentyabr, 16:45", count: "4 ta mahsulot", total: "2 100 000 so'm", status: "delivered" },
];

const statusMap: Record<Status, { label: string; cls: string }> = {
  delivered: { label: "Yetkazildi", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  ontheway: { label: "Yo'lda", cls: "bg-[#eaf0ff] text-[#2f5bff] border-[#cdd9ff]" },
  cancelled: { label: "Bekor qilindi", cls: "bg-rose-50 text-rose-600 border-rose-200" },
};

function OrdersPage() {
  const nav = useNavigate();
  return (
    <MarjaShell>
      <PhoneStatusBar />

      <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-100">
        <button onClick={() => nav({ to: "/marja/profile" })} className="size-9 rounded-full bg-slate-100 flex items-center justify-center">
          <ArrowLeft className="size-5 text-slate-800" />
        </button>
        <h1 className="text-[17px] font-bold text-slate-900">Buyurtmalar tarixi</h1>
      </header>

      <div className="px-5 pt-4 space-y-3 pb-6">
        {orders.map((o) => {
          const s = statusMap[o.status];
          return (
            <div key={o.id} className="bg-white rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900">ID: {o.id}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{o.date}</div>
                </div>
                <span className={"text-[11px] font-semibold border px-2.5 py-1 rounded-full " + s.cls}>{s.label}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-start justify-between">
                <div>
                  <div className="text-[11px] text-slate-500">Mahsulotlar</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">{o.count}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Jami summa</div>
                  <div className="text-sm font-bold text-[#2f5bff] mt-0.5">{o.total}</div>
                </div>
              </div>

              <button className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2f5bff]">
                Batafsil <ArrowRight className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </MarjaShell>
  );
}
