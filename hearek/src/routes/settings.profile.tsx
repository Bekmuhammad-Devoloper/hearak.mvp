import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { SubHeader } from "@/components/SubHeader";
import { Avatar } from "@/components/Avatar";
import { useMe, useUpdateMe } from "@/lib/queries";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/settings/profile")({ component: ProfilePage });

/**
 * Avatar maksimal kengligi. Foydalanuvchi katta rasm yuklasa, brauzerda
 * 512px gacha kichraytirib JPEG sifatida saqlaymiz — backend payload chegarasi
 * ostida qoladi va sahifa tez yuklanadi.
 */
const AVATAR_MAX_PX = 512;
const AVATAR_QUALITY = 0.85;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function shrinkImage(dataUrl: string): Promise<string> {
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Rasm o'qib bo'lmadi"));
    img.src = dataUrl;
  });
  const ratio = img.width / img.height;
  let w = img.width;
  let h = img.height;
  if (w > h && w > AVATAR_MAX_PX) {
    w = AVATAR_MAX_PX;
    h = Math.round(w / ratio);
  } else if (h >= w && h > AVATAR_MAX_PX) {
    h = AVATAR_MAX_PX;
    w = Math.round(h * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
}

function ProfilePage() {
  const me = useMe();
  const update = useUpdateMe();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarTouched, setAvatarTouched] = useState(false);

  useEffect(() => {
    if (me.data) {
      setFullName(me.data.user.fullName);
      setEmail(me.data.user.email);
      setAvatarPreview(me.data.user.avatarUrl ?? null);
    }
  }, [me.data]);

  const onPickFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayli (jpg, png, webp)");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const shrunk = await shrinkImage(dataUrl);
      setAvatarPreview(shrunk);
      setAvatarTouched(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rasm yuklab bo'lmadi");
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (update.isPending) return;
    if (!fullName.trim() || !email.trim()) {
      toast.error("Ism va email bo'sh bo'lmasligi kerak");
      return;
    }
    try {
      const body: { fullName?: string; email?: string; avatarUrl?: string | null } = {
        fullName: fullName.trim(),
        email: email.trim(),
      };
      if (avatarTouched) {
        body.avatarUrl = avatarPreview; // null = o'chirish
      }
      await update.mutateAsync(body);
      toast.success("Profil saqlandi");
      nav({ to: "/settings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  if (!me.data) {
    return (
      <MobileShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </MobileShell>
    );
  }

  const monogram = me.data.user.avatarLetter || "?";

  const inputClass =
    "block w-full h-12 px-3 rounded-xl border border-input bg-transparent text-base " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <MobileShell>
      <SubHeader back="/settings" kicker={t("settingsKicker")} title={t("profileInfo")} />

      <form onSubmit={onSubmit} noValidate className="px-5 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 rounded-[28px] bg-card p-5 shadow-card">
          <Avatar
            src={avatarPreview}
            fallback={monogram}
            className="size-20"
            rounded="rounded-3xl"
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="press inline-flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary"
            >
              <Camera className="size-4" />
              {t("choosePhoto")}
            </button>
            {avatarPreview && (
              <button
                type="button"
                onClick={() => {
                  setAvatarPreview(null);
                  setAvatarTouched(true);
                }}
                className="press inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground"
              >
                <Trash2 className="size-4" />
                {t("removePhoto")}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="rounded-[28px] bg-card p-5 shadow-card space-y-4">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              {t("fullName")}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={update.isPending}
          className="press flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold shadow-glow disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {update.isPending ? <Loader2 className="size-5 animate-spin" /> : t("save")}
        </button>
      </form>
    </MobileShell>
  );
}
