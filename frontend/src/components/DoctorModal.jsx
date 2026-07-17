import { X, User, Loader2, CalendarPlus, Star } from "lucide-react";

// Seçili bölümün doktorlarını gösteren modal.
// "Randevu Al" (Gün 9) → onBook(doctor) ile randevu alma akışını açar.
export default function DoctorModal({ department, doctors, loading, onClose, onBook }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Bölüm</p>
            <h2 className="text-lg font-bold text-slate-900">{department.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Gövde */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Doktorlar yükleniyor…
            </div>
          )}

          {!loading && doctors.length === 0 && (
            <p className="py-10 text-center text-slate-500">Bu bölümde henüz doktor bulunmuyor.</p>
          )}

          {!loading && doctors.length > 0 && (
            <ul className="space-y-3">
              {doctors.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 text-blue-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{d.user?.name}</p>
                      <p className="text-sm text-slate-500">{d.title}</p>
                      {d.reviewCount > 0 ? (
                        <p className="mt-0.5 flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-slate-700">{d.averageRating}</span>
                          <span className="text-slate-400">/ 5 · {d.reviewCount} Değerlendirme</span>
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-slate-400">Henüz değerlendirme yok</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBook(d)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <CalendarPlus className="h-4 w-4" /> Randevu Al
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
