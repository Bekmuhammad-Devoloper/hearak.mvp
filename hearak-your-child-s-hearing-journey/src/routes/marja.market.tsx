import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, Heart, BarChart3 } from "lucide-react";
import { MarjaShell, PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/market")({ component: MarjaMarket });

const categories = ["Barchasi", "Elektronika", "Kiyim", "Uy-ro'zg'or", "Sport"];

type Product = {
  id: string;
  title: string;
  price: string;
  moq: string;
  marja: string;
  tags: string[];
  bg: string;
  emoji: string;
};

const products: Product[] = [
  { id: "nike", title: "Sport krossovkasi Nike Air Max", price: "280 000", moq: "10 dona", marja: "+35%", tags: ["Uzum"], bg: "bg-gradient-to-br from-slate-100 to-slate-200", emoji: "👟" },
  { id: "p9max", title: "Simsiz quloqchinlar P9 Max", price: "125 000", moq: "50 dona", marja: "+42%", tags: ["Yandex"], bg: "bg-gradient-to-br from-amber-100 to-orange-200", emoji: "🎧" },
  { id: "watch", title: "Smart soat Series 8 Ultra", price: "190 000", moq: "20 dona", marja: "+28%", tags: ["Uzum", "Yandex"], bg: "bg-gradient-to-br from-slate-200 to-slate-300", emoji: "⌚" },
  { id: "ps5", title: "O'yin konsoli djoystigi PS5", price: "450 000", moq: "5 dona", marja: "+55%", tags: ["Uzum"], bg: "bg-gradient-to-br from-emerald-100 to-teal-200", emoji: "🎮" },
  { id: "serum", title: "Yuz parvarishi uchun sivorotka", price: "85 000", moq: "100 dona", marja: "+60%", tags: ["Yandex"], bg: "bg-gradient-to-br from-rose-100 to-amber-100", emoji: "🧴" },
  { id: "blender", title: "Blender 3in1 oshxona uchun", price: "310 000", moq: "12 dona", marja: "+30%", tags: ["Uzum"], bg: "bg-gradient-to-br from-emerald-100 to-green-200", emoji: "🍹" },
];

function MarjaMarket() {
  const nav = useNavigate();
  return (
    <MarjaShell>
      <PhoneStatusBar />

      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100">
        <button onClick={() => nav({ to: "/marja" })} className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100">
          <ArrowLeft className="size-5 text-slate-700" />
        </button>
        <h1 className="text-[17px] font-semibold text-slate-900">Marja Market</h1>
        <button className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100">
          <Bell className="size-5 text-slate-700" />
        </button>
      </header>

      <div className="px-5 pt-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-800 text-white p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 text-[10px] font-mono leading-tight px-3 pt-2 text-emerald-100 select-none">
            Waleuale trends<br />Natimuui inge<br />Safe % work
          </div>
          <div className="relative">
            <span className="inline-block bg-[#2f5bff] text-white text-[10px] font-bold px-2 py-1 rounded">TREND</span>
            <h2 className="mt-3 font-display text-xl font-bold">Ulgurji savdo trendlari</h2>
            <p className="text-emerald-100/90 text-sm mt-1">Eng so'nggi yangiliklar va tahlillar</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {categories.map((c, i) => (
            <button
              key={c}
              className={
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors " +
                (i === 0
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 flex items-end justify-between">
        <h3 className="font-display text-lg font-bold text-slate-900">Tavsiya etilganlar</h3>
        <button className="text-sm font-medium text-[#2f5bff]">Barchasi</button>
      </div>

      <div className="px-5 pt-3 grid grid-cols-2 gap-3 pb-6">
        {products.map((p) => (
          <Link
            key={p.id}
            to="/marja/product/$id"
            params={{ id: p.id }}
            className="bg-white rounded-2xl overflow-hidden border border-slate-100"
          >
            <div className={"relative aspect-square " + p.bg}>
              <button className="absolute top-2.5 right-2.5 size-8 rounded-full bg-white/95 flex items-center justify-center">
                <Heart className="size-4 text-slate-500" />
              </button>
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                {p.emoji}
              </div>
              <div className="absolute left-2.5 bottom-2.5 bg-emerald-500 text-white text-[11px] font-semibold px-2 py-1 rounded">
                Marja {p.marja}
              </div>
            </div>
            <div className="p-3">
              <div className="flex gap-1.5 flex-wrap">
                {p.tags.map((t) => (
                  <span key={t} className={
                    "text-[10px] font-semibold px-2 py-0.5 rounded " +
                    (t === "Uzum" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700")
                  }>{t}</span>
                ))}
              </div>
              <p className="mt-2 text-[13px] font-medium text-slate-900 leading-tight line-clamp-2">{p.title}</p>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[#2f5bff] font-bold">{p.price}</span>
                <span className="text-[11px] text-slate-500">so'm</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-[11px] text-slate-500">MOQ: {p.moq}</span>
                <BarChart3 className="size-3.5 text-slate-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </MarjaShell>
  );
}
