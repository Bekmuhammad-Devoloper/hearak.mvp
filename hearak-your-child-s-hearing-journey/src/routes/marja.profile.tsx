import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt, Heart, MapPin, Bell, Shield, LogOut, ChevronRight } from "lucide-react";
import { MarjaShell, PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/profile")({ component: ProfilePage });

function ProfilePage() {
  return (
    <MarjaShell>
      <PhoneStatusBar />

      <div className="px-5 pt-5">
        <h1 className="font-display text-2xl font-bold text-slate-900">Profile</h1>
      </div>

      <div className="px-5 pt-4">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
          <div className="size-14 rounded-full bg-gradient-to-br from-[#2f5bff] to-violet-500 text-white font-bold text-lg flex items-center justify-center">BD</div>
          <div className="flex-1">
            <div className="font-bold text-slate-900">Bekmuhammad D.</div>
            <div className="text-sm text-slate-500">bekmuhammad.devoloper@gmail.com</div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-2">
        <Row to="/marja/orders" icon={Receipt} title="Buyurtmalar tarixi" />
        <Row icon={Heart} title="Sevimlilar" />
        <Row icon={MapPin} title="Manzillar" />
        <Row icon={Bell} title="Bildirishnomalar" />
        <Row icon={Shield} title="Maxfiylik" />
        <Row icon={LogOut} title="Chiqish" danger />
      </div>
    </MarjaShell>
  );
}

function Row({ icon: Icon, title, to, danger }: { icon: typeof Receipt; title: string; to?: string; danger?: boolean }) {
  const inner = (
    <div className={"bg-white rounded-2xl p-4 flex items-center gap-3 " + (danger ? "text-rose-600" : "text-slate-900")}>
      <div className={"size-10 rounded-xl flex items-center justify-center " + (danger ? "bg-rose-50" : "bg-slate-100")}>
        <Icon className={"size-5 " + (danger ? "text-rose-600" : "text-slate-700")} />
      </div>
      <div className="flex-1 font-medium">{title}</div>
      <ChevronRight className="size-4 text-slate-400" />
    </div>
  );
  return to ? <Link to={to as any}>{inner}</Link> : <button className="w-full text-left">{inner}</button>;
}
