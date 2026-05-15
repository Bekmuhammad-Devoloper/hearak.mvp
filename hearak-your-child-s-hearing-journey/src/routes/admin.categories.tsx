import { createFileRoute } from "@tanstack/react-router";
import { Plus, Edit2, Trash2, Smartphone, Shirt, Home, Dumbbell, Sparkles, GraduationCap, Book, Gamepad2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

const categories = [
  { name: "Elektronika", products: 42, icon: Smartphone, tone: "bg-[#eaf0ff] text-[#2f5bff]" },
  { name: "Kiyim",       products: 28, icon: Shirt, tone: "bg-rose-50 text-rose-600" },
  { name: "Uy-ro'zg'or", products: 35, icon: Home, tone: "bg-emerald-50 text-emerald-600" },
  { name: "Sport",       products: 19, icon: Dumbbell, tone: "bg-amber-50 text-amber-600" },
  { name: "Kosmetika",   products: 24, icon: Sparkles, tone: "bg-violet-50 text-violet-600" },
  { name: "Educational", products: 16, icon: GraduationCap, tone: "bg-teal-50 text-teal-600" },
  { name: "Kantselyariya", products: 12, icon: Book, tone: "bg-orange-50 text-orange-600" },
  { name: "O'yinchoqlar", products: 10, icon: Gamepad2, tone: "bg-pink-50 text-pink-600" },
];

function AdminCategories() {
  const total = categories.reduce((s, c) => s + c.products, 0);
  return (
    <AdminShell pageTitle="Kategoriyalar">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{categories.length} ta kategoriya · jami {total} ta mahsulot</p>
        <button className="h-10 px-4 rounded-xl bg-[#2f5bff] text-white text-sm font-semibold inline-flex items-center gap-2">
          <Plus className="size-4" /> Yangi kategoriya
        </button>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.name} className="bg-white rounded-2xl border border-slate-100 p-5 group">
              <div className="flex items-start justify-between">
                <div className={"size-12 rounded-xl flex items-center justify-center " + c.tone}>
                  <Icon className="size-6" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                    <Edit2 className="size-4" />
                  </button>
                  <button className="size-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-rose-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 font-display font-bold text-slate-900">{c.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{c.products} ta mahsulot</p>
              <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2f5bff] rounded-full"
                  style={{ width: Math.min(100, (c.products / 42) * 100) + "%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
