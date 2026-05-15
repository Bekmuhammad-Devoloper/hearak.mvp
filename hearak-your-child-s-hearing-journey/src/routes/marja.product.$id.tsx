import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart, Share2, Star, ShoppingCart, GraduationCap, Zap } from "lucide-react";
import { PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/product/$id")({ component: ProductDetail });

function ProductDetail() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#f5f7fb] flex justify-center">
      <div className="w-full max-w-[420px] flex flex-col min-h-screen bg-white relative">
        <PhoneStatusBar />

        <div className="relative">
          <div className="aspect-[4/3] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-[120px]">🤖</div>
            <button
              onClick={() => nav({ to: "/marja/market" })}
              className="absolute top-4 left-4 size-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
            >
              <ArrowLeft className="size-5 text-slate-800" />
            </button>
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="size-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                <Heart className="size-5 text-slate-800" />
              </button>
              <button className="size-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                <Share2 className="size-5 text-slate-800" />
              </button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              <span className="w-6 h-1.5 rounded-full bg-white" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            </div>
          </div>
        </div>

        <div className="px-5 pt-5 -mt-3 rounded-t-3xl bg-white relative">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-[22px] font-bold text-slate-900 leading-tight">
              Robotics Starter Kit - Level 1
            </h1>
            <div className="shrink-0 bg-[#eaf0ff] rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] font-semibold text-[#2f5bff]">MOQ</div>
              <div className="text-[18px] font-bold text-[#2f5bff] leading-none">10</div>
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[#2f5bff] text-xl font-bold">$45.00 - $55.00</span>
            <span className="text-slate-400 line-through text-sm">$65.00</span>
          </div>

          <div className="mt-3 flex gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-700">
              <GraduationCap className="size-3.5" /> Educational
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-700">
              <Zap className="size-3.5" /> Electronics
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-slate-900">4.8</span>
            <span className="text-sm text-slate-500">(124 reviews)</span>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="font-display font-bold text-slate-900">Description</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Introduce students to the exciting world of robotics with this comprehensive starter kit.
              Designed for beginners, it includes all necessary components to build 5 unique robot
              models. The kit features an easy-to-use microcontroller, sensors, motors, and a
              detailed guide for classroom integration.
            </p>
            <button className="mt-1 text-sm font-medium text-[#2f5bff]">Read more</button>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="font-display font-bold text-slate-900">Specifications</h3>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row k="Brand" v="EduTech Pro" />
              <Row k="Material" v="ABS Plastic, Metal" />
              <Row k="Age Group" v="8+ Years" />
              <Row k="Warranty" v="1 Year Limited" />
              <Row k="In the box" v="Microcontroller, 2x Motors, Battery Pack, Manual" />
            </dl>
          </div>

          <div className="mt-5 mb-28 rounded-2xl border border-slate-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center">TS</div>
              <div>
                <div className="font-semibold text-sm text-slate-900">TechLearn Supplies</div>
                <div className="text-xs text-slate-500">Official Distributor</div>
              </div>
            </div>
            <button className="text-xs font-semibold border border-slate-300 rounded-full px-3 py-1.5">Visit Store</button>
          </div>
        </div>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t border-slate-100 px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => nav({ to: "/marja/cart" })}
            className="size-12 rounded-full border border-slate-200 flex items-center justify-center"
          >
            <ShoppingCart className="size-5 text-slate-700" />
          </button>
          <button
            onClick={() => nav({ to: "/marja/cart" })}
            className="flex-1 h-12 rounded-full bg-[#2f5bff] text-white font-semibold"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-900 font-medium text-right">{v}</dd>
    </div>
  );
}
