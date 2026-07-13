import { HeartPulse } from "lucide-react";

// Marka logosu. `light` koyu zeminde (sol panel) beyaz varyant için kullanılır.
export default function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl shadow-lg ${
          light ? "bg-white text-blue-700 shadow-black/20" : "bg-blue-600 text-white shadow-blue-600/30"
        }`}
      >
        <HeartPulse className="h-6 w-6" />
      </div>
      <div className="leading-tight">
        <p className={`text-lg font-bold ${light ? "text-white" : "text-slate-900"}`}>MediRandevu</p>
        <p className={`text-xs ${light ? "text-blue-200" : "text-slate-500"}`}>Hastane Randevu Sistemi</p>
      </div>
    </div>
  );
}
