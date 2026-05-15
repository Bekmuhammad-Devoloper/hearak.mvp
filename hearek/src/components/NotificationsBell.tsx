import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/queries";
import { getToken } from "@/lib/api";
import { useEffect, useState } from "react";

export function NotificationsBell() {
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    setHasToken(!!getToken());
  }, []);

  if (!hasToken) return null;
  return <BellInner />;
}

function BellInner() {
  const { data } = useNotifications();
  const unread = data?.unread ?? 0;

  return (
    <Link
      to="/notifications"
      className="size-10 rounded-full bg-card border border-border shadow-card flex items-center justify-center text-foreground hover:bg-surface relative"
      aria-label="Bildirishnomalar"
    >
      <Bell className="size-5" strokeWidth={1.8} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
