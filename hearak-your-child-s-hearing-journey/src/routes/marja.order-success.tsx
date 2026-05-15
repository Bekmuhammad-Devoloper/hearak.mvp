import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Truck, GraduationCap, ArrowRight } from "lucide-react";
import { PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/order-success")({ component: OrderSuccess });

function OrderSuccess() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[420px] flex flex-col min-h-screen bg-white relative">
        <PhoneStatusBar />

        <div className="flex-1 flex flex-col items-center px-6 pt-16">
          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-[#2f5bff]/10 blur-xl" />
            <div className="absolute -inset-3 rounded-full bg-[#2f5bff]/20" />
            <div className="relative size-24 rounded-full bg-[#2f5bff] flex items-center justify-center shadow-lg shadow-[#2f5bff]/30">
              <Check className="size-12 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="mt-8 font-display text-3xl font-bold text-slate-900">Muvaffaqiyatli!</h1>
          <p className="mt-2 text-slate-500">Buyurtmangiz qabul qilindi</p>

          <div className="mt-4 inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 text-sm">
            <span className="text-slate-500">Buyurtma ID:</span>
            <span className="font-bold text-slate-900">#MRJ-8492</span>
          </div>

          <div className="mt-8 w-full bg-slate-50 rounded-2xl p-4 space-y-4">
            <div className="flex gap-3">
              <div className="size-11 rounded-full bg-[#eaf0ff] flex items-center justify-center shrink-0">
                <Truck className="size-5 text-[#2f5bff]" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Yetkazib berish vaqti</div>
                <div className="text-sm text-slate-500 leading-snug mt-0.5">
                  Sizning mahsulotlaringiz 24 soat ichida yetkazib beriladi.
                </div>
                <div className="mt-2 font-semibold text-[#2f5bff]">16 Oktyabr, 2023</div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 flex gap-3">
              <div className="size-11 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <GraduationCap className="size-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Kurslarga kirish</div>
                <div className="text-sm text-slate-500 leading-snug mt-0.5">
                  Sotib olingan kurslar darhol faollashtirildi. Ularni "Mening kurslarim" bo'limida topishingiz mumkin.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-3 border-t border-slate-100">
          <button
            onClick={() => nav({ to: "/marja/orders" })}
            className="w-full h-13 py-3.5 rounded-full bg-[#2f5bff] text-white font-semibold inline-flex items-center justify-center gap-2"
          >
            Buyurtmani kuzatish
            <ArrowRight className="size-4" />
          </button>
          <button
            onClick={() => nav({ to: "/marja" })}
            className="w-full h-13 py-3.5 rounded-full border border-slate-200 text-slate-900 font-semibold"
          >
            Asosiy sahifaga
          </button>
        </div>
      </div>
    </div>
  );
}
