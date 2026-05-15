import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-icons";
import { useSignin } from "@/lib/queries";
import { setToken } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const nav = useNavigate();
  const signin = useSignin();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (signin.isPending) return;

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Email va parolni kiriting");
      return;
    }

    setError(null);
    try {
      const res = await signin.mutateAsync({ email, password });
      if (res.user.role !== "admin") {
        setToken(null);
        setError(`Bu akkaunt admin emas (rol: ${res.user.role}). Faqat admin huquqidagi foydalanuvchilar kira oladi.`);
        return;
      }
      toast.success("Admin panelga xush kelibsiz");
      nav({ to: "/admin/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirishda xatolik");
    }
  };

  const inputClass =
    "block w-full h-12 px-3 rounded-xl border border-input bg-surface-elevated text-base " +
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-accent/10 blur-3xl"
      />

      <header className="relative z-10 px-6 py-5">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Oddiy kirishga qaytish
        </Link>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <BrandLogo className="size-14" />
              <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow ring-2 ring-surface">
                <ShieldCheck className="size-4" />
              </div>
            </div>
            <h1 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] mt-4">
              Admin panel
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Boshqaruv paneliga kirish uchun admin hisobi kerak
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            noValidate
            autoComplete="on"
            className="mt-7 space-y-4 rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/40"
          >
            <div>
              <label htmlFor="admin-email" className={labelClass}>
                Admin email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                spellCheck={false}
                enterKeyHint="next"
                placeholder="admin@misol.uz"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className={labelClass}>
                Parol
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive-soft px-3 py-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={signin.isPending}
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-semibold shadow-glow mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
            >
              {signin.isPending ? <Loader2 className="size-5 animate-spin" /> : "Admin panelga kirish"}
            </button>
          </form>

          <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-3 text-center backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Demo admin
            </p>
            <p className="mt-1 text-xs text-foreground tabular-nums">
              admin@misol.uz <span className="text-muted-foreground">·</span> admin1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
