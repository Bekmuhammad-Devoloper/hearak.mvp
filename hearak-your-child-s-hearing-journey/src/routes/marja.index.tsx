import { createFileRoute, Link } from "@tanstack/react-router";
import { Store, ShoppingCart, CreditCard, CheckCircle, Receipt, Package } from "lucide-react";
import { MarjaShell, PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/")({ component: MarjaHome });

const screens = [
  { to: "/marja/market", icon: Store, title: "Marja Market", desc: "Tavsiya etilgan mahsulotlar" },
  { to: "/marja/product/$id", params: { id: "robotics" }, icon: Package, title: "Mahsulot sahifasi", desc: "Robotics Starter Kit" },
  { to: "/marja/cart", icon: ShoppingCart, title: "Savat", desc: "Tanlangan mahsulotlar" },
  { to: "/marja/checkout", icon: CreditCard, title: "To'lov", desc: "Manzil va to'lov usuli" },
  { to: "/marja/order-success", icon: CheckCircle, title: "Muvaffaqiyatli", desc: "Buyurtma tasdiqlandi" },
  { to: "/marja/orders", icon: Receipt, title: "Buyurtmalar tarixi", desc: "Barcha buyurtmalar" },
];

function MarjaHome() {
  return (
    <MarjaShell>
      <PhoneStatusBar />
      <div className="px-5 pt-5 pb-3">
        <h1 className="font-display text-3xl font-bold text-slate-900">Salom 👋</h1>
        <p className="text-slate-500 mt-1">Marja Market mobil ilovasi</p>
      </div>

      <div className="px-5 pt-3 pb-6 space-y-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#2f5bff] to-[#1e3fb8] text-white p-5">
          <div className="text-sm opacity-80">Bu hafta tushum</div>
          <div className="font-display text-3xl font-bold mt-1">$1,240</div>
          <div className="mt-3 inline-flex items-center gap-1 text-xs bg-white/20 rounded-full px-2.5 py-1">
            +12.5% o'tgan haftaga nisbatan
          </div>
        </div>

        <h2 className="font-display text-lg font-bold text-slate-900 pt-2">Ekranlar</h2>

        {screens.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.to + (s.params?.id ?? "")}
              to={s.to as any}
              params={s.params as any}
              className="bg-white rounded-2xl p-4 flex items-center gap-3 active:scale-[.98] transition-transform"
            >
              <div className="size-11 rounded-xl bg-[#eaf0ff] flex items-center justify-center">
                <Icon className="size-5 text-[#2f5bff]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{s.title}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
              <div className="text-slate-400">›</div>
            </Link>
          );
        })}
      </div>
    </MarjaShell>
  );
}
