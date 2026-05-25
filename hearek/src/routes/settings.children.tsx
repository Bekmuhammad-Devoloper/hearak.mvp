import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { SubHeader } from "@/components/SubHeader";
import { Avatar } from "@/components/Avatar";
import { useActiveChild, useSetActiveChild, useUpdateChild, type PublicChild } from "@/lib/queries";
import { fileToAvatarDataUrl } from "@/lib/image-upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings/children")({ component: ChildrenPage });

function ChildrenPage() {
  const { children, child, isLoading } = useActiveChild();
  const setActive = useSetActiveChild();
  const nav = useNavigate();
  const t = useT();

  if (isLoading) {
    return (
      <MobileShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  const onSelect = (c: PublicChild) => {
    setActive(c.id);
    toast.success(`${c.name} faol bola sifatida tanlandi`);
    nav({ to: "/settings" });
  };

  return (
    <MobileShell>
      <SubHeader back="/settings" kicker={t("settingsKicker")} title={t("childProfiles")} />

      <div className="px-5 space-y-2">
        {children.length === 0 ? (
          <div className="rounded-[28px] bg-card p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">{t("noProfiles")}</p>
          </div>
        ) : (
          children.map((c) => (
            <ChildRow
              key={c.id}
              child={c}
              isActive={child?.id === c.id}
              onSelect={() => onSelect(c)}
            />
          ))
        )}

        <Link to="/add-child" className="block pt-2">
          <button
            type="button"
            className="press flex w-full items-center justify-center gap-2 h-14 rounded-2xl border-2 border-dashed border-border-strong/60 text-base font-semibold text-muted-foreground hover:bg-muted/30"
          >
            <Plus className="size-5" />
            {t("addChildPlus")}
          </button>
        </Link>
      </div>
    </MobileShell>
  );
}

function ChildRow({
  child,
  isActive,
  onSelect,
}: {
  child: PublicChild;
  isActive: boolean;
  onSelect: () => void;
}) {
  const update = useUpdateChild();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const monogram = child.name.charAt(0).toUpperCase();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const shrunk = await fileToAvatarDataUrl(file);
      await update.mutateAsync({ id: child.id, avatarUrl: shrunk });
      toast.success(`${child.name} uchun rasm yangilandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuklash muvaffaqiyatsiz");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`${child.name} rasmi o'chirilsinmi?`)) return;
    try {
      await update.mutateAsync({ id: child.id, avatarUrl: null });
      toast.success("Rasm o'chirildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik");
    }
  };

  return (
    <div
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl p-4 transition-colors",
        isActive ? "bg-primary-soft ring-1 ring-primary/30" : "bg-card shadow-card hover:bg-muted/40",
      )}
    >
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileRef.current?.click();
          }}
          disabled={uploading}
          aria-label="Rasm tanlash"
          className="press block rounded-2xl ring-1 ring-border/60 hover:ring-primary/40 transition-all disabled:opacity-50"
        >
          <Avatar
            src={child.avatarUrl ?? null}
            fallback={monogram}
            rounded="rounded-2xl"
            bg="bg-card"
            fg="text-primary"
            className="size-14 text-xl shadow-xs"
          />
        </button>
        {/* Emoji yoki kamera badge */}
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 rounded-full bg-card px-1 py-0 text-base leading-none shadow-xs ring-1 ring-border/60 pointer-events-none"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin text-primary inline-block" />
          ) : child.avatarUrl ? (
            <Camera className="size-3.5 text-primary inline-block" />
          ) : (
            child.emoji
          )}
        </span>
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

      <button
        type="button"
        onClick={onSelect}
        className="press flex-1 min-w-0 text-left"
      >
        <div className="font-display text-[17px] font-semibold tracking-tight truncate">
          {child.name}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground truncate tabular-nums">
          {child.days} kun · {child.stage}
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        {child.avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={update.isPending}
            aria-label="Rasmni o'chirish"
            className="press grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive-soft hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        )}
        {isActive && <Check className="size-5 text-primary" strokeWidth={2.5} />}
      </div>
    </div>
  );
}
