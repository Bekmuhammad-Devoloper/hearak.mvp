import { createFileRoute } from "@tanstack/react-router";
import { Search, Mail, Baby, Users } from "lucide-react";
import { useState } from "react";
import { AdminShell, Badge, Skeleton, EmptyState, useAdminSearch } from "@/components/AdminShell";
import { Avatar } from "@/components/Avatar";
import { useAdminParents } from "@/lib/queries";

export const Route = createFileRoute("/admin/parents")({ component: AdminParents });

function engagementTone(pct: number): "success" | "primary" | "warning" | "danger" {
  if (pct >= 80) return "success";
  if (pct >= 60) return "primary";
  if (pct >= 40) return "warning";
  return "danger";
}

function AdminParents() {
  const { data, isLoading, isError } = useAdminParents();
  const { query: globalQuery } = useAdminSearch();
  const [localQuery, setLocalQuery] = useState("");

  const q = (localQuery || globalQuery).trim().toLowerCase();
  const all = data?.parents ?? [];
  const filtered = q
    ? all.filter((p) => p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
    : all;

  return (
    <AdminShell pageTitle="Ota-onalar" pageDescription="Platformadan foydalanuvchi oilalar">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Ism yoki email..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {q ? `${filtered.length} / ${all.length}` : `Jami ${all.length} ta ota-ona`}
        </span>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : isError || !data ? (
          <EmptyState icon={Users} title="Yuklashda xatolik" description="Ota-onalar ro'yxatini olib bo'lmadi." />
        ) : all.length === 0 ? (
          <EmptyState icon={Users} title="Hali ota-ona yo'q" description="Ro'yxatdan o'tgan ota-ona topilmadi." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Topilmadi" description={`"${q}" bo'yicha ota-ona topilmadi.`} />
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-surface">
                  <th className="py-3 px-5 font-semibold">Ota-ona</th>
                  <th className="py-3 px-5 font-semibold">Email</th>
                  <th className="py-3 px-5 font-semibold">Bolalar</th>
                  <th className="py-3 px-5 font-semibold">Faollik (hafta)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={p.avatarUrl}
                          fallback={p.avatarLetter}
                          rounded="rounded-full"
                          bg="bg-accent-soft"
                          fg="text-accent-foreground"
                          className="size-9 text-xs"
                        />
                        <div className="font-medium text-foreground text-sm">{p.fullName}</div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Mail className="size-3" /> {p.email}
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                        <Baby className="size-3.5 text-primary" /> {p.childrenCount}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className={
                              "h-full rounded-full " +
                              (p.engagement >= 80 ? "bg-success" : p.engagement >= 60 ? "bg-primary" : p.engagement >= 40 ? "bg-warm" : "bg-destructive")
                            }
                            style={{ width: p.engagement + "%" }}
                          />
                        </div>
                        <Badge tone={engagementTone(p.engagement)}>{p.engagement}%</Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
