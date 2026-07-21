import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  CalendarDays,
  Gauge,
  CheckCircle2,
  XCircle,
  UserX,
  Users,
  Stethoscope,
  Building2,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminStats } from "../services/statsService";

// 0..1 → "%NN"
const pct = (x) => `%${Math.round((x || 0) * 100)}`;
// "YYYY-MM-DD" → "DD.MM"
const shortDate = (ds) => {
  const [, m, d] = ds.split("-");
  return `${d}.${m}`;
};

// Durum renk paleti (donut + rozet)
const STATUS_COLORS = {
  upcoming: "#0d9488",
  completed: "#10b981",
  cancelled: "#f43f5e",
  noShow: "#f59e0b",
};

// ── KPI kartı ──
function Kpi({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="rounded-[16px] border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="text-[12.5px] font-bold text-stone-500">{label}</div>
      </div>
      <div className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-stone-800">{value}</div>
      {sub && <div className="mt-1.5 text-[12px] font-semibold text-stone-400">{sub}</div>}
    </div>
  );
}

// ── Basit alan/çizgi grafik (30 günlük trend) ──
function TrendChart({ data }) {
  const W = 720;
  const H = 220;
  const padX = 8;
  const padY = 18;
  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;
  const x = (i) => padX + (i * (W - 2 * padX)) / Math.max(1, n - 1);
  const y = (v) => padY + (H - 2 * padY) * (1 - v / max);

  const linePts = data.map((d, i) => `${x(i)},${y(d.count)}`).join(" ");
  const areaPts = `${padX},${H - padY} ${linePts} ${W - padX},${H - padY}`;
  const total = data.reduce((s, d) => s + d.count, 0);

  // ~5 x-ekseni etiketi
  const ticks = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];

  return (
    <div className="rounded-[18px] border border-stone-200 bg-white p-5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[14px] font-extrabold text-stone-800">
          <TrendingUp className="h-[18px] w-[18px] text-teal-600" /> Son 30 gün — günlük randevu
        </div>
        <div className="text-[12px] font-semibold text-stone-400">Toplam {total}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* yatay ızgara */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={padX} y1={padY + (H - 2 * padY) * f} x2={W - padX} y2={padY + (H - 2 * padY) * f}
            stroke="#f1f0ee" strokeWidth="1" />
        ))}
        <polygon points={areaPts} fill="url(#trendFill)" />
        <polyline points={linePts} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10.5px] font-semibold text-stone-400">
        {ticks.map((t) => (
          <span key={t}>{data[t] ? shortDate(data[t].date) : ""}</span>
        ))}
      </div>
    </div>
  );
}

// ── Donut (durum dağılımı) ──
function StatusDonut({ items }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const r = 52;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="rounded-[18px] border border-stone-200 bg-white p-5">
      <div className="mb-3 text-[14px] font-extrabold text-stone-800">Randevu durum dağılımı</div>
      <div className="flex items-center gap-5">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f0ee" strokeWidth="16" />
            {total > 0 &&
              items.map((it) => {
                if (it.count === 0) return null;
                const frac = it.count / total;
                const seg = frac * C;
                const el = (
                  <circle
                    key={it.key}
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    stroke={STATUS_COLORS[it.key]}
                    strokeWidth="16"
                    strokeDasharray={`${seg} ${C - seg}`}
                    strokeDashoffset={-acc}
                  />
                );
                acc += seg;
                return el;
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[22px] font-extrabold leading-none text-stone-800">{total}</div>
            <div className="text-[10.5px] font-bold text-stone-400">toplam</div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {items.map((it) => (
            <div key={it.key} className="flex items-center gap-2 text-[12.5px]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[it.key] }} />
              <span className="font-semibold text-stone-600">{it.label}</span>
              <span className="ml-auto font-extrabold text-stone-800">{it.count}</span>
              <span className="w-10 text-right text-[11px] font-semibold text-stone-400">
                {total > 0 ? pct(it.count / total) : "%0"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Yatay çubuk liste (bölüm/doktor) ──
function BarList({ title, icon: Icon, rows, emptyText }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-[18px] border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-stone-800">
        <Icon className="h-[18px] w-[18px] text-teal-600" /> {title}
      </div>
      {rows.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-stone-400">{emptyText}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.key}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="truncate pr-2 font-semibold text-stone-700">{r.label}</span>
                <span className="shrink-0 font-extrabold text-stone-800">{r.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600"
                  style={{ width: `${(r.value / max) * 100}%` }}
                />
              </div>
              {r.sub && <div className="mt-1 text-[11px] font-semibold text-stone-400">{r.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Doluluk ölçer ──
function OccupancyCard({ occ }) {
  return (
    <div className="rounded-[18px] border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-stone-800">
        <Gauge className="h-[18px] w-[18px] text-teal-600" /> Doluluk oranı
        <span className="ml-1 text-[11px] font-semibold text-stone-400">önümüzdeki {occ.windowDays} gün</span>
      </div>
      <div className="flex items-end gap-3">
        <div className="text-[34px] font-extrabold leading-none tracking-tight text-teal-700">{pct(occ.rate)}</div>
        <div className="mb-1 text-[12.5px] font-semibold text-stone-400">
          {occ.booked} / {occ.capacity} slot dolu
        </div>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
          style={{ width: `${Math.min(100, Math.round(occ.rate * 100))}%` }}
        />
      </div>
    </div>
  );
}

// Admin istatistik paneli — kendi verisini yükler.
export default function StatsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setStats(await getAdminStats());
      } catch {
        toast.error("İstatistikler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deptRows = useMemo(
    () =>
      (stats?.byDepartment || []).slice(0, 8).map((d) => ({
        key: d.id,
        label: d.name,
        value: d.total,
        sub: `${d.completed} tamamlandı · ${d.cancelled} iptal`,
      })),
    [stats]
  );
  const docRows = useMemo(
    () =>
      (stats?.byDoctor || []).map((d) => ({
        key: d.id,
        label: `${d.title} ${d.name}`,
        value: d.total,
        sub: d.department,
      })),
    [stats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin" /> İstatistikler yükleniyor…
      </div>
    );
  }
  if (!stats) return null;

  const { totals, rates } = stats;

  return (
    <div className="space-y-5">
      {/* KPI kartları */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={CalendarDays} label="Toplam randevu" value={totals.total}
          sub={`${totals.upcoming} yaklaşan`} tint="bg-teal-50 text-teal-600" />
        <Kpi icon={CheckCircle2} label="Tamamlanma" value={pct(rates.completion)}
          sub={`${totals.completed} randevu`} tint="bg-emerald-50 text-emerald-600" />
        <Kpi icon={XCircle} label="İptal oranı" value={pct(rates.cancellation)}
          sub={`${totals.cancelled} iptal`} tint="bg-rose-50 text-rose-600" />
        <Kpi icon={UserX} label="Gelmedi oranı" value={pct(rates.noShow)}
          sub={`${totals.noShow} randevu`} tint="bg-amber-50 text-amber-600" />
      </div>

      {/* İkincil istatistikler */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Users} label="Hasta" value={totals.patients} tint="bg-sky-50 text-sky-600" />
        <Kpi icon={Stethoscope} label="Doktor" value={totals.doctors} tint="bg-violet-50 text-violet-600" />
        <Kpi icon={Building2} label="Bölüm" value={totals.departments} tint="bg-indigo-50 text-indigo-600" />
        <Kpi icon={CalendarDays} label="Yaklaşan randevu" value={totals.upcoming} tint="bg-teal-50 text-teal-600" />
      </div>

      {/* Trend (tam genişlik) */}
      <TrendChart data={stats.trend} />

      {/* Donut + Doluluk */}
      <div className="grid gap-5 md:grid-cols-2">
        <StatusDonut items={stats.statusBreakdown} />
        <OccupancyCard occ={stats.occupancy} />
      </div>

      {/* Bölüm + Doktor dağılımı */}
      <div className="grid gap-5 md:grid-cols-2">
        <BarList title="En yoğun bölümler" icon={Building2} rows={deptRows} emptyText="Henüz randevu yok." />
        <BarList title="En yoğun doktorlar" icon={Stethoscope} rows={docRows} emptyText="Henüz randevu yok." />
      </div>
    </div>
  );
}
