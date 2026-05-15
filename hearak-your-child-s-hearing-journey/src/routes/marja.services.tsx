import { createFileRoute } from "@tanstack/react-router";
import { Truck, Headphones, FileText, Wallet, Gift, HelpCircle, ChevronRight } from "lucide-react";
import { MarjaShell, PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/services")({ component: ServicesPage });

const services = [
  { icon: Truck, title: "Yetkazib berish", desc: "Kuzatish va manzillar", color: "bg-[#eaf0ff] text-[#2f5bff]" },
  { icon: Wallet, title: "To'lov usullari", desc: "Kartalar va hamyonlar", color: "bg-emerald-50 text-emerald-600" },
  { icon: FileText, title: "Hujjatlar", desc: "Cheklar va shartnomalar", color: "bg-amber-50 text-amber-600" },
  { icon: Gift, title: "Promokodlar", desc: "Chegirma va aksiyalar", color: "bg-rose-50 text-rose-600" },
  { icon: Headphones, title: "Qo'llab-quvvatlash", desc: "24/7 yordam", color: "bg-violet-50 text-violet-600" },
  { icon: HelpCircle, title: "Yordam markazi", desc: "FAQ va qo'llanmalar", color: "bg-slate-100 text-slate-700" },
];

function ServicesPage() {
  return (
    <MarjaShell>
      <PhoneStatusBar />
      <div className="px-5 pt-5">
        <h1 className="font-display text-2xl font-bold text-slate-900">Xizmatlar</h1>
        <p className="text-slate-500 text-sm mt-1">Sizga kerakli barcha imkoniyatlar</p>
      </div>

      <div className="px-5 pt-4 space-y-2">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.title} className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 text-left">
              <div className={"size-11 rounded-xl flex items-center justify-center " + s.color}>
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{s.title}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </button>
          );
        })}
      </div>
    </MarjaShell>
  );
}
