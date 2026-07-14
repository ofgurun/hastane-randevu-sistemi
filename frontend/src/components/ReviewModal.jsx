import { useState } from "react";
import { X, Star, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";
import { createReview } from "../services/reviewService";

// Geçmiş randevu için değerlendirme modalı: 1-5 yıldız + yorum.
// Başarı/409 durumunda randevu "değerlendirildi" olarak işaretlenir (onReviewed).
export default function ReviewModal({ appointment, onClose, onReviewed }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Değerlendir</p>
            <h2 className="text-lg font-bold text-slate-900">{appointment.doctor?.user?.name}</h2>
            <p className="text-sm text-slate-500">{appointment.doctor?.department?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Puanınız</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="rounded p-1 transition focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  aria-label={`${n} yıldız`}
                >
                  <Star
                    className={`h-8 w-8 transition ${
                      n <= active ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-slate-700">
              Yorumunuz
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyiminizi paylaşın…"
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Gönderiliyor…
              </>
            ) : (
              <>
                <Send className="h-5 w-5" /> Değerlendirmeyi Gönder
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
