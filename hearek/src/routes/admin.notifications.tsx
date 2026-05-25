import { createFileRoute } from "@tanstack/react-router";
import { Bell, Send, Users, Stethoscope, User, Globe2 } from "lucide-react";
import { AdminShell, Badge, Skeleton, EmptyState } from "@/components/AdminShell";
import { useAdminNotifications, useAdminParents, useAdminSendNotification, useAdminSpecialists } from "@/lib/queries";
import { useT } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({ component: AdminNotifications });

type Audience = "all" | "parents" | "specialists" | "user";

const audienceOptions: { value: Audience; label: string; icon: typeof Bell; desc: string }[] = [
  { value: "all",         label: "Hammaga",        icon: Globe2,      desc: "Ota-onalar va mutaxassislar" },
  { value: "parents",     label: "Ota-onalarga",   icon: Users,       desc: "Faqat ota-onalar" },
  { value: "specialists", label: "Mutaxassislarga", icon: Stethoscope, desc: "Faqat mutaxassislar" },
  { value: "user",        label: "Bitta foydalanuvchiga", icon: User,  desc: "Tanlangan kishi" },
];

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

function AdminNotifications() {
  const t = useT();
  const [audience, setAudience] = useState<Audience>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState("");
  const [link, setLink] = useState("");

  const send = useAdminSendNotification();
  const { data: history, isLoading: histLoading } = useAdminNotifications();
  const parents = useAdminParents();
  const specialists = useAdminSpecialists();

  const allUsers = useMemo(() => {
    const list: { id: string; label: string; role: string }[] = [];
    for (const p of parents.data?.parents ?? []) list.push({ id: p.id, label: p.fullName + " (ota-ona)", role: "parent" });
    for (const s of specialists.data?.specialists ?? []) list.push({ id: s.id, label: s.fullName + " (" + s.title + ")", role: "specialist" });
    return list;
  }, [parents.data, specialists.data]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (audience === "user" && !userId) {
      toast.error("Foydalanuvchini tanlang");
      return;
    }
    send.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        audience,
        userId: audience === "user" ? userId : undefined,
        link: link.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(`${res.sent} ta foydalanuvchiga yuborildi`);
          setTitle("");
          setBody("");
          setLink("");
        },
        onError: () => toast.error("Xatolik — qaytadan urinib ko'ring"),
      },
    );
  }

  return (
    <AdminShell pageTitle={t("adminNotifications")} pageDescription={t("adminNotificationsDesc")}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-1 bg-card rounded-2xl border border-border p-5 shadow-card">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2">
            <Send className="size-4 text-primary" /> Yangi bildirishnoma
          </h3>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kimga</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {audienceOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = audience === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAudience(opt.value)}
                      className={
                        "rounded-xl p-3 text-left transition-colors border " +
                        (active ? "border-primary bg-primary-soft" : "border-border hover:bg-surface")
                      }
                    >
                      <Icon className={"size-4 " + (active ? "text-primary" : "text-muted-foreground")} />
                      <div className={"text-sm font-semibold mt-1.5 " + (active ? "text-primary" : "text-foreground")}>{opt.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {audience === "user" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Foydalanuvchi</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-2 w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">— tanlang —</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sarlavha</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Yangi mashqlar qo'shildi"
                maxLength={120}
                className="mt-2 w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matn</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Bola uchun yangi mashqlar mavjud..."
                rows={4}
                maxLength={2000}
                className="mt-2 w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm outline-none focus:ring-2 focus:ring-ring/30 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Havola (ixtiyoriy)</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/exercises"
                className="mt-2 w-full h-10 px-3 rounded-xl bg-surface border border-border text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || send.isPending}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="size-4" />
              {send.isPending ? "Yuborilmoqda..." : "Yuborish"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <h3 className="font-display text-lg font-bold text-foreground inline-flex items-center gap-2 mb-3">
            <Bell className="size-4 text-primary" /> So'nggi yuborilganlar
          </h3>
          {histLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : !history || history.notifications.length === 0 ? (
            <EmptyState icon={Bell} title="Hali yuborilmagan" description="Birinchi bildirishnomangizni chap tomondan yuboring." />
          ) : (
            <div className="space-y-2.5">
              {history.notifications.map((n) => (
                <div key={n.id} className="bg-card rounded-2xl border border-border p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{n.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{n.body}</div>
                      {n.link && (
                        <div className="text-xs text-primary mt-1 font-mono">{n.link}</div>
                      )}
                    </div>
                    {n.read ? <Badge tone="success">O'qildi</Badge> : <Badge tone="primary">Yangi</Badge>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>{n.recipientName} <span className="opacity-70">({n.recipientRole})</span></span>
                    <span>{relativeTime(n.sentAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
