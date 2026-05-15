import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Plus,
  StickyNote,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAddAssignment, useAddNote, useSpecialistPatient } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/specialist/$id")({ component: ChildDetail });

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

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || addNote.isPending) return;
    try {
      await addNote.mutateAsync(noteText.trim());
      setNoteText("");
      setNoteOpen(false);
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

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
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary tabular-nums">
              {patient.stageNumber}/{patient.totalStages} bosqich
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
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

          {/* Milestones */}
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
        </div>

        <div className="space-y-6">
          {/* Notes */}
          <div className="rounded-[28px] bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-accent-soft">
                  <StickyNote className="size-4 text-accent-foreground" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Qaydlar
                  </p>
                  <span className="font-display text-[15px] font-semibold tracking-tight">
                    {notes.length}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNoteOpen((v) => !v)}
                aria-label="Yangi qayd"
                className="press"
              >
                {noteOpen ? <X className="size-4" /> : <Plus className="size-4" />}
              </Button>
            </div>
            {noteOpen && (
              <form onSubmit={submitNote} className="mb-4 space-y-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Yangi qayd…"
                  className="rounded-xl"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!noteText.trim() || addNote.isPending}
                  className="press w-full rounded-xl"
                >
                  {addNote.isPending ? <Loader2 className="size-4 animate-spin" /> : "Qo'shish"}
                </Button>
              </form>
            )}
            <div className="space-y-2 text-sm">
              {notes.length === 0 && (
                <p className="rounded-2xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                  Hozircha qaydlar yo'q
                </p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="rounded-2xl bg-muted/40 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </p>
                  <p className="leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="rounded-[28px] bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft">
                  <FileText className="size-4 text-primary" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Topshiriqlar
                  </p>
                  <span className="font-display text-[15px] font-semibold tracking-tight">
                    {assignments.length}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAssignOpen((v) => !v)}
                aria-label="Yangi topshiriq"
                className="press"
              >
                {assignOpen ? <X className="size-4" /> : <Plus className="size-4" />}
              </Button>
            </div>
            {assignOpen && (
              <form onSubmit={submitAssign} className="mb-4 space-y-2">
                <Input
                  value={assignText}
                  onChange={(e) => setAssignText(e.target.value)}
                  placeholder="Yangi topshiriq…"
                  className="rounded-xl"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!assignText.trim() || addAssignment.isPending}
                  className="press w-full rounded-xl"
                >
                  {addAssignment.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Qo'shish"
                  )}
                </Button>
              </form>
            )}
            <div className="space-y-2">
              {assignments.length === 0 && (
                <p className="rounded-2xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                  Hozircha topshiriqlar yo'q
                </p>
              )}
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
          </div>
        </div>
      </main>
    </div>
  );
}
