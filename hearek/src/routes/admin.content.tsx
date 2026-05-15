import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Eye, Clock, Layers, Gamepad2, Mic, Ear } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminContent, type AdminExercise } from "@/lib/queries";
import { useState } from "react";

export const Route = createFileRoute("/admin/content")({ component: AdminContent });

type Type = AdminExercise["type"];

function typeIcon(t: Type) {
  if (t === "Eshitish") return Ear;
  if (t === "Nutq") return Mic;
  return Gamepad2;
}

function typeTone(t: Type): "primary" | "success" | "warning" {
  if (t === "Eshitish") return "primary";
  if (t === "Nutq") return "success";
  return "warning";
}

function AdminContent() {
  const { data, isLoading, isError } = useAdminContent();
  const [tab, setTab] = useState<"exercises" | "games">("exercises");

  const exercises = data?.exercises ?? [];
  const games = data?.games ?? [];

  return (
    <AdminShell pageTitle="Mashqlar va o'yinlar" pageDescription="Kontent kutubxonasini boshqarish">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
          {([
            ["exercises", "Mashqlar", exercises.length],
            ["games", "O'yinlar", games.length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                (tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              {label} <span className="ml-1 text-xs opacity-80">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
        ) : isError || !data ? (
          <EmptyState icon={Gamepad2} title="Yuklashda xatolik" description="Kontentni olib bo'lmadi." />
        ) : tab === "exercises" ? (
          <div className="grid grid-cols-3 gap-4">
            {exercises.map((e) => {
              const Icon = typeIcon(e.type);
              return (
                <div key={e.id} className="bg-card rounded-2xl border border-border p-5 shadow-card">
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-primary-soft text-2xl flex items-center justify-center">
                      {e.emoji}
                    </div>
                    {e.active ? <Badge tone="success">Faol</Badge> : <Badge tone="neutral">Qoralama</Badge>}
                  </div>

                  <h3 className="mt-4 font-display font-bold text-foreground leading-tight">{e.title}</h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={typeTone(e.type)}><Icon className="size-3 mr-1" />{e.type}</Badge>
                    <Badge tone="neutral"><Layers className="size-3 mr-1" />Bosqich {e.stage}</Badge>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {e.minutes} daq</span>
                      <span>·</span>
                      <span>{e.uses} marta</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="size-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground">
                        <Eye className="size-4" />
                      </button>
                      <button className="size-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground">
                        <Edit2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {games.map((g) => (
              <div key={g.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                <div className="aspect-[16/10] bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center text-7xl">
                  {g.emoji}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-foreground">{g.title}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone={g.difficulty === "Oson" ? "success" : g.difficulty === "O'rtacha" ? "primary" : "danger"}>
                      {g.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{g.plays} marta o'ynaldi</span>
                  </div>
                  <button className="mt-4 w-full h-9 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface inline-flex items-center justify-center gap-1.5">
                    <Edit2 className="size-3.5" /> Tahrirlash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
