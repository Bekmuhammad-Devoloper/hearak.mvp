import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, Loader2, Music4, Trash2, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  useDeleteGameAsset,
  useGameAssets,
  useUpsertGameAsset,
  type GameAssetMap,
} from "@/lib/queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/games/$id")({ component: AdminGameDetail });

/**
 * Har bir o'yin uchun element ro'yxati — admin shu elementlarga rasm va
 * ovoz yuklay oladi. Frontend o'yin runtime'i shu kalitlar bo'yicha
 * assetlarni oladi.
 */
const GAME_ITEMS: Record<
  string,
  { title: string; items: Array<{ key: string; label: string; emoji: string }> }
> = {
  "sound-find": {
    title: "Tovushlarni topish",
    items: [
      { key: "dog", label: "It", emoji: "🐶" },
      { key: "cat", label: "Mushuk", emoji: "🐱" },
      { key: "bird", label: "Qush", emoji: "🐦" },
      { key: "cow", label: "Sigir", emoji: "🐮" },
      { key: "frog", label: "Qurbaqa", emoji: "🐸" },
      { key: "lion", label: "Sher", emoji: "🦁" },
    ],
  },
  "word-pick": {
    title: "So'zni tanlash",
    items: [
      { key: "olma", label: "Olma", emoji: "🍎" },
      { key: "banan", label: "Banan", emoji: "🍌" },
      { key: "quyosh", label: "Quyosh", emoji: "☀️" },
      { key: "oy", label: "Oy", emoji: "🌙" },
      { key: "mashina", label: "Mashina", emoji: "🚗" },
      { key: "uy", label: "Uy", emoji: "🏠" },
      { key: "gul", label: "Gul", emoji: "🌸" },
      { key: "suv", label: "Suv", emoji: "💧" },
    ],
  },
};

const IMAGE_MAX_PX = 512;
const IMAGE_QUALITY = 0.85;
const SOUND_MAX_BYTES = 500_000; // ~500 KB
const SOUND_MAX_SECONDS = 5; // ovoz davomiyligi chegarasi

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Ovoz davomiyligini sekundlarda o'lchaydi. Bo'sh yoki noto'g'ri fayllarda 0. */
function getAudioDuration(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;
    const done = (val: number) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };
    audio.addEventListener("loadedmetadata", () => done(audio.duration || 0));
    audio.addEventListener("error", () => done(0));
    // 3 sek ichida metadata yuklanmasa — o'tkazib yuboramiz (xatoga sabab bo'lmaydi).
    setTimeout(() => done(0), 3000);
    audio.src = dataUrl;
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
  if (w > h && w > IMAGE_MAX_PX) {
    w = IMAGE_MAX_PX;
    h = Math.round(w / ratio);
  } else if (h >= w && h > IMAGE_MAX_PX) {
    h = IMAGE_MAX_PX;
    w = Math.round(h * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
}

function AdminGameDetail() {
  const { id } = Route.useParams();
  const cfg = GAME_ITEMS[id];
  const assetsQ = useGameAssets(id);
  const assets: GameAssetMap = assetsQ.data?.items ?? {};
  const upsert = useUpsertGameAsset(id);
  const del = useDeleteGameAsset(id);

  if (!cfg) {
    return (
      <AdminShell pageTitle="O'yin topilmadi" pageDescription="Bu o'yin uchun assetlar boshqaruvi yo'q">
        <Link to="/admin/content" className="text-primary text-sm inline-flex items-center gap-1">
          <ArrowLeft className="size-4" /> Mashqlar va o'yinlarga qaytish
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Faqat <code className="px-1.5 rounded bg-surface">sound-find</code> va{" "}
          <code className="px-1.5 rounded bg-surface">word-pick</code> o'yinlari uchun asset
          yuklash imkoniyati mavjud.
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell pageTitle={cfg.title} pageDescription="O'yin elementlari uchun rasm va ovoz yuklash">
      <div className="flex items-center gap-3 mb-5">
        <Link
          to="/admin/content"
          className="size-9 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-sm text-muted-foreground">
          Mashqlar va o'yinlar / <span className="text-foreground font-medium">{cfg.title}</span>
        </span>
      </div>

      <div className="bg-warm-soft/50 border border-warm/30 rounded-2xl p-4 mb-5 text-sm">
        <p className="font-semibold text-foreground">Qanday ishlaydi?</p>
        <ul className="mt-1.5 space-y-1 text-muted-foreground list-disc pl-5">
          <li>Har element uchun <strong>rasm</strong> (PNG/JPG, kvadrat tavsiya etiladi) yoki <strong>ovoz</strong> (MP3/WAV, maks <strong>5 soniya</strong>) yuklang.</li>
          <li>Yuklangan assetlar darhol o'yinda ishlatiladi.</li>
          <li>Yuklamasangiz — emoji va onomatopoeik ovoz fallback ishlaydi.</li>
        </ul>
      </div>

      {assetsQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {cfg.items.map((it) => (
            <AssetCard
              key={it.key}
              game={id}
              itemKey={it.key}
              label={it.label}
              emoji={it.emoji}
              image={assets[it.key]?.image}
              sound={assets[it.key]?.sound}
              onUpload={(kind, dataUrl) =>
                upsert.mutateAsync({ itemKey: it.key, kind, dataUrl })
              }
              onDelete={(kind) => del.mutateAsync({ itemKey: it.key, kind })}
              pending={upsert.isPending || del.isPending}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function AssetCard({
  game: _game,
  itemKey: _itemKey,
  label,
  emoji,
  image,
  sound,
  onUpload,
  onDelete,
  pending,
}: {
  game: string;
  itemKey: string;
  label: string;
  emoji: string;
  image?: string;
  sound?: string;
  onUpload: (kind: "image" | "sound", dataUrl: string) => Promise<unknown>;
  onDelete: (kind: "image" | "sound") => Promise<unknown>;
  pending: boolean;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const sndRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"image" | "sound" | null>(null);

  const pickImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm fayli (JPG, PNG, WebP)");
      return;
    }
    setBusy("image");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const shrunk = await shrinkImage(dataUrl);
      await onUpload("image", shrunk);
      toast.success(`${label}: rasm saqlandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuklash xato");
    } finally {
      setBusy(null);
    }
  };

  const pickSound = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Faqat ovoz fayli (MP3, WAV, OGG)");
      return;
    }
    if (file.size > SOUND_MAX_BYTES) {
      toast.error(`Fayl juda katta (${Math.round(file.size / 1024)} KB). Maks: 500 KB`);
      return;
    }
    setBusy("sound");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      // Davomiylikni tekshiramiz — 5 sekunddan oshmasin.
      const duration = await getAudioDuration(dataUrl);
      if (Number.isFinite(duration) && duration > SOUND_MAX_SECONDS) {
        toast.error(
          `Ovoz juda uzun (${duration.toFixed(1)} sek). Maks: ${SOUND_MAX_SECONDS} sek`,
        );
        return;
      }
      await onUpload("sound", dataUrl);
      toast.success(`${label}: ovoz saqlandi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuklash xato");
    } finally {
      setBusy(null);
    }
  };

  const playSound = () => {
    if (!sound) return;
    const audio = new Audio(sound);
    audio.play().catch(() => toast.error("Ovozni chalib bo'lmadi"));
  };

  const removeAsset = async (kind: "image" | "sound") => {
    if (!window.confirm(`${label} uchun ${kind === "image" ? "rasm" : "ovoz"} o'chirilsinmi?`))
      return;
    try {
      await onDelete(kind);
      toast.success("O'chirildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xato");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
      {/* Sarlavha */}
      <div className="flex items-center gap-3 mb-4">
        <div className="size-12 rounded-xl bg-primary-soft text-2xl flex items-center justify-center shrink-0">
          {emoji}
        </div>
        <div className="font-display font-bold text-foreground">{label}</div>
      </div>

      {/* Rasm slot */}
      <div className="space-y-3">
        <SlotRow
          icon={<Camera className="size-4" />}
          title="Rasm"
          present={!!image}
          busy={busy === "image" || (pending && busy === null)}
          preview={
            image ? (
              <img
                src={image}
                alt=""
                className="size-12 rounded-lg object-cover ring-1 ring-border"
                draggable={false}
              />
            ) : null
          }
          onUpload={() => imgRef.current?.click()}
          onDelete={() => removeAsset("image")}
        />
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pickImage(f);
            e.target.value = "";
          }}
        />

        {/* Ovoz slot */}
        <SlotRow
          icon={<Music4 className="size-4" />}
          title="Ovoz"
          present={!!sound}
          busy={busy === "sound" || (pending && busy === null)}
          preview={
            sound ? (
              <button
                type="button"
                onClick={playSound}
                aria-label="Eshitish"
                className="press inline-flex items-center justify-center size-9 rounded-full bg-primary-soft text-primary hover:bg-primary/15"
              >
                <Volume2 className="size-4" />
              </button>
            ) : null
          }
          onUpload={() => sndRef.current?.click()}
          onDelete={() => removeAsset("sound")}
        />
        <input
          ref={sndRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pickSound(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function SlotRow({
  icon,
  title,
  present,
  busy,
  preview,
  onUpload,
  onDelete,
}: {
  icon: React.ReactNode;
  title: string;
  present: boolean;
  busy: boolean;
  preview: React.ReactNode;
  onUpload: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface/50 p-2.5">
      <div className="size-9 rounded-lg bg-card flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground">{title}</div>
        <div className={cn("text-[11px]", present ? "text-success" : "text-muted-foreground")}>
          {present ? "Yuklangan" : "Yo'q (fallback ishlatiladi)"}
        </div>
      </div>
      {preview}
      <button
        type="button"
        onClick={onUpload}
        disabled={busy}
        className="press h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 shrink-0"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : present ? "Yangilash" : "Yuklash"}
      </button>
      {present && (
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          aria-label="O'chirish"
          className="press size-8 rounded-lg hover:bg-destructive-soft hover:text-destructive flex items-center justify-center text-muted-foreground disabled:opacity-50 shrink-0"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
