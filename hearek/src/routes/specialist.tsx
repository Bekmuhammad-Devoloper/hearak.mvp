import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Specialist layout — pure pass-through. Child route'lar
 * (specialist.index, specialist.$id) o'z UI'larini to'liq render qiladi.
 */
export const Route = createFileRoute("/specialist")({ component: SpecialistLayout });

function SpecialistLayout() {
  return <Outlet />;
}
