import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { SubHeader } from "@/components/SubHeader";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings/notifications")({ component: NotificationsPage });

const NOTIFS_KEY = "nutqyoli.notifs";
type NotifPrefs = { daily: boolean; milestones: boolean; specialist: boolean };
const defaultPrefs: NotifPrefs = { daily: true, milestones: true, specialist: false };

function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const t = useT();

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
      // Incognito yoki to'lgan storage — foydalanuvchiga ayttirib qo'yamiz
      // (sozlama lokalda ko'rinadi, lekin keyingi kirish'da yo'qoladi).
      toast.error("Sozlama saqlanmadi — brauzer xotira ruxsatini tekshiring.");
    }
  };

  const rows: Array<{ key: keyof NotifPrefs; titleKey: "dailyExercises" | "newMilestones" | "specialistMsgs"; descKey: "dailyExercisesDesc" | "newMilestonesDesc" | "specialistMsgsDesc" }> = [
    { key: "daily", titleKey: "dailyExercises", descKey: "dailyExercisesDesc" },
    { key: "milestones", titleKey: "newMilestones", descKey: "newMilestonesDesc" },
    { key: "specialist", titleKey: "specialistMsgs", descKey: "specialistMsgsDesc" },
  ];

  return (
    <MobileShell>
      <SubHeader back="/settings" kicker={t("settingsKicker")} title={t("notifications")} />

      <div className="px-5 space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-start justify-between gap-3 rounded-2xl bg-card p-4 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold tracking-tight">{t(r.titleKey)}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t(r.descKey)}</div>
            </div>
            <Switch
              checked={prefs[r.key]}
              onCheckedChange={(v) => update({ [r.key]: v } as Partial<NotifPrefs>)}
              aria-label={t(r.titleKey)}
            />
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
