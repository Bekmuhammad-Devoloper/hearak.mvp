import { createFileRoute } from "@tanstack/react-router";
import { Plus, Mail, Phone, MoreVertical } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

const users = [
  { name: "Aziz Karimov", email: "aziz@gmail.com", phone: "+998 90 123 45 67", orders: 12, spent: "4 580 000", since: "2024-03-12", tier: "VIP" },
  { name: "Malika Rasulova", email: "malika.r@gmail.com", phone: "+998 91 234 56 78", orders: 8, spent: "2 340 000", since: "2024-05-04", tier: "Gold" },
  { name: "Sherzod Toshev", email: "sherzod.t@mail.uz", phone: "+998 93 345 67 89", orders: 5, spent: "1 120 000", since: "2024-06-18", tier: "Silver" },
  { name: "Dilnoza Yusupova", email: "dilnoza@gmail.com", phone: "+998 94 456 78 90", orders: 22, spent: "8 920 000", since: "2024-01-22", tier: "VIP" },
  { name: "Bekzod Olimov", email: "bekzod.o@gmail.com", phone: "+998 97 567 89 01", orders: 3, spent: "520 000", since: "2024-09-08", tier: "Bronze" },
  { name: "Nilufar Akramova", email: "nilufar.a@gmail.com", phone: "+998 99 678 90 12", orders: 7, spent: "1 870 000", since: "2024-07-15", tier: "Silver" },
  { name: "Jasur Rakhimov", email: "jasur@mail.uz", phone: "+998 90 789 01 23", orders: 14, spent: "5 100 000", since: "2024-02-28", tier: "Gold" },
];

const tierStyles: Record<string, string> = {
  VIP: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
  Gold: "bg-amber-100 text-amber-700",
  Silver: "bg-slate-200 text-slate-700",
  Bronze: "bg-orange-100 text-orange-700",
};

function AdminUsers() {
  return (
    <AdminShell pageTitle="Mijozlar">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Jami {users.length} ta faol mijoz</p>
        <button className="h-10 px-4 rounded-xl bg-[#2f5bff] text-white text-sm font-semibold inline-flex items-center gap-2">
          <Plus className="size-4" /> Yangi mijoz
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {users.map((u) => {
          const initials = u.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
          return (
            <div key={u.email} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-gradient-to-br from-[#2f5bff] to-violet-500 text-white font-bold flex items-center justify-center">
                    {initials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{u.name}</div>
                    <span className={"inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full " + tierStyles[u.tier]}>
                      {u.tier}
                    </span>
                  </div>
                </div>
                <button className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <MoreVertical className="size-4 text-slate-500" />
                </button>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="size-3.5 text-slate-400" /> {u.email}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="size-3.5 text-slate-400" /> {u.phone}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500">Buyurtmalar</div>
                  <div className="font-bold text-slate-900">{u.orders} ta</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Jami sarflagan</div>
                  <div className="font-bold text-[#2f5bff]">{u.spent}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
