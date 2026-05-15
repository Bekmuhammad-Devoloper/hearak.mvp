import { createFileRoute } from "@tanstack/react-router";
import { Play, Clock } from "lucide-react";
import { MarjaShell, PhoneStatusBar } from "@/components/MarjaShell";

export const Route = createFileRoute("/marja/courses")({ component: CoursesPage });

const courses = [
  { title: "Python Programming Masterclass", lessons: "24 darslik", progress: 65, emoji: "🐍", bg: "bg-slate-900" },
  { title: "Advanced Mathematics", lessons: "18 darslik", progress: 30, emoji: "📐", bg: "bg-violet-100" },
  { title: "UI/UX Design Foundations", lessons: "12 darslik", progress: 100, emoji: "🎨", bg: "bg-rose-100" },
];

function CoursesPage() {
  return (
    <MarjaShell>
      <PhoneStatusBar />
      <div className="px-5 pt-5">
        <h1 className="font-display text-2xl font-bold text-slate-900">Kurslarim</h1>
        <p className="text-slate-500 text-sm mt-1">Davom etayotgan kurslaringiz</p>
      </div>

      <div className="px-5 pt-4 space-y-3">
        {courses.map((c) => (
          <div key={c.title} className="bg-white rounded-2xl p-4 flex gap-3 items-center">
            <div className={"size-16 rounded-xl flex items-center justify-center text-3xl shrink-0 " + c.bg}>{c.emoji}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 leading-tight">{c.title}</h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <Clock className="size-3.5" /> {c.lessons}
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#2f5bff] rounded-full" style={{ width: c.progress + "%" }} />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{c.progress}% bajarildi</div>
            </div>
            <button className="size-10 rounded-full bg-[#2f5bff] text-white flex items-center justify-center shrink-0">
              <Play className="size-4 fill-current" />
            </button>
          </div>
        ))}
      </div>
    </MarjaShell>
  );
}
