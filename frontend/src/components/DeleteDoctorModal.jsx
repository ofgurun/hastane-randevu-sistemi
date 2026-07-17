import { useState } from "react";
import { X, Trash2, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { deleteDoctor } from "../services/doctorService";

// Doktoru tamamen kaldırma — iki aşamalı güvenlik:
// 1) "ONAYLIYORUM" yazılmadan devam edilemez, 2) son uyarı + Evet/İptal.
export default function DeleteDoctorModal({ doctor, onClose, onDeleted }) {
  const [stage, setStage] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const canContinue = confirmText === "ONAYLIYORUM";

  const onConfirmDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteDoctor(doctor.id);
      toast.success(
        `Doktor kaldırıldı. ${res.transferred} randevu yedek doktora aktarıldı` +
          (res.cancelled > 0 ? `, ${res.cancelled} çakışan randevu iptal edildi.` : ".")
      );
      onDeleted(doctor.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Doktor kaldırılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Doktoru Kaldır</h2>
              <p className="text-sm text-slate-500">{doctor.user?.name} · {doctor.department?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {stage === 1 ? (
            <>
              <p className="text-sm text-slate-600">
                Bu işlem <span className="font-semibold text-red-600">geri alınamaz</span>. Doktor,
                kullanıcı hesabı ve takvim kayıtları kalıcı olarak silinir; aktif randevuları yedek
                doktoruna aktarılır.
              </p>
              <label htmlFor="confirm-text" className="mt-4 block text-sm font-medium text-slate-700">
                Devam etmek için büyük harflerle <span className="font-mono font-bold">ONAYLIYORUM</span> yazın:
              </label>
              <input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ONAYLIYORUM"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-slate-900 placeholder-slate-300 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
              />
              <button
                onClick={() => setStage(2)}
                disabled={!canContinue}
                className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Devam Et
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm font-medium text-red-700">
                  Doktoru tamamen kaldırmak istediğinizden emin misiniz? Aktif randevuları yedek
                  doktoruna aktarılacaktır.
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  onClick={onConfirmDelete}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  Evet, Sil
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
