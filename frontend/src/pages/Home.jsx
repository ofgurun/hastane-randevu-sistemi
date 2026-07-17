import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarPlus, AlertTriangle, CalendarX2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import BookingView from "../components/BookingView";
import { getDepartments } from "../services/departmentService";
import { getAllDoctors } from "../services/doctorService";
import useAuthStore from "../store/authStore";
import { deptAbbr, tileColor, initials } from "../utils/ui";

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[130px] rounded-[18px] border border-stone-200 bg-white p-5">
          <div className="h-[46px] w-[46px] rounded-[13px] bg-stone-100" />
          <div className="mt-4 h-3.5 w-3/5 rounded-md bg-stone-100" />
          <div className="mt-2.5 h-[11px] w-4/5 rounded-md bg-stone-50" />
        </div>
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [view, setView] = useState("home"); // home | doctors | booking
  const [selectedDept, setSelectedDept] = useState(null);
  const [bookingDoctor, setBookingDoctor] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const [deps, docs] = await Promise.all([getDepartments(), getAllDoctors()]);
      setDepartments(deps);
      setDoctors(docs);
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {departments.map((dept, i) => {
              const tc = tileColor(i);
              const count = doctors.filter((d) => d.department?.id === dept.id).length;
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDept(dept);
                    setView("doctors");
                  }}
                  className="group flex flex-col rounded-[18px] border border-stone-200 bg-white p-5 text-left transition duration-150 hover:-translate-y-[3px] hover:border-teal-100 hover:shadow-[0_12px_28px_rgba(13,148,136,.12)]"
                >
                  <div className={`mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-[13px] text-base font-extrabold ${tc.bg} ${tc.text}`}>
                    {deptAbbr(dept.name)}
                  </div>
                  <div className="mb-[5px] text-base font-bold tracking-tight">{dept.name}</div>
                  <div className="mb-3.5 text-[13px] leading-normal text-stone-500">
                    {dept.description || "—"}
                  </div>
                  <div className="mt-auto flex items-center gap-1.5 text-[12.5px] font-bold text-teal-600">
                    {count} doktor
                    <ChevronRight className="h-[15px] w-[15px] transition group-hover:translate-x-0.5" />
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
