import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Mail,
  Plus,
  StickyNote,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAddAssignment, useAddNote, useSpecialistPatient } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/specialist/$id")({ component: ChildDetail });

type Tab = "overview" | "notes" | "assignments" | "milestones";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
  } catch {
    return iso;
  }
}

function ChildDetail() {
  const { id } = Route.useParams();
  const detail = useSpecialistPatient(id);
  const addNote = useAddNote(id);
  const addAssignment = useAddAssignment(id);
  const [tab, setTab] = useState<Tab>("overview");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignText, setAssignText] = useState("");

  if (detail.isLoading || !detail.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { patient, notes, assignments, milestones, monthly } = detail.data;
  const max = Math.max(1, ...monthly.map((p) => p.value));
  const openAssignments = assignments.filter((a) => !a.done).length;
  const lastNoteAt = notes[0]?.createdAt;

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || addNote.isPending) return;
    try {
      await addNote.mutateAsync(noteText.trim());
      setNoteText("");
      setNoteOpen(false);
      toast.success("Qayd qo'shildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  const submitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignText.trim() || addAssignment.isPending) return;
    try {
      await addAssignment.mutateAsync(assignText.trim());
      setAssignText("");
      setAssignOpen(false);
      toast.success("Topshiriq qo'shildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "overview", label: "Umumiy" },
    { key: "notes", label: "Qaydlar", count: notes.length },
    { key: "assignments", label: "Topshiriqlar", count: assignments.length },
    { key: "milestones", label: "Bosqichlar" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3.5">
          <Link
            to="/specialist"
            aria-label="Orqaga"
            className="press grid size-10 place-items-center rounded-full bg-muted/60 hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft font-display font-semibold text-primary">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Bemor profili
            </p>
            <h1 className="font-display text-[19px] font-semibold leading-tight tracking-tight">
              {patient.name}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {patient.days} kun implantatsiyadan keyin · {patient.stage}
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => toast.info("Ota-onaga xabar yuborish tez orada qo'shiladi")}
              className="press inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              <Mail className="size-3.5" /> Xabar
            </button>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary tabular-nums">
              {patient.stageNumber}/{patient.totalStages} bosqich
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {/* Quick stats banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <QuickStat
            icon={TrendingUp}
            tone="primary"
            label="So'z boyligi"
            value={String(patient.wordCount)}
          />
          <QuickStat
            icon={FileText}
            tone="warm"
            label="Ochiq topshiriq"
            value={String(openAssignments)}
          />
          <QuickStat
            icon={StickyNote}
            tone="accent"
            label="Qaydlar"
            value={String(notes.length)}
            sub={lastNoteAt ? formatDate(lastNoteAt) : undefined}
          />
          <QuickStat
            icon={Bell}
            tone="success"
            label="Bosqich"
            value={`${patient.stageNumber}/${patient.totalStages}`}
          />
        </div>

        {/* Tabs */}
        <div className="mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => setTab(tb.key)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "bg-card text-muted-foreground hover:bg-muted/50",
                )}
              >
                {tb.label}
                {typeof tb.count === "number" && (
                  <span className={cn("text-[11px] tabular-nums", active ? "opacity-90" : "opacity-70")}>
                    {tb.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-[28px] bg-card p-6 shadow-card">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Rivojlanish
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight">
                    So'z boyligi grafigi
                  </h2>
                </div>
                <div className="text-right">
                  <span className="font-display text-[28px] font-semibold tabular-nums">
                    {patient.wordCount}
                  </span>
                  <p className="-mt-1 text-[10px] text-muted-foreground">jami so'z</p>
                </div>
              </div>
              <div className="flex items-end gap-3 h-44">
                {monthly.map((p) => {
                  const h = (p.value / max) * 100;
                  return (
                    <div key={p.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="relative w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-[10px] bg-gradient-to-t from-primary via-primary to-accent transition-[height] duration-700"
                          style={{
                            height: `${Math.max(h, 6)}%`,
                            transitionTimingFunction: "var(--ease-emphasized)",
                          }}
                          title={`${p.month}: ${p.value}`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">{p.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SummaryCard
                title="Oxirgi qaydlar"
                empty="Hozircha qaydlar yo'q"
                onMore={() => setTab("notes")}
                items={notes.slice(0, 3).map((n) => ({
                  id: n.id,
                  primary: n.text,
                  secondary: formatDate(n.createdAt),
                }))}
                icon={StickyNote}
                tone="accent"
              />
              <SummaryCard
                title="Oxirgi topshiriqlar"
                empty="Hozircha topshiriqlar yo'q"
                onMore={() => setTab("assignments")}
                items={assignments.slice(0, 3).map((a) => ({
                  id: a.id,
                  primary: a.title,
                  secondary: a.done ? "Bajarilgan" : "Ochiq",
                  done: a.done,
                }))}
                icon={FileText}
                tone="primary"
              />
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="rounded-[28px] bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Barcha qaydlar
              </h2>
              <Button size="sm" onClick={() => setNoteOpen((v) => !v)} className="press rounded-full">
                {noteOpen ? <X className="size-4" /> : <Plus className="size-4" />} Qayd
              </Button>
            </div>
            {noteOpen && (
              <form onSubmit={submitNote} className="mb-4 space-y-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Yangi qayd…"
                  className="rounded-xl"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!noteText.trim() || addNote.isPending}
                  className="press rounded-xl"
                >
                  {addNote.isPending ? <Loader2 className="size-4 animate-spin" /> : "Qo'shish"}
                </Button>
              </form>
            )}
            {notes.length === 0 ? (
              <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Hozircha qaydlar yo'q
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {notes.map((n) => (
                  <div key={n.id} className="rounded-2xl bg-muted/40 p-4">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </p>
                    <p className="leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "assignments" && (
          <div className="rounded-[28px] bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Barcha topshiriqlar
              </h2>
              <Button size="sm" onClick={() => setAssignOpen((v) => !v)} className="press rounded-full">
                {assignOpen ? <X className="size-4" /> : <Plus className="size-4" />} Topshiriq
              </Button>
            </div>
            {assignOpen && (
              <form onSubmit={submitAssign} className="mb-4 space-y-2">
                <Input
                  value={assignText}
                  onChange={(e) => setAssignText(e.target.value)}
                  placeholder="Yangi topshiriq…"
                  className="rounded-xl"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!assignText.trim() || addAssignment.isPending}
                  className="press rounded-xl"
                >
                  {addAssignment.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Qo'shish"
                  )}
                </Button>
              </form>
            )}
            {assignments.length === 0 ? (
              <p className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Hozircha topshiriqlar yo'q
              </p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl p-3 transition-colors",
                      a.done ? "bg-success-soft ring-1 ring-success/20" : "bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full shrink-0",
                        a.done
                          ? "bg-success text-success-foreground"
                          : "ring-2 ring-border-strong/60",
                      )}
                    >
                      {a.done && <CheckCircle2 className="size-3.5" />}
                    </span>
                    <span
                      className={cn(
                        "text-sm flex-1 leading-snug",
                        a.done && "text-muted-foreground line-through",
                      )}
                    >
                      {a.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "milestones" && (
          <div className="rounded-[28px] bg-card p-6 shadow-card">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Bosqichlar
              </p>
              <h2 className="mt-0.5 font-display text-lg font-semibold tracking-tight">
                Vaqt jadvali
              </h2>
            </div>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
              {milestones.map((m) => (
                <div key={m.id} className="flex gap-4 pb-4 last:pb-0 relative">
                  <div
                    className={cn(
                      "grid size-6 place-items-center rounded-full shrink-0 z-10 ring-4 ring-card",
                      m.done
                        ? "bg-success text-success-foreground"
                        : m.current
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "bg-muted",
                    )}
                  >
                    {m.done ? (
                      <CheckCircle2 className="size-4" />
                    ) : m.current ? (
                      <Circle className="size-2 fill-current" />
                    ) : (
                      <Circle className="size-2 fill-current text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p
                      className={cn(
                        "text-sm font-semibold tracking-tight",
                        !m.done && !m.current && "text-muted-foreground",
                      )}
                    >
                      {m.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.day}-kun · implantatsiyadan keyin
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: typeof TrendingUp;
  tone: "primary" | "warm" | "accent" | "success";
  label: string;
  value: string;
  sub?: string;
}) {
  const tones = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    warm: { bg: "bg-warm-soft", text: "text-warm-foreground" },
    accent: { bg: "bg-accent-soft", text: "text-accent-foreground" },
    success: { bg: "bg-success-soft", text: "text-success" },
  };
  const t = tones[tone];
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className={cn("grid size-9 place-items-center rounded-xl", t.bg)}>
        <Icon className={cn("size-4", t.text)} />
      </div>
      <div className="mt-3 font-display text-[22px] font-semibold leading-none tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground/80">{sub}</div>}
    </div>
  );
}

function SummaryCard({
  title,
  items,
  empty,
  onMore,
  icon: Icon,
  tone,
}: {
  title: string;
  items: Array<{ id: string; primary: string; secondary?: string; done?: boolean }>;
  empty: string;
  onMore: () => void;
  icon: typeof StickyNote;
  tone: "primary" | "accent";
}) {
  const tones = {
    primary: { bg: "bg-primary-soft", text: "text-primary" },
    accent: { bg: "bg-accent-soft", text: "text-accent-foreground" },
  };
  const t = tones[tone];
  return (
    <div className="rounded-[24px] bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={cn("grid size-9 place-items-center rounded-xl", t.bg)}>
            <Icon className={cn("size-4", t.text)} />
          </span>
          <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onMore}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Hammasi
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((it) => (
            <li key={it.id} className="rounded-xl bg-muted/30 px-3 py-2">
              <p
                className={cn(
                  "leading-snug line-clamp-2",
                  it.done && "line-through text-muted-foreground",
                )}
              >
                {it.primary}
              </p>
              {it.secondary && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{it.secondary}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
