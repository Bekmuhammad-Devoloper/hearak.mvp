import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Activity, ArrowRight, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

type Slide = {
  Icon: React.FC<{ className?: string; strokeWidth?: number }>;
  iconClass: string;
  eyebrowKey: "slide0Eyebrow" | "slide1Eyebrow" | "slide2Eyebrow";
  titleKey: "slide0Title" | "slide1Title" | "slide2Title";
  textKey: "slide0Text" | "slide1Text" | "slide2Text";
};

const slides: Slide[] = [
  { Icon: Heart, iconClass: "text-warm-foreground", eyebrowKey: "slide0Eyebrow", titleKey: "slide0Title", textKey: "slide0Text" },
  { Icon: Activity, iconClass: "text-primary", eyebrowKey: "slide1Eyebrow", titleKey: "slide1Title", textKey: "slide1Text" },
  { Icon: MessageCircle, iconClass: "text-foreground", eyebrowKey: "slide2Eyebrow", titleKey: "slide2Title", textKey: "slide2Text" },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const t = useT();
  const slide = slides[i];
  const Icon = slide.Icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {i + 1} / {slides.length}
          </span>
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              {t("skip")}
            </Button>
          </Link>
        </div>

        {/* Markaz — yumshoq aylana ichida ikon */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div
            key={i}
            className="mb-10 animate-in fade-in zoom-in-95 duration-500"
            style={{ animationTimingFunction: "var(--ease-emphasized)" }}
          >
            <div className="grid size-32 place-items-center rounded-full bg-primary-soft">
              <Icon className={cn("size-14", slide.iconClass)} strokeWidth={1.5} />
            </div>
          </div>

          <p
            key={`eyebrow-${i}`}
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground animate-in fade-in duration-300"
          >
          {t(slide.eyebrowKey)}</p>
          <h2
            key={`title-${i}`}
            className="font-display text-[28px] leading-[1.15] font-semibold tracking-tight mb-3 max-w-[18ch] animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationTimingFunction: "var(--ease-emphasized)" }}
          >
          {t(slide.titleKey)}
          </h2>
          <p
            key={`text-${i}`}
            className="text-[15px] leading-relaxed text-muted-foreground max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-700"
            style={{ animationTimingFunction: "var(--ease-emphasized)" }}
          >
          {t(slide.textKey)}
          </p>
        </div>

        {/* Dotlar */}
        <div className="mb-6 flex justify-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Slayd ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all press",
                idx === i ? "w-7 bg-primary" : "w-1.5 bg-border-strong/60 hover:bg-border-strong",
              )}
              style={{ transitionTimingFunction: "var(--ease-emphasized)" }}
            />
          ))}
        </div>

        {/* Davom */}
        <Button
          size="lg"
          className="press w-full h-14 rounded-2xl text-base font-semibold shadow-glow"
          onClick={() => (i < slides.length - 1 ? setI(i + 1) : nav({ to: "/auth" }))}
        >
          {i < slides.length - 1 ? t("continue") : t("getStarted")}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
