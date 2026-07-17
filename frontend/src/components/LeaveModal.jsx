import { useState } from "react";
import { X, CalendarOff, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";
import { setDoctorLeave } from "../services/doctorService";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Doktoru izne ayırma — tarih aralığındaki günler kapatılır,
// aktif randevular yedek doktora aktarılır.
export default function LeaveModal({ doctor, onClose }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const today = todayStr();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Lütfen başlangıç ve bitiş tarihlerini seçin.");
      return;
    }
    if (endDate < startDate) {
      toast.error("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      return;
    }
    setLoading(true);
    try {
      const res = await setDoctorLeave(doctor.id, startDate, endDate);
      toast.success(
        `Doktor başarıyla izne ayrıldı${res.transferred > 0 ? ` ve ${res.transferred} randevu yedek doktora aktarıldı` : ""}.` +
          (res.cancelled > 0 ? ` ${res.cancelled} çakışan randevu iptal edildi.` : "")
      );
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "İzne ayırma yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <CalendarOff className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">İzne Ayır</h2>
              <p className="text-sm text-slate-500">{doctor.user?.name} · {doctor.department?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="leave-start" className="mb-1.5 block text-sm font-medium text-slate-700">
              İzin Başlangıç Tarihini Seçiniz
            </label>
            <input
              id="leave-start"
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && endDate < e.target.value) setEndDate("");
              }}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <div>
            <label htmlFor="leave-end" className="mb-1.5 block text-sm font-medium text-slate-700">
              İzin Bitiş Tarihini Seçiniz
            </label>
            <input
              id="leave-end"
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!startDate}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-700">
              İzin bitiş tarihi işe dönüş tarihiyle aynıdır. Bu tarihler arasındaki mevcut aktif
              randevular yedek doktora aktarılacaktır.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarOff className="h-5 w-5" />}
            İzne Ayır
          </button>
        </form>
      </div>
    </div>
  );
}
