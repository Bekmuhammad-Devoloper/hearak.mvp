import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Hearak brand belgisi — bitta yagona rasm: `/icon.png`.
 *
 * - `BrandLogo` — yorqin halo bilan, splash/auth uchun
 * - `Logomark` — soddaroq, header/footer/inline uchun
 *
 * Ikkalasi ham bir xil rasmni dumaloq frame ichida ko'rsatadi. Boshqa
 * brand belgisi (SVG wave/ear va h.k.) loyihada YO'Q. Yagona logo qoidasi.
 *
 * Bottom navigation ikonlari Lucide standart to'plamidan (`BottomNav.tsx`).
 */

type LogoProps = {
  className?: string;
  /** Atrofdagi yumshoq halo (splash/auth uchun). Default `true`. */
  haloed?: boolean;
  /** Tashqi `ring` chiziq. Default `true`. */
  ringed?: boolean;
};

// Hisoblangan icon URL: rasm public/icon.png'da. Manfest cache-bust uchun yagona joy.
const ICON_SRC = "/icon.png";

const LogoCircle: React.FC<LogoProps> = ({ className, haloed, ringed = true }) => (
  <div
    className={cn(
      "relative inline-flex aspect-square items-center justify-center",
      className,
    )}
  >
    {haloed && (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-14%] rounded-full bg-primary/15 blur-2xl"
      />
    )}
    <div
      role="img"
      aria-label="Hearak"
      className={cn(
        "relative h-full w-full rounded-full bg-card bg-no-repeat",
        ringed && "shadow-soft ring-1 ring-border/40",
      )}
      style={{
        backgroundImage: `url('${ICON_SRC}')`,
        // 140% size + 32% vertical pozitsiya — rasmdagi "Hearak" matnini
        // dumaloq kesimdan tashqariga chiqaradi, faqat illyustratsiya ko'rinadi.
        backgroundSize: "140%",
        backgroundPosition: "center 32%",
      }}
    />
  </div>
);

/**
 * Yirik brand belgi (yorqin halo). Splash, auth, key onboarding'da.
 */
export const BrandLogo: React.FC<LogoProps> = ({ haloed = true, ...rest }) => (
  <LogoCircle haloed={haloed} {...rest} />
);

/**
 * Kichik brand belgi (halosiz, sodda). Header, footer, inline.
 * Backwards compat: `duotone` prop nomdan qoldirilgan, lekin ishlatilmaydi.
 */
export const Logomark: React.FC<LogoProps & { duotone?: boolean }> = ({
  haloed = false,
  ringed = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  duotone,
  ...rest
}) => <LogoCircle haloed={haloed} ringed={ringed} {...rest} />;

/**
 * Logo + wordmark gorizontal.
 */
export const LogoWordmark: React.FC<{ className?: string; markClassName?: string }> = ({
  className,
  markClassName,
}) => (
  <div className={cn("inline-flex items-center gap-2.5", className)}>
    <Logomark className={cn("h-8 w-8", markClassName)} />
    <span
      className="font-display text-2xl font-semibold tracking-tight text-foreground"
      style={{ fontFeatureSettings: '"ss01"' }}
    >
      hearak
    </span>
  </div>
);
