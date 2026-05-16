import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-icons";
import { useSignin, useSignup } from "@/lib/queries";
import { setActiveChildId } from "@/lib/api";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({ component: Auth });

/**
 * Auth — kirish va ro'yxatdan o'tish.
 *
 * Inputlar UNCONTROLLED — sof <input> elementlar, defaultValue ham yo'q,
 * value/onChange yo'q. Submit paytida FormData orqali qiymatlar o'qiladi.
 * Bu mobil brauzerlardagi har qanday "input qotib qoldi" muammosini bartaraf etadi
 * (React re-render keystroke'larga aralashmaydi).
 */
function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const nav = useNavigate();
  const signin = useSignin();
  const signup = useSignup();
  const pending = signin.isPending || signup.isPending;
  const t = useT();
  const t = useT();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;

    const data = new FormData(e.currentTarget);
    const fullName = String(data.get("fullName") ?? "").trim();
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");

    try {
      if (mode === "signup") {
        if (!fullName || !email || password.length < 6) {
          toast.error("Iltimos, barcha maydonlarni to'ldiring (parol — kamida 6 ta belgi)");
          return;
        }
        await signup.mutateAsync({ fullName, email, password });
        setActiveChildId(null);
        nav({ to: "/add-child" });
      } else {
        if (!email || !password) {
          toast.error("Email va parolni kiriting");
          return;
        }
        const res = await signin.mutateAsync({ email, password });
        const dest =
          res.user.role === "admin"
            ? "/admin/dashboard"
            : res.user.role === "specialist"
              ? "/specialist"
              : "/dashboard";
        nav({ to: dest });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  // Plain <input> styling — shadcn Input wrapper'ini chetlab o'tamiz.
  const inputClass =
    "block w-full h-12 px-3 rounded-xl border border-input bg-transparent text-base " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

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

      <div className="relative z-10 mx-auto max-w-md px-6 pt-8 pb-10">
        {/* Header */}
        <div className="flex flex-col items-center">
          <BrandLogo className="mb-3 h-14 w-14" />
          <h1 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.02em]">
            {mode === "signup" ? t("welcome") : t("welcomeBack")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signup" ? t("startJourney") : t("backToAccount")}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mt-6 mb-5 grid grid-cols-2 rounded-2xl bg-muted p-1 text-sm font-semibold">
          {(
            [
              { v: "signup", label: t("signUp") },
              { v: "signin", label: t("signIn") },
            ] as const
          ).map((opt) => {
            const active = mode === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => setMode(opt.v)}
                className={
                  "rounded-xl py-2.5 transition-colors " +
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

        {/* Form — plain HTML inputs, uncontrolled, FormData submit */}
        <form
          key={mode}
          onSubmit={onSubmit}
          noValidate
          autoComplete="on"
          className="space-y-4 rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/40"
        >
          {mode === "signup" && (
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
                enterKeyHint="next"
                placeholder="Aziza Karimova"
                className={inputClass}
              />
            </div>
          )}

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
              autoCorrect="off"
              inputMode="email"
              spellCheck={false}
              enterKeyHint="next"
              placeholder="ona@misol.uz"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className={labelClass}>
                {t("password")}
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => toast.info("Tez orada — admin'ga murojaat qiling")}
                  className="text-[11px] font-semibold text-primary hover:underline underline-offset-4 mb-1.5"
                >
                  {t("forgotPassword")}
                </button>
              )}
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="••••••••"
              className={inputClass}
            />
            {mode === "signup" && (
              <p className="pl-1 mt-1 text-[11px] text-muted-foreground">{t("minChars")}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold shadow-glow mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
          >
            {pending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : mode === "signup" ? (
              t("createAccount")
            ) : (
              t("continue")
            )}
          </button>
        </form>

        {mode === "signin" && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-3 text-center backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("demoAccount")}
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
