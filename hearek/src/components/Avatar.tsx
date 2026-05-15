import { cn } from "@/lib/utils";

type Props = {
  /** Avatar rasmi URL. `null`/`undefined` bo'lsa monogram ko'rsatiladi. */
  src?: string | null;
  /** Monogram fallback uchun harf (odatda ismning birinchi harfi). */
  fallback: string;
  /** Tailwind size class — masalan "h-14 w-14". */
  className?: string;
  /** Inner radius — "rounded-2xl" yoki "rounded-full". Default `rounded-2xl`. */
  rounded?: string;
  /** Monogram fon rangi. Default `bg-primary-soft`. */
  bg?: string;
  /** Monogram matn rangi. Default `text-primary`. */
  fg?: string;
};

/**
 * Foydalanuvchi avatari — rasm bo'lsa ko'rsatadi, bo'lmasa monogram (harf).
 */
export function Avatar({
  src,
  fallback,
  className,
  rounded = "rounded-2xl",
  bg = "bg-primary-soft",
  fg = "text-primary",
}: Props) {
  return (
    <div className={cn("overflow-hidden", rounded, bg, className)}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className={cn("grid h-full w-full place-items-center font-display font-semibold", fg)}>
          {fallback}
        </div>
      )}
    </div>
  );
}
