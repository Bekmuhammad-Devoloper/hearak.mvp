import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  Edit2,
  Loader2,
  Music4,
  Plus,
  Trash2,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  useAdminCreateGameItem,
  useAdminDeleteGameItem,
  useAdminUpdateGameItem,
  useDeleteGameAsset,
  useGameAssets,
  useUpsertGameAsset,
  type GameAssetMap,
  type GameItemMeta,
} from "@/lib/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/games/$id")({ component: AdminGameDetail });

const GAME_TITLES: Record<string, { title: string; description: string }> = {
  "sound-find": {
    title: "Tovushlarni topish",
    description: "O'yin elementlari uchun rasm va ovoz yuklash",
  },
  "word-pick": {
    title: "So'zni tanlash",
    description: "So'z elementlari uchun rasm yuklash",
  },
};

const IMAGE_MAX_PX = 512;
const IMAGE_QUALITY = 0.85;
const SOUND_MAX_BYTES = 500_000;
const SOUND_MAX_SECONDS = 5;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

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
  const cfg = GAME_TITLES[id];
  const assetsQ = useGameAssets(id);
  const assets: GameAssetMap = assetsQ.data?.items ?? {};
  const items = assetsQ.data?.itemList ?? [];
  const upsert = useUpsertGameAsset(id);
  const del = useDeleteGameAsset(id);
  const deleteItem = useAdminDeleteGameItem(id);
  const [editing, setEditing] = useState<GameItemMeta | null>(null);
  const [addOpen, setAddOpen] = useState(false);

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

  const handleDeleteItem = async (item: GameItemMeta) => {
    if (
      !window.confirm(
        `"${item.label}" o'chirilsinmi? Bu element bilan birga yuklangan rasm va ovoz ham o'chiriladi.`,
      )
    ) {
      return;
    }
    try {
      await deleteItem.mutateAsync(item.itemKey);
      toast.success(`"${item.label}" o'chirildi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "O'chirish xato");
    }
  };

  return (
    <AdminShell pageTitle={cfg.title} pageDescription={cfg.description}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/content"
            className="size-9 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="text-sm text-muted-foreground truncate">
            Mashqlar va o'yinlar /{" "}
            <span className="text-foreground font-medium">{cfg.title}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shrink-0"
        >
          <Plus className="size-4" />
          {id === "sound-find" ? "Hayvon qo'shish" : "So'z qo'shish"}
        </button>
      </div>

      <div className="bg-warm-soft/50 border border-warm/30 rounded-2xl p-4 mb-5 text-sm">
        <p className="font-semibold text-foreground">Qanday ishlaydi?</p>
        <ul className="mt-1.5 space-y-1 text-muted-foreground list-disc pl-5">
          <li>
            Yangi element qo'shing yoki mavjudini tahrirlang — emoji, nom, va sound-find uchun
            TTS parametrlari.
          </li>
          <li>
            Har element uchun <strong>rasm</strong> (PNG/JPG, kvadrat tavsiya etiladi) yoki{" "}
            <strong>ovoz</strong> (MP3/WAV, maks <strong>5 soniya</strong>) yuklang.
          </li>
          <li>Yuklangan assetlar darhol o'yinda ishlatiladi.</li>
          <li>Asset yuklamasangiz — emoji va onomatopoeik TTS fallback ishlaydi.</li>
        </ul>
      </div>

      {assetsQ.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Hali element yo'q. "{id === "sound-find" ? "Hayvon qo'shish" : "So'z qo'shish"}" tugmasini bosing.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((it) => (
            <AssetCard
              key={it.id}
              item={it}
              image={assets[it.itemKey]?.image}
              sound={assets[it.itemKey]?.sound}
              showSound={id === "sound-find"}
              onUpload={(kind, dataUrl) =>
                upsert.mutateAsync({ itemKey: it.itemKey, kind, dataUrl })
              }
              onDeleteAsset={(kind) => del.mutateAsync({ itemKey: it.itemKey, kind })}
              onEditItem={() => setEditing(it)}
              onDeleteItem={() => handleDeleteItem(it)}
              pending={upsert.isPending || del.isPending}
            />
          ))}
        </div>
      )}

      <GameItemDialog
        game={id}
        open={addOpen || !!editing}
        item={editing}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
      />
    </AdminShell>
  );
}

function AssetCard({
  item,
  image,
  sound,
  showSound,
  onUpload,
  onDeleteAsset,
  onEditItem,
  onDeleteItem,
  pending,
}: {
  item: GameItemMeta;
  image?: string;
  sound?: string;
  showSound: boolean;
  onUpload: (kind: "image" | "sound", dataUrl: string) => Promise<unknown>;
  onDeleteAsset: (kind: "image" | "sound") => Promise<unknown>;
  onEditItem: () => void;
  onDeleteItem: () => void;
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
      toast.success(`${item.label}: rasm saqlandi`);
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
      const duration = await getAudioDuration(dataUrl);
      if (Number.isFinite(duration) && duration > SOUND_MAX_SECONDS) {
        toast.error(
          `Ovoz juda uzun (${duration.toFixed(1)} sek). Maks: ${SOUND_MAX_SECONDS} sek`,
        );
        return;
      }
      await onUpload("sound", dataUrl);
      toast.success(`${item.label}: ovoz saqlandi`);
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
    if (!window.confirm(`${item.label} uchun ${kind === "image" ? "rasm" : "ovoz"} o'chirilsinmi?`))
      return;
    try {
      await onDeleteAsset(kind);
      toast.success("O'chirildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xato");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
      <div className="flex items-start gap-3 mb-4">
        <div className="size-12 rounded-xl bg-primary-soft text-2xl flex items-center justify-center shrink-0">
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-foreground truncate">{item.label}</div>
          {!item.active && (
            <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-surface px-1.5 py-0.5 rounded">
              O'chirilgan
            </span>
          )}
        </div>
        <div className="inline-flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onEditItem}
            aria-label="Tahrirlash"
            className="size-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted-foreground"
          >
            <Edit2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteItem}
            aria-label="O'chirish"
            className="size-8 rounded-lg hover:bg-destructive-soft hover:text-destructive flex items-center justify-center text-muted-foreground"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

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

        {showSound && (
          <>
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
          </>
        )}
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

function GameItemDialog({
  game,
  open,
  item,
  onClose,
}: {
  game: string;
  open: boolean;
  item: GameItemMeta | null;
  onClose: () => void;
}) {
  const isSoundFind = game === "sound-find";
  const create = useAdminCreateGameItem(game);
  const update = useAdminUpdateGameItem(game);
  const [itemKey, setItemKey] = useState("");
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [onomatopoeia, setOnomatopoeia] = useState("");
  const [pitch, setPitch] = useState<string>("1.0");
  const [rate, setRate] = useState<string>("0.9");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open) {
      setItemKey(item?.itemKey ?? "");
      setLabel(item?.label ?? "");
      setEmoji(item?.emoji ?? "");
      setOnomatopoeia(item?.onomatopoeia ?? "");
      setPitch(item?.pitch != null ? String(item.pitch) : "1.0");
      setRate(item?.rate != null ? String(item.rate) : "0.9");
      setActive(item?.active ?? true);
    }
  }, [open, item]);

  const pending = create.isPending || update.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (!label.trim()) {
      toast.error("Nom kerak");
      return;
    }
    if (!item && !/^[a-z0-9_-]+$/.test(itemKey.trim())) {
      toast.error("ID — lotin kichik harflar, raqam, '_' yoki '-' (masalan: 'ot', 'fil-2')");
      return;
    }
    const pitchN = parseFloat(pitch);
    const rateN = parseFloat(rate);
    try {
      if (item) {
        await update.mutateAsync({
          itemKey: item.itemKey,
          label: label.trim(),
          emoji: emoji.trim() || "✨",
          ...(isSoundFind
            ? {
                onomatopoeia: onomatopoeia.trim() || undefined,
                pitch: Number.isFinite(pitchN) ? pitchN : undefined,
                rate: Number.isFinite(rateN) ? rateN : undefined,
              }
            : {}),
          active,
        });
        toast.success(`"${label.trim()}" yangilandi`);
      } else {
        await create.mutateAsync({
          itemKey: itemKey.trim(),
          label: label.trim(),
          emoji: emoji.trim() || "✨",
          ...(isSoundFind
            ? {
                onomatopoeia: onomatopoeia.trim() || undefined,
                pitch: Number.isFinite(pitchN) ? pitchN : undefined,
                rate: Number.isFinite(rateN) ? rateN : undefined,
              }
            : {}),
          active,
        });
        toast.success(`"${label.trim()}" qo'shildi`);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  const inputCls =
    "block w-full h-11 px-3 rounded-xl border border-input bg-transparent text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const labelCls =
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {item
              ? "Elementni tahrirlash"
              : isSoundFind
                ? "Yangi hayvon"
                : "Yangi so'z"}
          </DialogTitle>
          <DialogDescription>
            {isSoundFind
              ? "Hayvonning nomi, emoji va tovush taqlid (onomatopoeia) ni kiriting. Real MP3 ovozni esa kartochkadan yuklaysiz."
              : "So'zning nomi va emoji'ni kiriting. Rasmni kartochkadan yuklang."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-[1fr_88px] gap-3">
            <div>
              <label htmlFor="gi-label" className={labelCls}>Nom</label>
              <input
                id="gi-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={isSoundFind ? "Sigir" : "Olma"}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="gi-emoji" className={labelCls}>Emoji</label>
              <input
                id="gi-emoji"
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🐮"
                className={inputCls + " text-center text-xl"}
              />
            </div>
          </div>
          <div>
            <label htmlFor="gi-key" className={labelCls}>ID (lotinda, takrorlanmas)</label>
            <input
              id="gi-key"
              type="text"
              value={itemKey}
              onChange={(e) => setItemKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              disabled={!!item}
              placeholder={isSoundFind ? "cow" : "olma"}
              className={inputCls + " font-mono disabled:opacity-60"}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {item
                ? "ID o'zgartirilmaydi."
                : "Faqat lotin kichik harflar, raqam, '_' yoki '-'. Misol: cow, fil-2."}
            </p>
          </div>
          {isSoundFind && (
            <>
              <div>
                <label htmlFor="gi-onom" className={labelCls}>
                  Tovush taqlid (TTS fallback uchun)
                </label>
                <input
                  id="gi-onom"
                  type="text"
                  value={onomatopoeia}
                  onChange={(e) => setOnomatopoeia(e.target.value)}
                  placeholder="mu-u-u"
                  className={inputCls}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  MP3 yuklanmagan bo'lsa, brauzer shu so'zni ovoz bilan aytadi.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="gi-pitch" className={labelCls}>Pitch (0.1–2.0)</label>
                  <input
                    id="gi-pitch"
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={2.0}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="gi-rate" className={labelCls}>Rate (0.1–2.0)</label>
                  <input
                    id="gi-rate"
                    type="number"
                    step={0.1}
                    min={0.1}
                    max={2.0}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4"
            />
            Faol (o'yinda ko'rinadi)
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
              {pending ? <Loader2 className="size-4 animate-spin" /> : item ? "Saqlash" : "Qo'shish"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
