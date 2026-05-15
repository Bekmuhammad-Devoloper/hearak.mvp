import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Mail, TrendingUp, Calendar, Award, ListTodo, MessageCircle, ClipboardCheck, Activity, Plus, CheckCircle2 } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminAddAssignment, useAdminAddNote, useAdminChild } from "@/lib/queries";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/children/$id")({ component: AdminChildDetail });

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Hozir";
  if (min < 60) return `${min} daq oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} kun oldin`;
  return `${Math.floor(d / 30)} oy oldin`;
}

function AdminChildDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data, isLoading, isError } = useAdminChild(id);
  const addAssignment = useAdminAddAssignment(id);
  const addNote = useAdminAddNote(id);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  if (isLoading) {
    return (
      <AdminShell pageTitle="Bola">
        <Skeleton className="h-40" />
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Skeleton className="h-72 col-span-2" /><Skeleton className="h-72" />
        </div>
      </AdminShell>
    );
  }

  if (isError || !data) {
    return (
      <AdminShell pageTitle="Bola">
        <EmptyState icon={AlertTriangle} title="Bola topilmadi" description="So'ralgan bola ma'lumotini olib bo'lmadi." />
        <div className="mt-4">
          <button onClick={() => nav({ to: "/admin/children" })} className="text-sm font-semibold text-primary">← Bolalar ro'yxatiga qaytish</button>
        </div>
      </AdminShell>
    );
  }

  const { child, parent, specialist, notes, assignments, milestones, monthly, diagnostics, completions, chat } = data;
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.value));

  function submitAssignment(e: React.FormEvent) {
    e.preventDefault();
    const title = assignmentTitle.trim();
    if (!title) return;
    addAssignment.mutate(title, {
      onSuccess: () => { toast.success("Topshiriq berildi"); setAssignmentTitle(""); },
      onError: () => toast.error("Xatolik yuz berdi"),
    });
  }

  function submitNote(e: React.FormEvent) {
    e.preventDefault();
    const text = noteText.trim();
    if (!text) return;
    addNote.mutate(text, {
      onSuccess: () => { toast.success("Izoh qo'shildi"); setNoteText(""); },
      onError: () => toast.error("Xatolik yuz berdi"),
    });
  }

  return (
    <AdminShell pageTitle={child.name} pageDescription={child.stage}>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/admin/children" className="size-9 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground">
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-sm text-muted-foreground">Bolalar / <span className="text-foreground font-medium">{child.name}</span></span>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-card flex items-center gap-6">
        <div className="size-20 rounded-3xl bg-primary-soft text-5xl flex items-center justify-center shrink-0">
          {child.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-foreground">{child.name}</h2>
            {child.risk === "high" ? (
              <Badge tone="danger"><AlertTriangle className="size-3 mr-1" />Yuqori xavf</Badge>
            ) : child.risk === "medium" ? (
              <Badge tone="warning">O'rta xavf</Badge>
            ) : (
              <Badge tone="success">Past xavf</Badge>
            )}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-6 text-sm">
            <Stat icon={Calendar} label="Implantdan beri" value={`${child.days} kun`} />
            <Stat icon={TrendingUp} label="So'z" value={String(child.wordCount)} />
            <Stat icon={Award} label="Bosqich" value={`${child.stageNumber}/${child.totalStages}`} />
            <Stat icon={Activity} label="Rivojlanish" value={`${child.pct}%`} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {parent ? (
          <PersonCard role="Ota-ona" person={parent} accent="accent" />
        ) : (
          <EmptyPerson role="Ota-ona" />
        )}
        {specialist ? (
          <PersonCard role="Mutaxassis" person={specialist} accent="primary" subtitle={specialist.title} />
        ) : (
          <EmptyPerson role="Mutaxassis" hint="Topshiriq bermaganligi sababli mutaxassis tayinlanmagan" />
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground">Oylik o'sish</h3>
          <p className="text-sm text-muted-foreground">So'z birikma ko'rsatkichi</p>
          {monthly.length === 0 ? (
            <div className="mt-8 text-center text-sm text-muted-foreground">Ma'lumot yo'q</div>
          ) : (
            <div className="mt-5 flex items-end gap-4 h-44">
              {monthly.map((m) => {
                const h = (m.value / maxMonthly) * 100;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-foreground">{m.value}</div>
                    <div className="w-full flex items-end h-full">
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/40" style={{ height: Math.max(4, h) + "%" }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <Award className="size-4 text-primary" /> Bosqichlar
          </h3>
          <div className="mt-3 space-y-2.5">
            {milestones.length === 0 ? (
              <div className="text-sm text-muted-foreground">Bosqichlar yo'q</div>
            ) : milestones.map((m) => (
              <div key={m.id} className="flex items-start gap-2">
                <div className={
                  "size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 " +
                  (m.done ? "bg-success text-success-foreground" : m.current ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground")
                }>
                  {m.done ? <CheckCircle2 className="size-3" /> : <span className="text-[10px] font-bold">{m.day}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={"text-sm leading-tight " + (m.done ? "text-foreground" : m.current ? "text-foreground font-semibold" : "text-muted-foreground")}>{m.title}</div>
                  <div className="text-[10px] text-muted-foreground">{m.day}-kun</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <ListTodo className="size-4 text-primary" /> Topshiriqlar
          </h3>
          <p className="text-sm text-muted-foreground">Admin sifatida yangi topshiriq bering — ota-ona uy ilovasida ko'radi.</p>
          <form onSubmit={submitAssignment} className="mt-3 flex gap-2">
            <input
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="Mashqlarni 5 daqiqa qiling..."
              className="flex-1 h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:bg-card focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="submit"
              disabled={!assignmentTitle.trim() || addAssignment.isPending}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="size-4" /> Berish
            </button>
          </form>
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {assignments.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Topshiriqlar yo'q</div>
            ) : assignments.map((a) => (
              <div key={a.id} className="bg-surface rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.authorName} · {relativeTime(a.createdAt)}
                  </div>
                </div>
                {a.done ? <Badge tone="success">Bajarildi</Badge> : <Badge tone="primary">Faol</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" /> Mutaxassis izohlari
          </h3>
          <p className="text-sm text-muted-foreground">Izoh yozing — mutaxassis va ota-ona ko'radi.</p>
          <form onSubmit={submitNote} className="mt-3 flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Bola tovushlarga yaxshi reaksiya bildiryapti..."
              className="flex-1 h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:bg-card focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="submit"
              disabled={!noteText.trim() || addNote.isPending}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="size-4" /> Yozish
            </button>
          </form>
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {notes.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Izohlar yo'q</div>
            ) : notes.map((n) => (
              <div key={n.id} className="bg-surface rounded-xl p-3">
                <div className="text-sm text-foreground">{n.text}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {n.authorName} ({n.authorRole}) · {relativeTime(n.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <Activity className="size-4 text-primary" /> So'nggi mashqlar
          </h3>
          {completions.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground text-center py-4">Hali mashq bajarilmagan</div>
          ) : (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {completions.map((c, i) => (
                <div key={i} className="bg-surface rounded-xl p-3 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-card text-xl flex items-center justify-center">{c.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{relativeTime(c.completedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" /> Diagnostika
          </h3>
          {diagnostics.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground text-center py-4">Hali topshirilmagan</div>
          ) : (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {diagnostics.map((d) => (
                <div key={d.id} className="bg-surface rounded-xl p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-foreground">{d.score}/{d.maxScore}</span>
                    <span className="text-xs text-muted-foreground">{d.submittedAt.slice(0, 10)}</span>
                  </div>
                  <div className="mt-1.5 h-1 bg-card rounded-full overflow-hidden">
                    <div className={"h-full rounded-full " + (d.pct >= 80 ? "bg-success" : d.pct >= 50 ? "bg-primary" : d.pct >= 30 ? "bg-warm" : "bg-destructive")} style={{ width: d.pct + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {chat.length > 0 && (
        <div className="mt-6 bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <MessageCircle className="size-4 text-primary" /> So'nggi suhbatlar (AI yordamchi)
          </h3>
          <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
            {chat.map((m) => (
              <div key={m.id} className={"flex " + (m.from === "user" ? "justify-end" : "justify-start")}>
                <div className={
                  "max-w-[70%] rounded-2xl px-3 py-2 text-sm " +
                  (m.from === "user" ? "bg-primary text-primary-foreground" : "bg-surface text-foreground")
                }>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
        <Icon className="size-3" /> {label}
      </div>
      <div className="font-display text-lg font-bold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function PersonCard({ role, person, accent, subtitle }: {
  role: string;
  person: { fullName: string; email: string; avatarLetter: string };
  accent: "primary" | "accent";
  subtitle?: string;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card flex items-center gap-4">
      <div className={
        "size-12 rounded-full font-bold flex items-center justify-center shrink-0 " +
        (accent === "primary" ? "bg-primary-soft text-primary" : "bg-accent-soft text-accent-foreground")
      }>
        {person.avatarLetter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{role}</div>
        <div className="font-semibold text-foreground truncate">{person.fullName}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
          <Mail className="size-3" /> {person.email}
        </div>
      </div>
    </div>
  );
}

function EmptyPerson({ role, hint }: { role: string; hint?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-dashed border-border p-5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{role}</div>
      <div className="font-medium text-muted-foreground mt-1">Tayinlanmagan</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
