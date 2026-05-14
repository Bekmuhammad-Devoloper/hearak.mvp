import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Hearak brand icon system.
 *
 * - `BrandLogo` — asosiy rasm-asosli logo (`/hearak-logo.png`). Splash, onboarding,
 *   auth — yirik kontekstlar uchun. Agar rasm yo'q bo'lsa, fallback SVG chiziladi.
 * - `Logomark` — kichik kontekstlar uchun mononoxrom SVG mark (3 to'lqin).
 * - `NavHome / NavProgress / NavPractice / NavChat / NavSettings` — pastki
 *   navigatsiya uchun maxsus rasm chizilgan vektor iconlar. Har biri sohaga
 *   (eshitish-nutq) bog'liq vizual tilda.
 */

type IconProps = React.SVGAttributes<SVGSVGElement>;

const svgBase = (className?: string) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: cn("h-6 w-6 shrink-0", className),
});

// ─── SVG Logomark (kichik kontekstlar uchun) ────────────────────────────

export const Logomark: React.FC<IconProps & { duotone?: boolean }> = ({
  className,
  duotone,
  ...rest
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    className={cn("h-10 w-10", className)}
    {...rest}
  >
    {duotone && (
      <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.08" />
    )}
    <circle cx="13" cy="20" r="2" fill="currentColor" />
    <path
      d="M17.5 14.5a8 8 0 0 1 0 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M22 11a13 13 0 0 1 0 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.55"
    />
    <path
      d="M26.5 7.5a18 18 0 0 1 0 25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.25"
    />
  </svg>
);

export const LogoWordmark: React.FC<{ className?: string; markClassName?: string }> = ({
  className,
  markClassName,
}) => (
  <div className={cn("inline-flex items-center gap-2.5", className)}>
    <Logomark className={cn("h-8 w-8 text-primary", markClassName)} />
    <span
      className="font-display text-2xl font-semibold tracking-tight text-foreground"
      style={{ fontFeatureSettings: '"ss01"' }}
    >
      hearak
    </span>
  </div>
);

// ─── Asosiy brand logosi (rasm) ─────────────────────────────────────────
// `public/hearak-logo.png` — bola + tovush to'lqinlari illyustratsiyasi.
// Dumaloq frame ichida. Rasm topilmasa, fallback Logomark.

/**
 * Hearak brand belgisi — dumaloq frame ichidagi rasm.
 *
 * `/icon.png` 1254×1254 kvadrat: tepada dumaloq illyustratsiya (bola + to'lqinlar),
 * pastida "Hearak" matni. CSS background bilan biroz kattalashtirib pastga
 * suriladi — bu matn dumaloq kesimdan tashqarida qoladi, faqat illyustratsiya
 * markazda ko'rinadi.
 */
export const BrandLogo: React.FC<{
  className?: string;
  haloed?: boolean;
}> = ({ className, haloed = true }) => (
  <div
    className={cn(
      "relative inline-flex aspect-square items-center justify-center",
      className,
    )}
  >
    {haloed && (
      <span
        aria-hidden
        className="absolute inset-[-14%] rounded-full bg-primary/15 blur-2xl"
      />
    )}
    <div
      role="img"
      aria-label="Hearak — eshitish va nutq sayohati"
      className="relative h-full w-full rounded-full bg-card bg-no-repeat shadow-soft ring-1 ring-border/40"
      style={{
        backgroundImage: "url('/icon.png')",
        backgroundSize: "140%",
        backgroundPosition: "center 32%",
      }}
    />
  </div>
);

// ─── Bottom navigation ikonlari (boyroq, mavzu-asosli) ─────────────────

// Uy: tom + tan, ikkita path — eshik kesimi bilan.
export const NavHome: React.FC<IconProps> = ({ className, ...rest }) => (
  <svg {...svgBase(className)} {...rest}>
    <path d="M3.6 11.1 11.3 4.3a1 1 0 0 1 1.4 0l7.7 6.8" />
    <path d="M5 10.5V19a2 2 0 0 0 2 2h2.5v-5a2.5 2.5 0 0 1 5 0v5H17a2 2 0 0 0 2-2v-8.5" />
  </svg>
);

// Sparkline — yuqoriga ko'tariluvchi chiziq + milestone nuqta + baseline.
export const NavProgress: React.FC<IconProps> = ({ className, ...rest }) => (
  <svg {...svgBase(className)} {...rest}>
    <path d="M3.5 16.5 8 11.8l3.4 3.1 4.2-6.3 4.9 3.6" />
    <circle cx="15.6" cy="8.6" r="1.5" fill="currentColor" stroke="none" />
    <path d="M3.5 20.5h17" strokeOpacity="0.4" />
  </svg>
);

// Waveform — 6 ta vertikal bar, simmetrik balandlik. Audio mashqlar uchun.
export const NavPractice: React.FC<IconProps> = ({ className, ...rest }) => (
  <svg {...svgBase(className)} {...rest}>
    <path d="M4 10.5v3" />
    <path d="M8 8v8" />
    <path d="M12 5.5v13" />
    <path d="M16 8v8" />
    <path d="M20 10.5v3" />
  </svg>
);

// Speech bubble + ichida uchta nuqta — suhbat.
export const NavChat: React.FC<IconProps> = ({ className, ...rest }) => (
  <svg {...svgBase(className)} {...rest}>
    <path d="M4.5 6a2.5 2.5 0 0 1 2.5-2.5h10A2.5 2.5 0 0 1 19.5 6v8a2.5 2.5 0 0 1-2.5 2.5H10l-3.6 3.2a.6.6 0 0 1-1-.45V16.5H7A2.5 2.5 0 0 1 4.5 14z" />
    <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="12" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

// Sliderlar — 3 ta gorizontal slider + dumaloq knob. Sozlamalar uchun.
export const NavSettings: React.FC<IconProps> = ({ className, ...rest }) => (
  <svg {...svgBase(className)} {...rest}>
    <path d="M4 7h7" />
    <path d="M15 7h5" />
    <circle cx="13" cy="7" r="2" />
    <path d="M4 12h3" />
    <path d="M11 12h9" />
    <circle cx="9" cy="12" r="2" />
    <path d="M4 17h11" />
    <path d="M19 17h1" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);
