import { Link, useLocation } from "@tanstack/react-router";
import { Home, Activity, Sparkles, MessageCircle, Settings } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", icon: Home, label: t("home") },
  { to: "/progress", icon: Activity, label: t("progress") },
  { to: "/exercises", icon: Sparkles, label: t("exercises") },
  { to: "/chat", icon: MessageCircle, label: t("chat") },
  { to: "/settings", icon: Settings, label: t("settings") },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen relative">
        <main className="flex-1 pb-24">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-card/95 backdrop-blur px-2 py-2 shadow-card">
          <div className="grid grid-cols-5 gap-1">
            {tabs.map((tab) => {
              const active = loc.pathname.startsWith(tab.to);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 rounded-xl transition-colors",
                    active ? "text-primary bg-primary-soft" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
