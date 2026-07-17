// Durum rozetleri — uygulama genelinde tek renk semantiği:
// AKTIF mavi · TAMAMLANDI yeşil · IPTAL gri · GECTI/BEKLIYOR turuncu · REDDEDILDI kırmızı
const BADGES = {
  AKTIF: { label: "Aktif", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  TAMAMLANDI: { label: "Tamamlandı", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  IPTAL: { label: "İptal", cls: "text-stone-500 bg-stone-100 border-stone-200" },
  GECTI: { label: "Tarihi Geçti", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  BEKLIYOR: { label: "Bekliyor", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  ONAYLANDI: { label: "Onaylandı", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  REDDEDILDI: { label: "Reddedildi", cls: "text-red-600 bg-red-50 border-red-200" },
};

export default function StatusBadge({ status }) {
  const b = BADGES[status] || BADGES.AKTIF;
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold ${b.cls}`}>
      {b.label}
    </span>
  );
}
