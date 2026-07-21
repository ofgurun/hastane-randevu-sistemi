// Stats Controller — Admin istatistik paneli (dashboard).
// GET /api/admin/stats → toplamlar, oranlar, doluluk, günlük trend, bölüm/doktor dağılımı.
// Küçük veri hacmi için verimli: birkaç toplu sorgu + in-memory hesap.

const prisma = require("../models/prismaClient");
const { generateSlots, slotToMinutes } = require("../utils/slots");

const SLOTS_PER_DAY = generateSlots().length; // 16
const WINDOW_DAYS = 30;

// Date (yerel) → "YYYY-MM-DD"
function toDateStr(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

// Randevunun tam zamanı (tarih + slot, yerel)
function apptDateTime(a) {
  const d = new Date(a.date);
  const min = slotToMinutes(a.timeSlot);
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
}

// ────────────────────────────────────────────
// GET /api/admin/stats — Yalnızca ADMIN
// ────────────────────────────────────────────
const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pastStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WINDOW_DAYS - 1));
    const futureEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (WINDOW_DAYS - 1), 23, 59, 59, 999);

    const [departments, doctors, appointments, futureBlocks, patientCount] = await Promise.all([
      prisma.department.findMany({ select: { id: true, name: true } }),
      prisma.doctor.findMany({
        select: {
          id: true,
          title: true,
          departmentId: true,
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.appointment.findMany({ select: { id: true, doctorId: true, date: true, timeSlot: true, status: true } }),
      prisma.timeBlock.findMany({
        where: { date: { gte: todayStart, lte: futureEnd } },
        select: { timeSlot: true },
      }),
      prisma.user.count({ where: { role: "HASTA" } }),
    ]);

    const doctorById = new Map(doctors.map((d) => [d.id, d]));

    // ── Toplamlar ve durum dağılımı ──
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;
    let noShow = 0;

    // Bölüm/doktor bazlı sayaçlar
    const deptAgg = new Map(); // departmentId → { total, completed, cancelled }
    const docAgg = new Map(); // doctorId → total (iptal hariç)
    // Trend: son 30 gün, gün başına iptal-dışı randevu
    const trendMap = new Map();
    for (let i = 0; i < WINDOW_DAYS; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WINDOW_DAYS - 1) + i);
      trendMap.set(toDateStr(d), 0);
    }

    let bookedFuture = 0; // önümüzdeki 30 gün AKTIF (doluluk için)

    for (const a of appointments) {
      const doc = doctorById.get(a.doctorId);
      const deptId = doc?.departmentId;

      // Durum sınıflandırma
      const isCancelled = a.status === "IPTAL";
      const isCompleted = a.status === "TAMAMLANDI";
      const isActive = a.status === "AKTIF";
      if (isCancelled) cancelled++;
      else if (isCompleted) completed++;
      else if (isActive) {
        if (apptDateTime(a) < now) noShow++; // zamanı geçmiş ama tamamlanmamış = gelmedi
        else upcoming++;
      }

      // Bölüm sayaçları
      if (deptId != null) {
        const agg = deptAgg.get(deptId) || { total: 0, completed: 0, cancelled: 0 };
        agg.total++;
        if (isCompleted) agg.completed++;
        if (isCancelled) agg.cancelled++;
        deptAgg.set(deptId, agg);
      }

      // Doktor sayaçları (iptal hariç = gerçek yük)
      if (!isCancelled) docAgg.set(a.doctorId, (docAgg.get(a.doctorId) || 0) + 1);

      // Trend (iptal hariç, son 30 gün, randevu gününe göre)
      if (!isCancelled) {
        const ds = toDateStr(a.date);
        if (trendMap.has(ds)) trendMap.set(ds, trendMap.get(ds) + 1);
      }

      // Doluluk (önümüzdeki 30 gün, AKTIF)
      if (isActive) {
        const t = new Date(a.date).getTime();
        if (t >= todayStart.getTime() && t <= futureEnd.getTime()) bookedFuture++;
      }
    }

    const total = appointments.length;
    const realizedBase = completed + noShow; // zamanı gelmiş, iptal olmayan
    const rate = (num, den) => (den > 0 ? +(num / den).toFixed(4) : 0);

    // ── Doluluk (önümüzdeki 30 gün) ──
    let blockedSlots = 0;
    for (const b of futureBlocks) blockedSlots += b.timeSlot === null ? SLOTS_PER_DAY : 1;
    const rawCapacity = doctors.length * SLOTS_PER_DAY * WINDOW_DAYS;
    const capacity = Math.max(rawCapacity - blockedSlots, 0);

    // ── Bölüm dağılımı (yoğunluğa göre azalan) ──
    const byDepartment = departments
      .map((d) => {
        const agg = deptAgg.get(d.id) || { total: 0, completed: 0, cancelled: 0 };
        return { id: d.id, name: d.name, ...agg };
      })
      .sort((a, b) => b.total - a.total);

    // ── Doktor dağılımı (en yoğun ilk 8) ──
    const byDoctor = doctors
      .map((d) => ({
        id: d.id,
        name: d.user.name,
        title: d.title,
        department: d.department?.name || "",
        total: docAgg.get(d.id) || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // ── Trend dizisi (kronolojik) ──
    const trend = [...trendMap.entries()].map(([date, count]) => ({ date, count }));

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          total,
          upcoming,
          completed,
          cancelled,
          noShow,
          doctors: doctors.length,
          departments: departments.length,
          patients: patientCount,
        },
        rates: {
          cancellation: rate(cancelled, total),
          noShow: rate(noShow, realizedBase),
          completion: rate(completed, realizedBase),
        },
        occupancy: { rate: rate(bookedFuture, capacity), booked: bookedFuture, capacity, windowDays: WINDOW_DAYS },
        statusBreakdown: [
          { key: "upcoming", label: "Yaklaşan", count: upcoming },
          { key: "completed", label: "Tamamlandı", count: completed },
          { key: "cancelled", label: "İptal", count: cancelled },
          { key: "noShow", label: "Gelmedi", count: noShow },
        ],
        trend,
        byDepartment,
        byDoctor,
      },
    });
  } catch (error) {
    console.error("İstatistik hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. İstatistikler getirilemedi." });
  }
};

module.exports = { getAdminStats };
