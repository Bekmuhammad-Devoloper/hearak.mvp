import { createFileRoute } from "@tanstack/react-router";
import { Plus, Users, Clock, Star, Edit2 } from "lucide-react";
import { AdminShell, StatusBadge } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/courses")({ component: AdminCourses });

const courses = [
  { title: "Python Programming Masterclass", category: "Dasturlash", lessons: 24, students: 1284, price: "$49.99", rating: 4.8, status: "active" as const, emoji: "🐍", bg: "bg-slate-900" },
  { title: "Advanced Mathematics Bundle", category: "Matematika", lessons: 18, students: 842, price: "$85.00", rating: 4.6, status: "active" as const, emoji: "📐", bg: "bg-violet-100" },
  { title: "UI/UX Design Foundations", category: "Dizayn", lessons: 12, students: 567, price: "$39.00", rating: 4.9, status: "active" as const, emoji: "🎨", bg: "bg-rose-100" },
  { title: "React for Beginners", category: "Dasturlash", lessons: 16, students: 920, price: "$59.00", rating: 4.7, status: "active" as const, emoji: "⚛️", bg: "bg-sky-100" },
  { title: "Photography Masterclass", category: "Fotografiya", lessons: 22, students: 0, price: "$45.00", rating: 0, status: "draft" as const, emoji: "📷", bg: "bg-amber-100" },
  { title: "Robotics Starter", category: "Texnika", lessons: 14, students: 410, price: "$55.00", rating: 4.5, status: "active" as const, emoji: "🤖", bg: "bg-slate-200" },
];

function AdminCourses() {
  return (
    <AdminShell pageTitle="Kurslar">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Jami {courses.length} ta kurs</p>
        <button className="h-10 px-4 rounded-xl bg-[#2f5bff] text-white text-sm font-semibold inline-flex items-center gap-2">
          <Plus className="size-4" /> Yangi kurs
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        {courses.map((c) => (
          <div key={c.title} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className={"aspect-[16/9] flex items-center justify-center text-7xl " + c.bg}>{c.emoji}</div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#2f5bff] bg-[#eaf0ff] px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                  <h3 className="mt-2 font-display font-bold text-slate-900 leading-tight">{c.title}</h3>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {c.lessons} darslik
                </div>
                <div className="flex items-center gap-1">
                  <Users className="size-3.5" /> {c.students} talaba
                </div>
                {c.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" /> {c.rating}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="font-bold text-[#2f5bff]">{c.price}</div>
                <button className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100">
                  <Edit2 className="size-3.5" /> Tahrirlash
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
