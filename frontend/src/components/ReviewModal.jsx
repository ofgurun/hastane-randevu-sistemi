import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { createReview } from "../services/reviewService";

const RATING_LABELS = ["Puan seçin", "Kötü", "İdare eder", "İyi", "Çok iyi", "Mükemmel"];

// Geçmiş randevu için değerlendirme modalı: 1-5 yıldız + yorum.
// Başarı/409 durumunda randevu "değerlendirildi" olarak işaretlenir (onReviewed).
export default function ReviewModal({ appointment, onClose, onReviewed }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (rating < 1) {
      toast.error("Lütfen 1-5 arası bir puan seçin.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Lütfen bir yorum yazın.");
      return;
    }

    setSubmitting(true);
    try {
      await createReview(appointment.id, rating, comment.trim());
      toast.success("Değerlendirmeniz için teşekkürler!");
      onReviewed(appointment.id);
      onClose();
    } catch (err) {
      // Zaten değerlendirilmişse (409) yine de butonu gizle.
      if (err.response?.status === 409) {
        toast.error(err.response?.data?.message || "Bu randevu zaten değerlendirilmiş.");
        onReviewed(appointment.id);
        onClose();
      } else {
        toast.error(err.response?.data?.message || "Değerlendirme kaydedilemedi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const active = hover || rating;

  return (
    <Modal onClose={() => !submitting && onClose()} maxWidth="max-w-[440px]">
      <div className="p-7">
        <h3 className="mb-1 text-xl font-extrabold">Randevunuzu değerlendirin</h3>
        <p className="mb-5 text-[13.5px] text-stone-500">
          {appointment.doctor?.user?.name} · {appointment.doctor?.department?.name}
        </p>

        <div className="mb-2 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} yıldız`}
              className={`px-0.5 text-[38px] leading-none transition ${
                n <= active ? "text-amber-500" : "text-stone-200"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <div className="mb-[18px] text-center text-[13px] font-bold text-stone-600">
          {RATING_LABELS[active]}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Deneyiminizi paylaşın…"
          className="mb-5 h-24 w-full resize-y rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-sm text-stone-800 outline-none transition focus:border-teal-500"
        />

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="h-[46px] flex-1 rounded-[11px] border border-stone-200 bg-white text-sm font-bold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
          >
            Vazgeç
          </button>
          <button
            onClick={submit}
            disabled={submitting || rating === 0}
            className={`flex h-[46px] flex-[1.3] items-center justify-center gap-2 rounded-[11px] text-sm font-bold text-white transition ${
              rating === 0
                ? "cursor-not-allowed bg-stone-300"
                : "bg-teal-600 hover:bg-teal-700"
            } disabled:opacity-80`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Değerlendir
          </button>
        </div>
      </div>
    </Modal>
  );
}
