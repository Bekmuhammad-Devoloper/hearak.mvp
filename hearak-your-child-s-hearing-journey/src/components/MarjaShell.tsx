import { Link, useLocation } from "@tanstack/react-router";
import { Home, Store, BookOpen, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/marja", icon: Home, label: "Bosh sahifa", match: (p: string) => p === "/marja" },
  { to: "/marja/market", icon: Store, label: "Market", match: (p: string) => p.startsWith("/marja/market") || p.startsWith("/marja/product") },
  { to: "/marja/courses", icon: BookOpen, label: "Kurslarim", match: (p: string) => p.startsWith("/marja/courses") },
  { to: "/marja/services", icon: Menu, label: "Xizmatlar", match: (p: string) => p.startsWith("/marja/services") },
  { to: "/marja/profile", icon: User, label: "Profile", match: (p: string) => p.startsWith("/marja/profile") || p.startsWith("/marja/orders") },
];

export function MarjaShell({ children, activePath }: { children: React.ReactNode; activePath?: string }) {
  const loc = useLocation();
  const path = activePath ?? loc.pathname;
  return (
    <div className="min-h-screen bg-[#f5f7fb] flex justify-center">
      <div className="w-full max-w-[420px] flex flex-col min-h-screen relative bg-[#f5f7fb]">
        <main className="flex-1 pb-[88px]">{children}</main>
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] border-t border-slate-200 bg-white px-2 pt-2 pb-3">
          <div className="grid grid-cols-5">
            {tabs.map((tab) => {
              const active = tab.match(path);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-1.5 transition-colors",
                    active ? "text-[#2f5bff]" : "text-slate-400"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} />
                  <span className="text-[11px] font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function PhoneStatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[15px] font-semibold text-slate-900">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="0.5" />
      <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
      <path d="M8 11l2.5-3a3 3 0 00-5 0L8 11z" />
      <path d="M8 6.5a5.5 5.5 0 014 1.7l1.5-1.7a8 8 0 00-11 0L4 8.2A5.5 5.5 0 018 6.5z" opacity=".85" />
      <path d="M8 2a10 10 0 017.3 3l1.2-1.4a12 12 0 00-17 0L.8 5A10 10 0 018 2z" opacity=".7" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
      <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity=".4" />
      <rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor" />
      <rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5" />
    </svg>
  );
}
