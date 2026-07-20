import { useEffect, useState } from "react";
import { ChevronLeft, CalendarPlus, AlertTriangle, CalendarX2, BellOff } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import BookingView from "../components/BookingView";
import { getDepartments, getDepartmentAvailabilitySummary } from "../services/departmentService";
import { getAllDoctors } from "../services/doctorService";
import useAuthStore from "../store/authStore";
import { deptAbbr, tileColor, initials, MONTHS } from "../utils/ui";
import { deptVisual } from "../utils/deptVisual";

// "YYYY-MM-DD" → { day, month } (rozet için)
function slotBadgeParts(nextSlot) {
  const [y, m, d] = nextSlot.date.split("-").map(Number);
  return { day: d, month: MONTHS[m - 1], time: nextSlot.time, year: y };
}

// Yıldız dizisi: 4.5 → ★★★★★ içinde dolu kısım
function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <span className="text-[15px] leading-none tracking-[1px] text-amber-500">
      {"★".repeat(full)}
      <span className="text-stone-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}

// Yükleme iskeleti — bölüm kartları
function DeptSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[104px] animate-pulse rounded-[18px] bg-stone-200" />
      ))}
    </div>
  );
}

// Hasta Ana Sayfası — üç görünümlü akış: bölümler → doktorlar → randevu alma.
// Erişim güvenliği App.jsx'teki ProtectedRoute ile merkezi olarak sağlanır.
export default function Home() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]); // tüm doktorlar (puanlarla)
  const [summary, setSummary] = useState({}); // deptId → { availableCount, nextSlot }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [view, setView] = useState("home"); // home | doctors | booking
  const [selectedDept, setSelectedDept] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const [deps, docs, sum] = await Promise.all([
        getDepartments(),
        getAllDoctors(),
        getDepartmentAvailabilitySummary().catch(() => []), // özet başarısız olsa da sayfa açılsın
      ]);
      setDepartments(deps);
      setDoctors(docs);
      setSummary(Object.fromEntries(sum.map((s) => [s.id, s])));
    } catch {
      setLoadError(true);
      toast.error("Bölümler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deptIndex = (dept) => departments.findIndex((d) => d.id === dept.id);
  const deptDoctors = selectedDept
    ? doctors.filter((d) => d.department?.id === selectedDept.id)
    : [];

  // ── Randevu alma görünümü ──
  if (view === "booking" && bookingDoctor) {
    return (
      <div className="min-h-screen bg-stone-100">
        <Navbar />
        <BookingView doctor={bookingDoctor} onBack={() => setView("doctors")} />
      </div>
    );
  }

  // ── Doktor listesi görünümü ──
  if (view === "doctors" && selectedDept) {
    const tc = tileColor(deptIndex(selectedDept));
    return (
      <div className="min-h-screen bg-stone-100">
        <Navbar />
        <main className="mx-auto max-w-[1100px] animate-fadeUp px-6 pb-16 pt-7">
          <button
            onClick={() => setView("home")}
            className="mb-[18px] inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-stone-500 transition hover:text-stone-700"
          >
            <ChevronLeft className="h-[17px] w-[17px]" /> Bölümlere dön
          </button>
          <div className="mb-[26px] flex items-center gap-3.5">
            <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-[15px] text-lg font-extrabold ${tc.bg} ${tc.text}`}>
              {deptAbbr(selectedDept.name)}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{selectedDept.name}</h1>
              <p className="text-sm text-stone-500">{selectedDept.description}</p>
            </div>
          </div>

          {deptDoctors.length === 0 ? (
            <div className="rounded-[18px] border border-stone-200 bg-white px-5 py-[52px] text-center">
              <div className="mb-1 text-base font-bold">Bu bölümde doktor bulunmuyor</div>
              <div className="text-sm text-stone-500">Yakında yeni doktorlar eklenecek.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {deptDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center gap-[18px] rounded-[18px] border border-stone-200 bg-white px-[22px] py-5"
                >
                  <div className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-lg font-extrabold text-teal-700">
                    {initials(doc.user?.name)}
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <div className="mb-0.5 text-xs font-bold uppercase tracking-wide text-teal-600">
                      {doc.title}
                    </div>
                    <div className="mb-1.5 text-[17px] font-bold tracking-tight">{doc.user?.name}</div>
                    <div className="flex items-center gap-2">
                      {doc.reviewCount > 0 ? (
                        <>
                          <Stars rating={doc.averageRating} />
                          <span className="text-[13px] font-semibold text-stone-600">
                            {doc.averageRating} / 5 · {doc.reviewCount} Değerlendirme
                          </span>
                        </>
                      ) : (
                        <span className="rounded-[20px] bg-stone-100 px-2.5 py-[3px] text-[12.5px] font-semibold text-stone-400">
                          Henüz değerlendirme yok
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setBookingDoctor(doc);
                      setView("booking");
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-[11px] bg-teal-600 px-[22px] text-sm font-bold text-white shadow-[0_5px_14px_rgba(13,148,136,.24)] transition hover:bg-teal-700"
                  >
                    <CalendarPlus className="h-[17px] w-[17px]" /> Randevu Al
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── Ana görünüm: hero + bölüm kartları ──
  return (
    <div className="min-h-screen bg-stone-100">
      <Navbar />
      <main className="mx-auto max-w-[1200px] animate-fadeUp px-6 pb-16 pt-9">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-[22px] bg-gradient-to-br from-teal-700 to-teal-600 px-9 py-[34px] text-white">
          <div className="absolute -top-24 right-[-40px] h-[280px] w-[280px] rounded-full bg-white/[.08]" />
          <div className="relative">
            <div className="mb-1.5 text-[13px] font-semibold text-white/80">
              Merhaba {user?.name?.split(" ")[0]} 👋
            </div>
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
              Hangi bölümden randevu almak istersiniz?
            </h1>
            <p className="max-w-[560px] text-[15px] text-white/85">
              İlgili bölümü seçin, uzman doktorlarımızı ve uygunluk takvimini görüntüleyin.
            </p>
          </div>
        </div>

        <div className="mb-[18px] flex items-baseline justify-between">
          <h2 className="text-[19px] font-extrabold tracking-tight">Bölümler</h2>
          {!loading && !loadError && (
            <span className="text-[13px] font-semibold text-stone-400">{departments.length} bölüm</span>
          )}
        </div>

        {loading && <DeptSkeleton />}

        {!loading && loadError && (
          <div className="rounded-[18px] border border-stone-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-[26px] w-[26px] text-red-600" />
            </div>
            <div className="mb-1 text-base font-bold">Bölümler yüklenemedi</div>
            <div className="mb-[18px] text-sm text-stone-500">Bağlantı hatası oluştu. Lütfen tekrar deneyin.</div>
            <button
              onClick={load}
              className="h-[42px] rounded-[10px] bg-teal-600 px-[22px] text-sm font-bold text-white transition hover:bg-teal-700"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {!loading && !loadError && departments.length === 0 && (
          <div className="rounded-[18px] border border-stone-200 bg-white px-5 py-14 text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
              <CalendarX2 className="h-[26px] w-[26px] text-stone-400" />
            </div>
            <div className="mb-1 text-base font-bold">Henüz bölüm bulunmuyor</div>
            <div className="text-sm text-stone-500">Bölümler eklendiğinde burada görünecek.</div>
          </div>
        )}

        {!loading && !loadError && departments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {departments.map((dept, i) => {
              const { Icon, gradient } = deptVisual(dept.name, i);
              const s = summary[dept.id];
              const count = s?.availableCount ?? 0;
              const nextSlot = s?.nextSlot || null;
              const badge = nextSlot ? slotBadgeParts(nextSlot) : null;
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDept(dept);
                    setView("doctors");
                  }}
                  className={`group relative flex items-center gap-4 overflow-hidden rounded-[18px] bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-sm transition duration-150 hover:-translate-y-[3px] hover:shadow-[0_14px_30px_rgba(0,0,0,.18)]`}
                >
                  {/* Dekoratif halka */}
                  <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />

                  {/* İkon */}
                  <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-white/20 backdrop-blur-sm">
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>

                  {/* Metin */}
                  <div className="relative min-w-0 flex-1">
                    <div className="truncate text-[18px] font-extrabold tracking-tight">{dept.name}</div>
                    {count > 0 ? (
                      <div className="mt-0.5 text-[13.5px] text-white/85">
                        Uygun randevu sayısı: <span className="font-bold text-white">{count}</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[13.5px] text-white/80">Uygun randevu bulunamadı.</div>
                    )}
                  </div>

                  {/* Sağ rozet: en yakın slot ya da çan-kapalı */}
                  <div className="relative shrink-0">
                    {badge ? (
                      <div className="rounded-[12px] bg-black/25 px-3 py-2 text-center leading-tight backdrop-blur-sm">
                        <div className="text-[20px] font-extrabold">{badge.day}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">{badge.month}</div>
                        <div className="mt-0.5 text-[12px] font-bold">{badge.time}</div>
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-black/20 backdrop-blur-sm">
                        <BellOff className="h-5 w-5 text-white/80" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
