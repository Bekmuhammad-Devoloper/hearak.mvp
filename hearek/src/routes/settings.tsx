import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Settings layout — pure pass-through. Child route'lar (settings.index,
 * settings.profile, settings.children, settings.notifications, settings.language)
 * to'liq sahifani o'zlari render qiladi (har biri o'z MobileShell'iga ega).
 */
export const Route = createFileRoute("/settings")({ component: SettingsLayout });

function SettingsLayout() {
  return <Outlet />;
}
