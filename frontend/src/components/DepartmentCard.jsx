import { Stethoscope, Heart, Brain, Bone, Eye, Baby, Activity, Ear } from "lucide-react";

// Bölüm adına göre yaklaşık ikon eşleştirmesi (aksi halde Stethoscope).
function iconFor(name = "") {
  const n = name.toLocaleLowerCase("tr");
  if (n.includes("kardiyo") || n.includes("kalp")) return Heart;
  if (n.includes("nöro") || n.includes("beyin")) return Brain;
  if (n.includes("ortoped") || n.includes("kemik")) return Bone;
  if (n.includes("göz")) return Eye;
  if (n.includes("çocuk") || n.includes("pediatri")) return Baby;
  if (n.includes("kbb") || n.includes("kulak")) return Ear;
  if (n.includes("dahiliye") || n.includes("iç hast")) return Activity;
  return Stethoscope;
}

export default function DepartmentCard({ department, onClick }) {
  const Icon = iconFor(department.name);
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{department.name}</h3>
        {department.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{department.description}</p>
        )}
      </div>
      <span className="mt-auto text-sm font-medium text-blue-600 group-hover:text-blue-700">
        Doktorları gör →
      </span>
    </button>
  );
}
