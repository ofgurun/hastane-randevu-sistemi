import { useState } from "react";
import { Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { createLeaveRequest } from "../services/doctorService";
import { todayStr } from "../utils/ui";

const inputCls =
  "h-11 w-full rounded-[11px] border border-stone-200 bg-stone-50 px-3 text-sm text-stone-800 outline-none transition focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-stone-100";

// Doktorun kendi izin talebi — admin onayına düşer (izin hemen uygulanmaz).
export default function LeaveRequestModal({ onClose, onCreated }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const today = todayStr();

  const submit = async () => {
    if (!startDate || !endDate) {
      toast.error("Lütfen başlangıç ve bitiş tarihlerini seçin.");
      return;
    }
    if (endDate < startDate) {
      toast.error("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Lütfen izin talebiniz için bir açıklama yazın.");
      return;
    }
    setLoading(true);
    try {
      const created = await createLeaveRequest(startDate, endDate, reason.trim());
      toast.success("İzin talebiniz yönetici onayına iletildi.");
      onCreated(created);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "İzin talebi oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={() => !loading && onClose()} maxWidth="max-w-[440px]">
      <div className="p-7">
        <h3 className="mb-1.5 text-xl font-extrabold">İzin talep et</h3>
        <p className="mb-5 text-[13.5px] text-stone-500">Talebiniz yönetici onayına gönderilecektir.</p>

        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">Başlangıç</span>
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && endDate < e.target.value) setEndDate("");
              }}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">Bitiş</span>
            <input
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!startDate}
              className={inputCls}
            />
          </label>
        </div>

        <label className="mb-3.5 block">
          <span className="mb-1.5 block text-[12.5px] font-semibold text-stone-600">
            Açıklama <span className="font-medium text-stone-400">(yöneticiye iletilir)</span>
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Örn. Yıllık izin, sağlık raporu, kongre katılımı…"
            className="h-20 w-full resize-y rounded-[11px] border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-teal-500"
          />
        </label>

        <div className="mb-[22px] flex items-start gap-2.5 rounded-[11px] border border-amber-200 bg-amber-50 px-3.5 py-3">
          <Info className="mt-0.5 h-[17px] w-[17px] shrink-0 text-amber-700" />
          <span className="text-[12.5px] leading-normal text-amber-800">
            İzin bitiş tarihi <b>işe dönüş tarihidir</b>; belirtilen aralık dahil kapatılır. Onay
            sonrası aralıktaki aktif randevularınız yedek doktorunuza aktarılır.
          </span>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-[46px] flex-1 rounded-[11px] border border-stone-200 bg-white text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
          >
            Vazgeç
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex h-[46px] flex-[1.3] items-center justify-center gap-2 rounded-[11px] bg-teal-600 text-sm font-bold text-white shadow-[0_6px_16px_rgba(13,148,136,.28)] transition hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Talep Gönder
          </button>
        </div>
      </div>
    </Modal>
  );
}
