import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Eye, Clock, Layers, Gamepad2, Mic, Ear, Plus, Trash2, Loader2, X } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState } from "@/components/AdminShell";
import {
  useAdminContent,
  useAdminCreateExercise,
  useAdminDeleteExercise,
  useAdminUpdateExercise,
  type AdminExercise,
  type ExerciseInput,
} from "@/lib/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/content")({ component: AdminContent });

type Type = AdminExercise["type"];
type DialogMode = { mode: "create" } | { mode: "edit"; ex: AdminExercise } | { mode: "view"; ex: AdminExercise } | null;

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
  const [dlg, setDlg] = useState<DialogMode>(null);
  const del = useAdminDeleteExercise();

  const exercises = data?.exercises ?? [];
  const games = data?.games ?? [];

  const onDelete = (ex: AdminExercise) => {
    if (!window.confirm(`"${ex.title}" mashqini o'chirmoqchimisiz?`)) return;
    del
      .mutateAsync(ex.id)
      .then(() => toast.success("O'chirildi"))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Xatolik"));
  };

  return (
    <AdminShell pageTitle="Mashqlar va o'yinlar" pageDescription="Kontent kutubxonasini boshqarish">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
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
        {tab === "exercises" && (
          <button
            type="button"
            onClick={() => setDlg({ mode: "create" })}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            <Plus className="size-4" /> Yangi mashq
          </button>
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : isError || !data ? (
          <EmptyState icon={Gamepad2} title="Yuklashda xatolik" description="Kontentni olib bo'lmadi." />
        ) : tab === "exercises" ? (
          exercises.length === 0 ? (
            <EmptyState
              icon={Gamepad2}
              title="Mashqlar yo'q"
              description='"Yangi mashq" tugmasini bosib birinchi mashqni qo&apos;shing.'
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                    <h3 className="mt-4 font-display font-bold text-foreground leading-tight break-words">
                      {e.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={typeTone(e.type)}><Icon className="size-3 mr-1" />{e.type}</Badge>
                      <Badge tone="neutral"><Layers className="size-3 mr-1" />Bosqich {e.stage}</Badge>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                        <span className="inline-flex items-center gap-1 shrink-0">
                          <Clock className="size-3" /> {e.minutes} daq
                        </span>
                        <span className="shrink-0">·</span>
                        <span className="truncate">{e.uses} marta</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDlg({ mode: "view", ex: e })}
                          aria-label="Ko'rish"
                          className="size-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDlg({ mode: "edit", ex: e })}
                          aria-label="Tahrirlash"
                          className="size-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(e)}
                          aria-label="O'chirish"
                          disabled={del.isPending}
                          className="size-8 rounded-lg hover:bg-destructive-soft hover:text-destructive flex items-center justify-center text-muted-foreground disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((g) => (
              <div key={g.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                <div className="aspect-[16/10] bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center text-7xl">
                  {g.emoji}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-foreground">{g.title}</h3>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Badge tone={g.difficulty === "Oson" ? "success" : g.difficulty === "O'rtacha" ? "primary" : "danger"}>
                      {g.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{g.plays} marta o'ynaldi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(`"${g.title}" — o'yinlar koddagi mantiq bilan bog'liq, tahrirlash kelajakda qo'shiladi`)
                    }
                    className="mt-4 w-full h-9 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface inline-flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="size-3.5" /> Ma'lumot
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {dlg?.mode === "view" && <ViewDialog ex={dlg.ex} onClose={() => setDlg(null)} onEdit={() => setDlg({ mode: "edit", ex: dlg.ex })} />}
      {dlg?.mode === "create" && <ExerciseDialog onClose={() => setDlg(null)} />}
      {dlg?.mode === "edit" && <ExerciseDialog onClose={() => setDlg(null)} initial={dlg.ex} />}
    </AdminShell>
  );
}

function ViewDialog({ ex, onClose, onEdit }: { ex: AdminExercise; onClose: () => void; onEdit: () => void }) {
  const Icon = typeIcon(ex.type);
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="size-12 rounded-2xl bg-primary-soft text-2xl flex items-center justify-center">
              {ex.emoji}
            </span>
            <div>
              <DialogTitle className="text-left">{ex.title}</DialogTitle>
              <DialogDescription className="text-left">
                Mashq ma'lumotlari
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <Row label="Tur"><Badge tone={typeTone(ex.type)}><Icon className="size-3 mr-1" />{ex.type}</Badge></Row>
          <Row label="Bosqich">{ex.stage}</Row>
          <Row label="Davomiyligi">{ex.minutes} daqiqa</Row>
          <Row label="Holat">
            {ex.active ? <Badge tone="success">Faol</Badge> : <Badge tone="neutral">Qoralama</Badge>}
          </Row>
          <Row label="Bajarilishi">{ex.uses} marta</Row>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface"
          >
            Yopish
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            <Edit2 className="size-4" /> Tahrirlash
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  );
}

function ExerciseDialog({ initial, onClose }: { initial?: AdminExercise; onClose: () => void }) {
  const create = useAdminCreateExercise();
  const update = useAdminUpdateExercise();
  const isEdit = !!initial;
  const pending = create.isPending || update.isPending;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<Type>(initial?.type ?? "Nutq");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "✨");
  const [minutes, setMinutes] = useState(String(initial?.minutes ?? 2));
  const [stage, setStage] = useState(String(initial?.stage ?? 1));
  const [active, setActive] = useState(initial?.active ?? true);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setType(initial.type);
      setEmoji(initial.emoji);
      setMinutes(String(initial.minutes));
      setStage(String(initial.stage));
      setActive(initial.active);
    }
  }, [initial]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (!title.trim()) {
      toast.error("Sarlavhani kiriting");
      return;
    }
    const body: ExerciseInput = {
      title: title.trim(),
      type,
      emoji: emoji.trim() || "✨",
      minutes: Math.max(1, Number(minutes) || 2),
      stage: Math.max(1, Number(stage) || 1),
      active,
    };
    try {
      if (isEdit && initial) {
        await update.mutateAsync({ id: initial.id, ...body });
        toast.success("Saqlandi");
      } else {
        await create.mutateAsync(body);
        toast.success("Yangi mashq qo'shildi");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  const inputCls =
    "block w-full h-11 px-3 rounded-xl border border-input bg-transparent text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Mashqni tahrirlash" : "Yangi mashq"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "O'zgarishlar saqlanadi va kunlik mashqlarda darhol ko'rinadi."
              : "Yangi mashq barcha bolalarning kunlik mashqlar to'plamiga qo'shiladi."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-[80px,1fr] gap-3">
            <div>
              <label htmlFor="ex-emoji" className={labelCls}>Emoji</label>
              <input
                id="ex-emoji"
                type="text"
                maxLength={4}
                value={emoji}
                onChange={(ev) => setEmoji(ev.target.value)}
                placeholder="✨"
                className={cn(inputCls, "text-center text-xl")}
              />
            </div>
            <div>
              <label htmlFor="ex-title" className={labelCls}>Sarlavha</label>
              <input
                id="ex-title"
                type="text"
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
                placeholder="Mevalar nomini aytish"
                className={inputCls}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Turi</label>
            <div className="grid grid-cols-3 gap-2">
              {(["Nutq", "Eshitish", "O'yin"] as const).map((t) => {
                const Icon = typeIcon(t);
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium border transition-colors",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-muted/40",
                    )}
                  >
                    <Icon className="size-4" /> {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ex-min" className={labelCls}>Davomiyligi (daqiqa)</label>
              <input
                id="ex-min"
                type="number"
                min={1}
                max={60}
                value={minutes}
                onChange={(ev) => setMinutes(ev.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="ex-stage" className={labelCls}>Bosqich</label>
              <input
                id="ex-stage"
                type="number"
                min={1}
                max={6}
                value={stage}
                onChange={(ev) => setStage(ev.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(ev) => setActive(ev.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="flex-1 text-sm">
              <span className="font-medium">Faol</span>
              <span className="ml-2 text-xs text-muted-foreground">
                Faol mashqlar kunlik to'plamga kiradi
              </span>
            </span>
          </label>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : isEdit ? "Saqlash" : "Qo'shish"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for tree-shake guard (Vite Fast Refresh)
export const _icons = { X };
