import { createFileRoute } from "@tanstack/react-router";
import { Plus, Filter, MoreVertical, Edit2, Trash2, Eye } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/AdminShell";
import { useState } from "react";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  marja: string;
  status: "active" | "draft" | "archived";
  emoji: string;
  bg: string;
};

const initialProducts: Product[] = [
  { id: "P-001", name: "Robotics Starter Kit - Level 1", category: "Educational", price: "$45.00", stock: 124, marja: "+38%", status: "active", emoji: "🤖", bg: "bg-slate-800" },
  { id: "P-002", name: "Python Programming Masterclass", category: "Online Course", price: "$49.99", stock: 999, marja: "+72%", status: "active", emoji: "🐍", bg: "bg-slate-900" },
  { id: "P-003", name: "Sport krossovkasi Nike Air Max", category: "Kiyim", price: "280 000", stock: 67, marja: "+35%", status: "active", emoji: "👟", bg: "bg-slate-100" },
  { id: "P-004", name: "Simsiz quloqchinlar P9 Max", category: "Elektronika", price: "125 000", stock: 200, marja: "+42%", status: "active", emoji: "🎧", bg: "bg-orange-100" },
  { id: "P-005", name: "Smart soat Series 8 Ultra", category: "Elektronika", price: "190 000", stock: 45, marja: "+28%", status: "active", emoji: "⌚", bg: "bg-slate-200" },
  { id: "P-006", name: "O'yin konsoli djoystigi PS5", category: "Elektronika", price: "450 000", stock: 12, marja: "+55%", status: "draft", emoji: "🎮", bg: "bg-emerald-100" },
  { id: "P-007", name: "Yuz parvarishi uchun sivorotka", category: "Kosmetika", price: "85 000", stock: 350, marja: "+60%", status: "active", emoji: "🧴", bg: "bg-rose-100" },
  { id: "P-008", name: "Marja Branded Notebook", category: "Kantselyariya", price: "$12.50", stock: 0, marja: "+25%", status: "archived", emoji: "📓", bg: "bg-amber-100" },
];

function AdminProducts() {
  const [products] = useState(initialProducts);
  const [tab, setTab] = useState<"all" | "active" | "draft" | "archived">("all");
  const filtered = tab === "all" ? products : products.filter((p) => p.status === tab);

  return (
    <AdminShell pageTitle="Mahsulotlar">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Jami {products.length} ta mahsulot</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50">
            <Filter className="size-4" /> Filtr
          </button>
          <button className="h-10 px-4 rounded-xl bg-[#2f5bff] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#2548d6]">
            <Plus className="size-4" /> Yangi mahsulot
          </button>
        </div>
      </div>

      <div className="mt-5 bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 px-5">
          {([
            ["all", "Barchasi", products.length],
            ["active", "Faol", products.filter((p) => p.status === "active").length],
            ["draft", "Qoralama", products.filter((p) => p.status === "draft").length],
            ["archived", "Arxivlangan", products.filter((p) => p.status === "archived").length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px " +
                (tab === key
                  ? "border-[#2f5bff] text-[#2f5bff]"
                  : "border-transparent text-slate-500 hover:text-slate-900")
              }
            >
              {label} <span className="ml-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded">{count}</span>
            </button>
          ))}
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <th className="py-3 px-5 font-semibold">Mahsulot</th>
              <th className="py-3 px-5 font-semibold">Kategoriya</th>
              <th className="py-3 px-5 font-semibold">Narx</th>
              <th className="py-3 px-5 font-semibold">Zaxira</th>
              <th className="py-3 px-5 font-semibold">Marja</th>
              <th className="py-3 px-5 font-semibold">Holat</th>
              <th className="py-3 px-5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <div className={"size-11 rounded-xl flex items-center justify-center text-xl shrink-0 " + p.bg}>
                      {p.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate max-w-[260px]">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-5 text-sm text-slate-700">{p.category}</td>
                <td className="py-3 px-5 text-sm font-semibold text-slate-900">{p.price}</td>
                <td className="py-3 px-5 text-sm">
                  <span className={p.stock === 0 ? "text-rose-600 font-semibold" : p.stock < 20 ? "text-amber-600 font-semibold" : "text-slate-700"}>
                    {p.stock} dona
                  </span>
                </td>
                <td className="py-3 px-5">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{p.marja}</span>
                </td>
                <td className="py-3 px-5"><StatusBadge status={p.status} /></td>
                <td className="py-3 px-5 text-right">
                  <div className="inline-flex gap-1">
                    <button className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                      <Eye className="size-4" />
                    </button>
                    <button className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                      <Edit2 className="size-4" />
                    </button>
                    <button className="size-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-rose-500">
                      <Trash2 className="size-4" />
                    </button>
                    <button className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">1-{filtered.length} / {filtered.length} dan</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">Oldingi</button>
            <button className="px-3 py-1 rounded-lg bg-[#2f5bff] text-white">1</button>
            <button className="px-3 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">Keyingi</button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
