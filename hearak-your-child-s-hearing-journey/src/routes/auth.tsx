import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Ear, Loader2 } from "lucide-react";
import { useSignin, useSignup } from "@/lib/queries";
import { setActiveChildId } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();
  const signin = useSignin();
  const signup = useSignup();
  const pending = signin.isPending || signup.isPending;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    try {
      if (mode === "signup") {
        if (!fullName.trim() || !email.trim() || password.length < 6) {
          toast.error("Iltimos, barcha maydonlarni to'ldiring (parol — kamida 6 ta belgi)");
          return;
        }
        await signup.mutateAsync({ fullName: fullName.trim(), email: email.trim(), password });
        setActiveChildId(null);
        nav({ to: "/add-child" });
      } else {
        if (!email.trim() || !password) {
          toast.error("Email va parolni kiriting");
          return;
        }
        const res = await signin.mutateAsync({ email: email.trim(), password });
        if (res.user.role === "specialist") {
          nav({ to: "/specialist" });
        } else {
          nav({ to: "/dashboard" });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-calm flex flex-col px-6 py-10 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="size-16 rounded-2xl bg-card shadow-soft flex items-center justify-center mb-3">
          <Ear className="size-8 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-3xl font-semibold">Xush kelibsiz</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {mode === "signup" ? "Yangi hisob yarating" : "Hisobingizga kiring"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-card rounded-3xl p-6 shadow-card">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName">To'liq ism</Label>
            <Input
              id="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="Aziza Karimova"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Elektron pochta</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl"
            placeholder="ona@misol.uz"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Parol</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" size="lg" disabled={pending} className="w-full h-14 rounded-2xl">
          {pending ? <Loader2 className="size-5 animate-spin" /> : mode === "signup" ? "Ro'yxatdan o'tish" : "Kirish"}
        </Button>
        {mode === "signin" && (
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Demo: ona@misol.uz / demo1234
          </p>
        )}
      </form>

      <button
        type="button"
        className="mt-6 text-sm text-muted-foreground text-center"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "Hisobingiz bormi? Kirish" : "Hisobingiz yo'qmi? Ro'yxatdan o'ting"}
      </button>

      <div className="mt-auto text-center pt-6">
        <Link to="/specialist" className="text-xs text-muted-foreground underline">
          Mutaxassis sifatida kirish
        </Link>
      </div>
    </div>
  );
}
