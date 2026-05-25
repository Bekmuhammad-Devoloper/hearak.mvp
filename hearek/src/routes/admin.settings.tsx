import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Bot,
  Camera,
  CheckCircle2,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  Shield,
  Sparkles,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { AdminShell, Skeleton } from "@/components/AdminShell";
import { Avatar } from "@/components/Avatar";
import { useAdminStats, useMe, useUpdateMe } from "@/lib/queries";
import { fileToAvatarDataUrl } from "@/lib/image-upload";
import { useLocale, useT, type DictKey, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const t = useT();
  return (
    <AdminShell pageTitle={t("adminSettings")} pageDescription={t("adminSettingsDesc")}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <ProfileCard />
          <SystemStatusCard />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <AIStatusCard />
          <LanguageCard />
          <SecurityCard />
        </div>
      </div>
    </AdminShell>
  );
}

// ── Profil ────────────────────────────────────────────────────────

function ProfileCard() {
  const t = useT();
  const { data, isLoading } = useMe();
  const update = useUpdateMe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data?.user) {
      setName(data.user.fullName ?? "");
      setEmail(data.user.email ?? "");
    }
  }, [data?.user]);

  if (isLoading || !data?.user) {
    return <SectionCard title={t("adminProfile")} icon={UserIcon}><Skeleton className="h-40" /></SectionCard>;
  }
  const user = data.user;

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await update.mutateAsync({ avatarUrl: dataUrl });
      toast.success(t("adminPhotoUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("adminUploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(t("adminPhotoRemoveConfirm"))) return;
    try {
      await update.mutateAsync({ avatarUrl: null });
      toast.success(t("adminPhotoRemoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("adminGenericError"));
    }
  };

  const handleSave = async () => {
    const fullName = name.trim();
    const newEmail = email.trim();
    if (!fullName) return toast.error(t("adminNameEmpty"));
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) return toast.error(t("adminEmailInvalid"));
    try {
      await update.mutateAsync({ fullName, email: newEmail });
      toast.success(t("adminProfileSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("adminSaveError"));
    }
  };

  const dirty = name.trim() !== (user.fullName ?? "") || email.trim() !== (user.email ?? "");

  return (
    <SectionCard title={t("adminProfile")} icon={UserIcon}>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || update.isPending}
            aria-label={t("adminProfile")}
            className="press block rounded-2xl ring-1 ring-border hover:ring-primary/40 transition-all disabled:opacity-50"
          >
            <Avatar
              src={user.avatarUrl ?? null}
              fallback={user.avatarLetter ?? "?"}
              rounded="rounded-2xl"
              bg="bg-primary-soft"
              fg="text-primary"
              className="size-16 text-xl"
            />
          </button>
          <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-card">
            {uploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-foreground truncate">{user.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <Shield className="size-3" /> {t("adminSuperAdmin")}
          </p>
        </div>
        {user.avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={update.isPending}
            aria-label={t("adminPhotoRemoved")}
            className="press shrink-0 size-9 grid place-items-center rounded-xl text-muted-foreground hover:bg-destructive-soft hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-5 space-y-3">
        <Field label={t("adminFullName")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoCapitalize="words"
            className="block w-full h-11 px-3.5 rounded-xl border border-input bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Field>
        <Field label={t("adminEmail")}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoCapitalize="none"
            className="block w-full h-11 px-3.5 rounded-xl border border-input bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setName(user.fullName ?? "");
            setEmail(user.email ?? "");
          }}
          disabled={!dirty || update.isPending}
          className="h-10 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface disabled:opacity-40"
        >
          {t("adminCancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || update.isPending}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          {t("adminSave")}
        </button>
      </div>
    </SectionCard>
  );
}

// ── Tizim holati ──────────────────────────────────────────────────

function SystemStatusCard() {
  const t = useT();
  const { data, isLoading } = useAdminStats();
  if (isLoading || !data) {
    return <SectionCard title={t("adminSystemStatus")} icon={Activity}><Skeleton className="h-40" /></SectionCard>;
  }
  const items: Array<{ label: string; value: string | number }> = [
    { label: t("adminCountChildren"), value: data.counts.children },
    { label: t("adminCountParents"), value: data.counts.parents },
    { label: t("adminCountSpecialists"), value: data.counts.specialists },
    { label: t("adminCountActiveWeek"), value: data.counts.activeThisWeek },
    { label: t("adminCountWeeklyActivity"), value: data.counts.weeklyActivityPct + "%" },
  ];
  return (
    <SectionCard title={t("adminSystemStatus")} icon={Activity}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-2xl border border-border p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {it.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground tabular-nums">
              {it.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <QuickLink to="/admin/dashboard" labelKey="adminGoDashboard" />
        <QuickLink to="/admin/analytics" labelKey="adminMoreAnalytics" />
      </div>
    </SectionCard>
  );
}

// ── AI status ─────────────────────────────────────────────────────

function AIStatusCard() {
  const t = useT();
  return (
    <SectionCard title={t("adminAIAssistant")} icon={Bot}>
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-2xl bg-success-soft p-3 ring-1 ring-success/20">
          <CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">{t("adminOpenAIConnected")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("adminOpenAIHint")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border p-3 text-xs space-y-1.5">
          <Row k={t("adminModel")} v="gpt-4o-mini" />
          <Row k={t("adminTemperature")} v="0.5" />
          <Row k={t("adminMaxTokens")} v="600" />
          <Row k={t("adminContextLabel")} v={t("adminContextValue")} />
        </div>
        <p className="text-[11px] text-muted-foreground">{t("adminEnvHint")}</p>
      </div>
    </SectionCard>
  );
}

// ── Til ───────────────────────────────────────────────────────────

function LanguageCard() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const langs: Array<{ code: Locale; nameKey: DictKey; nativeKey: DictKey }> = [
    { code: "uz", nameKey: "adminLangUzbek", nativeKey: "adminLangUzbekNative" },
    { code: "ru", nameKey: "adminLangRussian", nativeKey: "adminLangRussianNative" },
  ];
  return (
    <SectionCard title={t("adminLangUI")} icon={Globe}>
      <div className="space-y-2">
        {langs.map((l) => {
          const active = l.code === locale;
          const name = t(l.nameKey);
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLocale(l.code);
                toast.success(name);
              }}
              className={cn(
                "w-full press flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors ring-1",
                active
                  ? "bg-primary-soft ring-primary/30 text-primary"
                  : "bg-card ring-border hover:bg-surface",
              )}
            >
              <div className="text-left">
                <p className="font-semibold">{name}</p>
                <p className="text-[11px] text-muted-foreground">{t(l.nativeKey)}</p>
              </div>
              {active && <CheckCircle2 className="size-4" />}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── Xavfsizlik ────────────────────────────────────────────────────

function SecurityCard() {
  const t = useT();
  return (
    <SectionCard title={t("adminSecurity")} icon={KeyRound}>
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3 rounded-2xl bg-warm-soft/60 p-3 ring-1 ring-warm/30">
          <AlertCircle className="size-4 text-warm-foreground mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">{t("adminPasswordTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("adminPasswordDesc")}</p>
          </div>
        </div>
        <Row k={t("adminTokenDuration")} v={t("adminTokenDurationValue")} />
        <Row k={t("adminJwtAlgo")} v="HS256" />
        <Row k={t("adminPwHash")} v={t("adminPwHashValue")} />
      </div>
    </SectionCard>
  );
}

// ── UI primitives ────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-card">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="font-display font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-foreground tabular-nums">{v}</span>
    </div>
  );
}

function QuickLink({ to, labelKey }: { to: string; labelKey: DictKey }) {
  const t = useT();
  return (
    <Link
      to={to}
      className="press inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted no-underline"
    >
      <Sparkles className="size-3 text-primary" /> {t(labelKey)} <ExternalLink className="size-3" />
    </Link>
  );
}
