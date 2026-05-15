import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCreateChild } from "@/lib/queries";
import { Logomark } from "@/components/brand-icons";
import { toast } from "sonner";

export const Route = createFileRoute("/add-child")({ component: AddChild });

/**
 * Yangi bola profili yaratish.
 *
 * Inputlar uncontrolled — auth.tsx bilan bir xil pattern. Mobil klaviatura
 * ochilganda input fokusni yo'qotmaydi, har keystroke React re-render qilmaydi.
 */
function AddChild() {
  const nav = useNavigate();
  const create = useCreateChild();

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
      await create.mutateAsync({ name, dob, implantDate });
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
          Yangi profil
        </p>
        <h1 className="mt-1 font-display text-[32px] leading-[1.1] font-semibold tracking-tight">
          Bolangiz bilan tanishaylik
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Sayohatni shaxsiylashtirish uchun uchta asosiy ma'lumot kifoya.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate autoComplete="on" className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className={labelClass}>
            Bolaning ismi
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder="Diyora"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="dob" className={labelClass}>
            Tug'ilgan sana
          </label>
          <input id="dob" name="dob" type="date" enterKeyHint="next" className={inputClass} />
        </div>

        <div>
          <label htmlFor="implantDate" className={labelClass}>
            Implantatsiya sanasi
          </label>
          <input
            id="implantDate"
            name="implantDate"
            type="date"
            enterKeyHint="go"
            className={inputClass}
          />
          <p className="pl-1 mt-1.5 text-xs text-muted-foreground">
            Rivojlanish bosqichlari shu kundan boshlanadi.
          </p>
        </div>

        <button
          type="submit"
          disabled={create.isPending}
          className="flex items-center justify-center gap-2 mt-4 w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
        >
          {create.isPending ? <Loader2 className="size-5 animate-spin" /> : "Saqlash va boshlash"}
        </button>
      </form>
    </div>
  );
}
