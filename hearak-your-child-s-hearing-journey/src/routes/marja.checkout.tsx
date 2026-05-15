import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin, CreditCard } from "lucide-react";
import { PhoneStatusBar } from "@/components/MarjaShell";
import { useState } from "react";

export const Route = createFileRoute("/marja/checkout")({ component: CheckoutPage });

const methods = [
  { id: "click", label: "Click", short: "CL", color: "bg-[#2f5bff]" },
  { id: "payme", label: "Payme", short: "PM", color: "bg-emerald-500" },
  { id: "uzum", label: "Uzum", short: "UZ", color: "bg-violet-500" },
  { id: "bank", label: "Bank Karta", short: "", color: "bg-slate-900", icon: true },
];

function CheckoutPage() {
  const nav = useNavigate();
  const [method, setMethod] = useState("payme");

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex justify-center">
      <div className="w-full max-w-[420px] flex flex-col min-h-screen bg-[#f5f7fb] relative">
        <PhoneStatusBar />

        <header className="flex items-center justify-between px-5 py-3 bg-white">
          <button onClick={() => nav({ to: "/marja/cart" })} className="size-9 flex items-center justify-center">
            <ArrowLeft className="size-5 text-slate-800" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">To'lov</h1>
          <div className="size-9" />
        </header>

        <div className="px-5 pt-4 space-y-4 pb-[260px]">
          <section className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Yetkazib berish manzili</h3>
              <button className="text-sm font-medium text-[#2f5bff]">Tahrirlash</button>
            </div>
            <div className="mt-3 bg-slate-50 rounded-xl p-3 flex gap-3">
              <div className="size-10 rounded-full bg-[#eaf0ff] flex items-center justify-center shrink-0">
                <MapPin className="size-5 text-[#2f5bff]" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Uy</div>
                <div className="text-sm text-slate-500 leading-snug">
                  Amir Temur ko'chasi, 15-uy, 42-xonadon<br />
                  Toshkent, O'zbekiston, 100000
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-slate-900">To'lov usuli</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {methods.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={
                      "rounded-2xl p-4 flex flex-col items-center gap-2 border transition-all " +
                      (active ? "border-[#2f5bff] bg-[#f5f8ff] shadow-sm" : "border-slate-200 bg-white")
                    }
                  >
                    <div className={"size-10 rounded-full text-white flex items-center justify-center font-bold text-sm " + m.color}>
                      {m.icon ? <CreditCard className="size-5" /> : m.short}
                    </div>
                    <span className={"text-sm font-medium " + (active ? "text-slate-900" : "text-slate-700")}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-4">
            <h3 className="font-bold text-slate-900">Buyurtma tafsilotlari</h3>
            <div className="mt-3 divide-y divide-slate-100">
              <OrderRow emoji="🐍" bg="bg-slate-900" title="Python Programming Mastercl..." sub="1 x $49.99" price="$49.99" />
              <OrderRow emoji="📚" bg="bg-slate-100" title="Advanced Mathematics Bundle" sub="1 x $85.00" price="$85.00" />
              <OrderRow emoji="📓" bg="bg-amber-100" title="Marja Branded Notebook" sub="2 x $12.50" price="$25.00" hidden />
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-slate-100 px-5 pt-4 pb-5 rounded-t-2xl">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Oraliq jami</span>
            <span className="text-slate-900 font-medium">$159.99</span>
          </div>
          <div className="flex justify-between text-sm mt-1.5">
            <span className="text-slate-600">Yetkazib berish</span>
            <span className="text-emerald-600 font-semibold">Bepul</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-lg font-bold text-slate-900">Jami</span>
            <span className="text-lg font-bold text-slate-900">$159.99</span>
          </div>
          <button
            onClick={() => nav({ to: "/marja/order-success" })}
            className="mt-3 w-full h-12 rounded-full bg-[#2f5bff] text-white font-semibold"
          >
            To'lash
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ emoji, bg, title, sub, price, hidden }: { emoji: string; bg: string; title: string; sub: string; price: string; hidden?: boolean }) {
  return (
    <div className={"py-3 flex items-center gap-3 " + (hidden ? "opacity-50" : "")}>
      <div className={"size-12 rounded-xl flex items-center justify-center text-2xl shrink-0 " + bg}>{emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 text-sm truncate">{title}</div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
      <div className="font-bold text-slate-900 text-sm">{price}</div>
    </div>
  );
}
