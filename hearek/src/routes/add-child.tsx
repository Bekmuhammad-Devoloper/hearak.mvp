import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCreateChild, useMe } from "@/lib/queries";
import { Logomark } from "@/components/brand-icons";
import { Avatar } from "@/components/Avatar";
import { fileToAvatarDataUrl } from "@/lib/image-upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/add-child")({ component: AddChild });

/**
 * Yangi bola profili yaratish.
 *
 * Inputlar uncontrolled — auth.tsx bilan bir xil pattern. Mobil klaviatura
 * ochilganda input fokusni yo'qotmaydi, har keystroke React re-render qilmaydi.
 *
 * Avatar — ixtiyoriy. Tanlangach 512px'gacha kichraytirilib, JSON body ichida
 * data URL sifatida yuboriladi (`useCreateChild` mutationi orqali).
 */
function AddChild() {
  const nav = useNavigate();
  const create = useCreateChild();
  const { data: me, isError } = useMe();
  const role = me?.user.role;
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [processingPhoto, setProcessingPhoto] = useState(false);

  useEffect(() => {
    if (isError) {
      nav({ to: "/auth", replace: true });
    } else if (role === "admin") {
      nav({ to: "/admin/dashboard", replace: true });
    } else if (role === "specialist") {
      nav({ to: "/specialist", replace: true });
    }
  }, [isError, role, nav]);

  const handleFile = async (file: File) => {
    setProcessingPhoto(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rasm yuklab bo'lmadi");
    } finally {
      setProcessingPhoto(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (create.isPending) return;
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const dob = String(data.get("dob") ?? "");
    const implantDate = String(data.get("implantDate") ?? "");
    if (!name || !dob || !implantDate) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }
    try {
      await create.mutateAsync({
        name,
        dob,
        implantDate,
        avatarUrl: avatarUrl ?? undefined,
      });
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  const inputClass =
    "block w-full h-14 px-4 rounded-2xl border border-input bg-transparent text-base " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  const monogram = (nameDraft.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="min-h-screen bg-background px-6 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          aria-label="Orqaga"
          className="grid size-10 place-items-center rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Logomark className="h-8 w-8 text-primary" />
        <div className="size-10" />
      </div>

      <div className="mt-10 flex flex-col items-start">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("newProfileKicker")}
        </p>
        <h1 className="mt-1 font-display text-[32px] leading-[1.1] font-semibold tracking-tight">
          {t("meetChildTitle")}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {t("meetChildDesc")}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate autoComplete="on" className="mt-8 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processingPhoto || create.isPending}
            aria-label={avatarUrl ? "Rasmni almashtirish" : "Rasm tanlash"}
            className={cn(
              "press relative grid size-24 place-items-center rounded-3xl shadow-card ring-1 ring-border/60 transition-all disabled:opacity-50",
              "hover:ring-primary/40 hover:-translate-y-0.5",
            )}
          >
            <Avatar
              src={avatarUrl}
              fallback={monogram}
              rounded="rounded-3xl"
              bg="bg-card"
              fg="text-primary"
              className="size-24 text-4xl"
            />
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-card"
            >
              {processingPhoto ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
            </span>
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{avatarUrl ? "Rasm tanlandi" : t("choosePhoto")}</span>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                disabled={create.isPending}
                className="press inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-destructive hover:bg-destructive-soft disabled:opacity-50"
                aria-label="Rasmni o'chirish"
              >
                <Trash2 className="size-3" /> O'chirish
              </button>
            )}
          </div>
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

        <div>
          <label htmlFor="name" className={labelClass}>
            {t("childName")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder="Diyora"
            className={inputClass}
            onChange={(e) => setNameDraft(e.currentTarget.value)}
          />
        </div>

        <div>
          <label htmlFor="dob" className={labelClass}>
            {t("dob")}
          </label>
          <input id="dob" name="dob" type="date" enterKeyHint="next" className={inputClass} />
        </div>

        <div>
          <label htmlFor="implantDate" className={labelClass}>
            {t("implantDate")}
          </label>
          <input
            id="implantDate"
            name="implantDate"
            type="date"
            enterKeyHint="go"
            className={inputClass}
          />
          <p className="pl-1 mt-1.5 text-xs text-muted-foreground">
            {t("implantStartNote")}
          </p>
        </div>

        <button
          type="submit"
          disabled={create.isPending || processingPhoto}
          className="flex items-center justify-center gap-2 mt-4 w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
        >
          {create.isPending ? <Loader2 className="size-5 animate-spin" /> : t("saveAndStart")}
        </button>
      </form>
    </div>
  );
}
