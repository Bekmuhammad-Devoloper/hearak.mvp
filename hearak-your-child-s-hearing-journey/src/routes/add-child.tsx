import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Baby, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCreateChild } from "@/lib/queries";
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
      <div className="flex flex-col items-center text-center mb-8">
        <div className="size-20 rounded-3xl bg-warm/30 flex items-center justify-center mb-4">
          <Baby className="size-10 text-warm-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-semibold">Bolangiz haqida</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs">
          Bu ma'lumotlar sayohatni shaxsiylashtirish uchun kerak
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Bolaning ismi</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl"
            placeholder="Diyora"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Tug'ilgan sana</Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="h-14 rounded-2xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="implantDate">Implantatsiya sanasi</Label>
          <Input
            id="implantDate"
            type="date"
            value={implantDate}
            onChange={(e) => setImplantDate(e.target.value)}
            className="h-14 rounded-2xl"
            required
          />
          <p className="text-xs text-muted-foreground pl-1">Sayohat shu kundan boshlanadi 💙</p>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={create.isPending}
          className="w-full h-14 rounded-2xl mt-4"
        >
          {create.isPending ? <Loader2 className="size-5 animate-spin" /> : "Saqlash va boshlash"}
        </Button>
      </form>
    </div>
  );
}
