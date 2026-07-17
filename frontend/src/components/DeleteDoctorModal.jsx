import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { deleteDoctor } from "../services/doctorService";

// Doktoru tamamen kaldırma — "ONAYLIYORUM" yazılmadan silme butonu aktifleşmez.
export default function DeleteDoctorModal({ doctor, onClose, onDeleted }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const canDelete = confirmText.trim().toLocaleUpperCase("tr") === "ONAYLIYORUM";

  const onConfirmDelete = async () => {
    if (!canDelete) return;
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
    <Modal onClose={() => !loading && onClose()} maxWidth="max-w-[420px]">
      <div className="p-7">
        <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-red-50">
          <Trash2 className="h-[26px] w-[26px] text-red-600" />
        </div>
        <h3 className="mb-1.5 text-xl font-extrabold">Doktoru kaldır</h3>
        <p className="mb-4 text-sm leading-relaxed text-stone-500">
          <b className="text-stone-800">{doctor.user?.name}</b> kalıcı olarak kaldırılacak.
          Gelecekteki aktif randevular yedek doktora aktarılacaktır. Bu işlem geri alınamaz.
        </p>
        <div className="mb-2 text-[13px] font-semibold text-stone-600">
          Onaylamak için <b className="text-red-600">ONAYLIYORUM</b> yazın:
        </div>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="ONAYLIYORUM"
          className="mb-5 h-[46px] w-full rounded-[11px] border border-stone-200 bg-stone-50 px-3.5 text-[14.5px] tracking-[.06em] text-stone-800 outline-none transition focus:border-red-400"
        />
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-[46px] flex-1 rounded-[11px] border border-stone-200 bg-white text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirmDelete}
            disabled={!canDelete || loading}
            className={`flex h-[46px] flex-[1.4] items-center justify-center gap-2 rounded-[11px] text-sm font-bold text-white transition ${
              canDelete ? "bg-red-600 hover:bg-red-700" : "cursor-not-allowed bg-red-200"
            } disabled:opacity-90`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kalıcı Olarak Kaldır
          </button>
        </div>
      </div>
    </Modal>
  );
}
