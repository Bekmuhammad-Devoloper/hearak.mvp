import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Heart, Activity, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const slides = [
  {
    icon: Heart,
    title: "Har bir kun — kichik g'alaba",
    text: "Bolangizning eshitish va nutq sayohatini implantatsiya kunidan boshlab kuzating.",
    color: "text-warm",
  },
  {
    icon: Activity,
    title: "Bugungi 5 daqiqa",
    text: "Har kuni qisqa va sodda mashqlar — o'yin, nutq va eshitish bo'yicha.",
    color: "text-primary",
  },
  {
    icon: MessageCircle,
    title: "Yolg'iz emassiz",
    text: "Mutaxassis bilan bog'lanib turing va istalgan vaqtda yordamchidan so'rang.",
    color: "text-accent-foreground",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const slide = slides[i];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8 max-w-md mx-auto">
      <div className="flex justify-end">
        <Link to="/auth"><Button variant="ghost" size="sm">O'tkazib yuborish</Button></Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className={cn("size-32 rounded-full bg-primary-soft flex items-center justify-center mb-10", slide.color)}>
          <Icon className="size-14" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-3xl font-semibold mb-3">{slide.title}</h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">{slide.text}</p>
      </div>
      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, idx) => (
          <div key={idx} className={cn("h-2 rounded-full transition-all", idx === i ? "w-8 bg-primary" : "w-2 bg-border")} />
        ))}
      </div>
      <Button
        size="lg"
        className="w-full h-14 text-base rounded-2xl"
        onClick={() => i < slides.length - 1 ? setI(i + 1) : nav({ to: "/auth" })}
      >
        {i < slides.length - 1 ? "Davom etish" : "Boshlash"}
      </Button>
    </div>
  );
}
