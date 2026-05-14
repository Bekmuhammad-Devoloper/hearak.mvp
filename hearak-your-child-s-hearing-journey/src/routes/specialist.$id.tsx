import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Circle, FileText, Loader2, Plus, X } from "lucide-react";
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
      <header className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/specialist" aria-label="Orqaga"><ArrowLeft className="size-5" /></Link>
          <div className="size-10 rounded-2xl bg-primary-soft flex items-center justify-center font-display font-semibold text-primary">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-lg font-semibold leading-tight">{patient.name}</h1>
            <p className="text-xs text-muted-foreground">
              {patient.days} kun implantatsiyadan keyin · {patient.stage}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold mb-4">Rivojlanish</h2>
            <div className="flex items-end gap-3 h-40">
              {monthly.map((p) => (
                <div key={p.month} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-primary to-accent"
                    style={{ height: `${(p.value / max) * 100}%` }}
                    title={`${p.month}: ${p.value}`}
                  />
                  <span className="text-xs text-muted-foreground">{p.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold mb-4">Bosqichlar</h2>
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  {m.done ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <div className={cn("text-sm font-medium", !m.done && !m.current && "text-muted-foreground")}>
                      {m.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.day}-kun</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-3xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Qaydlar</h2>
              <Button size="sm" variant="ghost" onClick={() => setNoteOpen((v) => !v)} aria-label="Yangi qayd">
                {noteOpen ? <X className="size-4" /> : <Plus className="size-4" />}
              </Button>
            </div>
            {noteOpen && (
              <form onSubmit={submitNote} className="mb-4 space-y-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Yangi qayd..."
                  className="rounded-xl"
                />
                <Button type="submit" size="sm" disabled={!noteText.trim() || addNote.isPending} className="w-full rounded-xl">
                  {addNote.isPending ? <Loader2 className="size-4 animate-spin" /> : "Qo'shish"}
                </Button>
              </form>
            )}
            <div className="space-y-3 text-sm">
              {notes.length === 0 && <p className="text-xs text-muted-foreground">Hozircha qaydlar yo'q</p>}
              {notes.map((n) => (
                <div key={n.id} className="p-3 bg-muted/50 rounded-xl">
                  <p className="font-medium text-xs text-muted-foreground mb-1">{formatDate(n.createdAt)}</p>
                  <p>{n.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Topshiriqlar</h2>
              <Button size="sm" variant="ghost" onClick={() => setAssignOpen((v) => !v)} aria-label="Yangi topshiriq">
                {assignOpen ? <X className="size-4" /> : <Plus className="size-4" />}
              </Button>
            </div>
            {assignOpen && (
              <form onSubmit={submitAssign} className="mb-4 space-y-2">
                <Input
                  value={assignText}
                  onChange={(e) => setAssignText(e.target.value)}
                  placeholder="Yangi topshiriq..."
                  className="rounded-xl"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!assignText.trim() || addAssignment.isPending}
                  className="w-full rounded-xl"
                >
                  {addAssignment.isPending ? <Loader2 className="size-4 animate-spin" /> : "Qo'shish"}
                </Button>
              </form>
            )}
            <div className="space-y-2">
              {assignments.length === 0 && (
                <p className="text-xs text-muted-foreground">Hozircha topshiriqlar yo'q</p>
              )}
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <FileText className="size-4 text-primary" />
                  <span className="text-sm flex-1">{a.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
