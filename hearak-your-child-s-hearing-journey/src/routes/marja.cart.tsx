import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2, Minus, Plus, Tag } from "lucide-react";
import { PhoneStatusBar } from "@/components/MarjaShell";
import { useState } from "react";

export const Route = createFileRoute("/marja/cart")({ component: CartPage });

type Item = { id: string; title: string; subtitle: string; price: number; qty: number; emoji: string; bg: string };

function CartPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<Item[]>([
    { id: "py", title: "Python Programming Masterclass", subtitle: "Online Course", price: 49.99, qty: 1, emoji: "🐍", bg: "bg-slate-900" },
    { id: "math", title: "Advanced Mathematics Bundle", subtitle: "Books & Materials", price: 85.0, qty: 1, emoji: "📚", bg: "bg-slate-100" },
    { id: "notebook", title: "Marja Branded Notebook", subtitle: "Stationery", price: 12.5, qty: 2, emoji: "📓", bg: "bg-amber-100" },
  ]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  function setQty(id: string, delta: number) {
    setItems((arr) =>
      arr
        .map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
        .filter((it) => it.qty > 0)
    );
  }

  function remove(id: string) {
    setItems((arr) => arr.filter((it) => it.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex justify-center">
      <div className="w-full max-w-[420px] flex flex-col min-h-screen bg-[#f5f7fb] relative">
        <PhoneStatusBar />

        <header className="flex items-center justify-between px-5 py-3 bg-white">
          <button onClick={() => nav({ to: "/marja/market" })} className="size-9 flex items-center justify-center">
            <ArrowLeft className="size-5 text-slate-800" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">Savat</h1>
          <div className="size-9" />
        </header>

        <div className="px-5 pt-4 space-y-3 pb-[280px]">
          {items.map((it) => (
            <div key={it.id} className="bg-white rounded-2xl p-3 flex gap-3 items-start">
              <div className={"size-20 rounded-xl flex items-center justify-center text-4xl shrink-0 " + it.bg}>
                {it.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 text-[15px] leading-tight">{it.title}</h3>
                  <button onClick={() => remove(it.id)} className="text-slate-400 shrink-0">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{it.subtitle}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[#2f5bff] font-bold">${it.price.toFixed(2)}</span>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full">
                    <button onClick={() => setQty(it.id, -1)} className="size-7 rounded-full flex items-center justify-center text-slate-600">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="text-sm font-semibold min-w-[18px] text-center">{it.qty}</span>
                    <button onClick={() => setQty(it.id, 1)} className="size-7 rounded-full bg-[#2f5bff] text-white flex items-center justify-center">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <label className="text-sm font-semibold text-slate-900">Promo kod</label>
            <div className="mt-2 flex gap-2">
              <div className="flex-1 bg-white border border-slate-200 rounded-full px-4 flex items-center gap-2">
                <Tag className="size-4 text-slate-400" />
                <input
                  placeholder="Promokodni kiriting"
                  className="flex-1 bg-transparent outline-none py-3 text-sm placeholder:text-slate-400"
                />
              </div>
              <button className="px-5 rounded-full bg-slate-900 text-white text-sm font-semibold">Qo'llash</button>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-slate-100 px-5 pt-4 pb-5 rounded-t-2xl">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Oraliq jami</span>
            <span className="text-slate-900 font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1.5">
            <span className="text-slate-600">Yetkazib berish</span>
            <span className="text-emerald-600 font-semibold">Bepul</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-lg font-bold text-slate-900">Jami</span>
            <span className="text-lg font-bold text-slate-900">${subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => nav({ to: "/marja/checkout" })}
            className="mt-3 w-full h-12 rounded-full bg-[#2f5bff] text-white font-semibold"
          >
            To'lovga o'tish
          </button>
        </div>
      </div>
    </div>
  );
}
