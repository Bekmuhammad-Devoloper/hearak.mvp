import { BottomNav } from "./BottomNav";
import { NotificationsBell } from "./NotificationsBell";

export function MobileShell({
  children,
  showBell = false,
}: {
  children: React.ReactNode;
  /** Bildirishnomalar qo'ng'irog'ini ko'rsatish (faqat asosiy sahifada). */
  showBell?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen relative">
        {showBell && (
          <div className="fixed top-3 right-3 z-30">
            <NotificationsBell />
          </div>
        )}
        <main className="flex-1 pb-28">{children}</main>
        <BottomNav />
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
