import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { SubHeader } from "@/components/SubHeader";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings/notifications")({ component: NotificationsPage });

const NOTIFS_KEY = "hearak.notifs";
type NotifPrefs = { daily: boolean; milestones: boolean; specialist: boolean };
const defaultPrefs: NotifPrefs = { daily: true, milestones: true, specialist: false };

function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIFS_KEY);
      if (raw) setPrefs({ ...defaultPrefs, ...(JSON.parse(raw) as NotifPrefs) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      window.localStorage.setItem(NOTIFS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const rows: Array<{ key: keyof NotifPrefs; title: string; desc: string }> = [
    { key: "daily", title: "Kunlik mashqlar", desc: "Har kuni eslatma yuboramiz" },
    { key: "milestones", title: "Yangi bosqichlar", desc: "Bola yangi yutuqqa erishganda" },
    { key: "specialist", title: "Mutaxassis xabarlari", desc: "Yangi qayd yoki topshiriqlar" },
  ];

  return (
    <MobileShell>
      <SubHeader back="/settings" kicker="Sozlamalar" title="Bildirishnomalar" />

      <div className="px-5 space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-start justify-between gap-3 rounded-2xl bg-card p-4 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold tracking-tight">{r.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.desc}</div>
            </div>
            <Switch
              checked={prefs[r.key]}
              onCheckedChange={(v) => update({ [r.key]: v } as Partial<NotifPrefs>)}
              aria-label={r.title}
            />
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
