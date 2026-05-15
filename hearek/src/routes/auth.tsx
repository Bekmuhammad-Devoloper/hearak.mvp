import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-icons";
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
        await signup.mutateAsync({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        });
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

  // ESLATMA: ilgari inner wrapper'da `flex min-h-screen flex-col + mt-auto` ishlatilgan edi.
  // Mobil klaviatura ochilganda viewport (100vh) qisqarib qaytadan render bo'lar va input
  // fokusni yo'qotardi — natijada "yozib bo'lmaydi" hissi paydo bo'lardi.
  // Sodda blok layout — har qanday mobil brauzerda barqaror.
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-calm">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-32 size-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-32 size-80 rounded-full bg-warm/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-md px-6 pt-8 pb-10">
        {/* Header */}
        <div className="flex flex-col items-center">
          <BrandLogo className="mb-3 h-14 w-14" />
          <h1 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.02em]">
            {mode === "signup" ? "Xush kelibsiz" : "Yana xush kelibsiz"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signup" ? "Bolangiz sayohatini hozir boshlang" : "Hisobingizga qayting"}
          </p>
        </div>

        {/* Segmented toggle */}
        <div
          role="tablist"
          aria-label="Hisob rejimi"
          className="mt-6 mb-5 grid grid-cols-2 rounded-2xl bg-muted p-1 text-sm font-semibold"
        >
          {(
            [
              { v: "signup", label: "Ro'yxatdan o'tish" },
              { v: "signin", label: "Kirish" },
            ] as const
          ).map((opt) => {
            const active = mode === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(opt.v)}
                className={
                  "press rounded-xl py-2.5 transition-colors " +
                  (active
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Form — noValidate: brauzerning HTML5 validatsiyasini o'chiramiz, biz toast bilan beramiz */}
        <form
          onSubmit={onSubmit}
          noValidate
          autoComplete="on"
          className="space-y-4 rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/40"
        >
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                To'liq ism
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-xl"
                placeholder="Aziza Karimova"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Elektron pochta
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              inputMode="email"
              spellCheck={false}
              enterKeyHint="next"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="ona@misol.uz"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Parol
              </Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => toast.info("Tez orada — admin'ga murojaat qiling")}
                  className="text-[11px] font-semibold text-primary hover:underline underline-offset-4"
                >
                  Unutdingizmi?
                </button>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="••••••••"
            />
            {mode === "signup" && (
              <p className="pl-1 text-[11px] text-muted-foreground">Kamida 6 ta belgi</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="press w-full h-14 rounded-2xl text-base font-semibold shadow-glow mt-2"
          >
            {pending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : mode === "signup" ? (
              "Hisob yaratish"
            ) : (
              "Davom etish"
            )}
          </Button>
        </form>

        {mode === "signin" && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-3 text-center backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Demo hisob
            </p>
            <p className="mt-1 text-xs text-foreground tabular-nums">
              ona@misol.uz <span className="text-muted-foreground">·</span> demo1234
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/specialist"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Mutaxassis sifatida kirish
          </Link>
        </div>
      </div>
    </div>
  );
}
