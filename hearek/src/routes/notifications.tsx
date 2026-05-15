import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellOff, Check } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/lib/queries";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Hozir";
  if (min < 60) return `${min} daq oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString();
}

function NotificationsPage() {
  const nav = useNavigate();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <MobileShell>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => history.back()} className="size-10 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-foreground leading-none">Bildirishnomalar</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {data?.unread ? `${data.unread} ta o'qilmagan` : "Hammasi o'qilgan"}
          </p>
        </div>
        {(data?.unread ?? 0) > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-sm font-semibold text-primary inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Check className="size-4" /> Hammasini o'qish
          </button>
        )}
      </header>

      <div className="px-4 pt-4 space-y-2.5">
        {isLoading ? (
          <div className="space-y-2.5">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}</div>
        ) : !data || data.notifications.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-10 text-center">
            <div className="size-14 rounded-2xl bg-surface inline-flex items-center justify-center">
              <BellOff className="size-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mt-4">Bildirishnomalar yo'q</h3>
            <p className="text-sm text-muted-foreground mt-1">Yangi habarlar bo'lganda shu yerda paydo bo'ladi.</p>
          </div>
        ) : (
          data.notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.read) markRead.mutate(n.id);
                if (n.link) nav({ to: n.link as never });
              }}
              className={
                "w-full text-left bg-card rounded-2xl border p-4 transition-colors " +
                (n.read ? "border-border" : "border-primary/40 bg-primary-soft/30")
              }
            >
              <div className="flex items-start gap-3">
                <div className={
                  "size-10 rounded-xl flex items-center justify-center shrink-0 " +
                  (n.read ? "bg-surface text-muted-foreground" : "bg-primary text-primary-foreground")
                }>
                  <Bell className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-foreground">{n.title}</div>
                    <div className="text-xs text-muted-foreground shrink-0">{relativeTime(n.createdAt)}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 leading-snug">{n.body}</div>
                  {n.link && (
                    <div className="text-xs text-primary font-medium mt-1.5">Ko'rish →</div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </MobileShell>
  );
}
