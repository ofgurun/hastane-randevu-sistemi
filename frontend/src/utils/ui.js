// Tasarım sistemi yardımcıları — MediRandevu prototipiyle birebir
// (teal vurgu, stone zemin, rozet renk semantiği, bölüm karo paleti).

export const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
export const MONTHS_ABBR = [
  "OCA", "ŞUB", "MAR", "NİS", "MAY", "HAZ",
  "TEM", "AĞU", "EYL", "EKİ", "KAS", "ARA",
];
export const DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
export const WEEK_HEADER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// "Ad Soyad" → "AS" (Dr./Prof. gibi kısaltmaları atlar)
export function initials(name = "") {
  return name
    .split(" ")
    .filter((w) => w && !/^(dr\.?|prof\.?|doç\.?|uzm\.?|op\.?)$/i.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr");
}

// Bölüm adı → karo kısaltması ("Göz Hastalıkları" → "GH")
export function deptAbbr(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr");
}

// Bölüm karoları için renk paleti (indekse göre döner)
export const TILE_COLORS = [
  { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-100" },
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
  { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100" },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-100" },
  { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100" },
  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
];
export const tileColor = (i) => TILE_COLORS[i % TILE_COLORS.length];

// Bugünün "YYYY-MM-DD" karşılığı (yerel)
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ISO veya "YYYY-MM-DD" → "17 Temmuz 2026, Cum"
export function fmtLong(input) {
  const d = new Date(typeof input === "string" && input.length === 10 ? input + "T00:00:00" : input);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAYS_SHORT[d.getDay()]}`;
}

// ISO veya "YYYY-MM-DD" → "17 TEM"
export function fmtShort(input) {
  const d = new Date(typeof input === "string" && input.length === 10 ? input + "T00:00:00" : input);
  return `${d.getDate()} ${MONTHS_ABBR[d.getMonth()]}`;
}

// Randevunun başlangıç zamanı (date + timeSlot "HH:mm") → Date
export function apptStart(a) {
  const d = new Date(a.date);
  const [h, m] = a.timeSlot.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}
