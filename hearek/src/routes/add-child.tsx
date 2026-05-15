import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCreateChild } from "@/lib/queries";
import { Logomark } from "@/components/brand-icons";
import { toast } from "sonner";

export const Route = createFileRoute("/add-child")({ component: AddChild });

function AddChild() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [implantDate, setImplantDate] = useState("");
  const create = useCreateChild();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (create.isPending) return;
    if (!name.trim() || !dob || !implantDate) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }
    try {
      await create.mutateAsync({ name: name.trim(), dob, implantDate });
      nav({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Saqlash muvaffaqiyatsiz");
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          aria-label="Orqaga"
          className="press grid size-10 place-items-center rounded-xl hover:bg-muted"
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

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label
            htmlFor="name"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Bolaning ismi
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl text-base"
            placeholder="Diyora"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="dob"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Tug'ilgan sana
          </Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="h-14 rounded-2xl text-base"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="implantDate"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Implantatsiya sanasi
          </Label>
          <Input
            id="implantDate"
            type="date"
            value={implantDate}
            onChange={(e) => setImplantDate(e.target.value)}
            className="h-14 rounded-2xl text-base"
            required
          />
          <p className="pl-1 text-xs text-muted-foreground">
            Rivojlanish bosqichlari shu kundan boshlanadi.
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={create.isPending}
          className="press mt-4 w-full h-14 rounded-2xl text-base font-semibold shadow-glow"
        >
          {create.isPending ? <Loader2 className="size-5 animate-spin" /> : "Saqlash va boshlash"}
        </Button>
      </form>
    </div>
  );
}
