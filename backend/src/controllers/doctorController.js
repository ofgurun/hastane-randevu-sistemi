// Doctor Controller — doktor CRUD işlemleri
// GET (tüm doktorlar) ve POST (yeni doktor: DOKTOR user + profil, transaction ile)

const prisma = require("../models/prismaClient");
const bcrypt = require("bcryptjs");
const { generateSlots } = require("../utils/slots");

// ────────────────────────────────────────────
// GET /api/doctors — Tüm doktorları listele
// Query parametreleri: ?departmentId=1 (opsiyonel filtreleme)
// ────────────────────────────────────────────
const getAllDoctors = async (req, res) => {
  try {
    const { departmentId } = req.query;

    // Opsiyonel bölüm filtresi
    const where = {};
    if (departmentId) {
      where.departmentId = parseInt(departmentId, 10);
    }

    // Doktorlar + değerlendirme özetleri (ortalama puan ve adet) tek seferde
    const [doctors, ratings] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.review.groupBy({
        by: ["doctorId"],
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // doctorId → { avg, count } eşlemesi; puanı 1 ondalıkla yuvarla
    const ratingByDoctor = new Map(
      ratings.map((r) => [r.doctorId, { avg: r._avg.rating, count: r._count.rating }])
    );
    const data = doctors.map((d) => {
      const r = ratingByDoctor.get(d.id);
      return {
        ...d,
        averageRating: r ? Math.round(r.avg * 10) / 10 : null,
        reviewCount: r ? r.count : 0,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Doktor listeleme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Doktorlar getirilemedi.",
    });
  }
};

// ────────────────────────────────────────────
// POST /api/doctors — Yeni doktor (DOKTOR user + profil, tek transaction'da)
// Body: { name, email, password, title, departmentId }
// ────────────────────────────────────────────
const createDoctor = async (req, res) => {
  try {
    const { name, email, password, title, departmentId, backupDoctorId } = req.body;

    if (!name || !email || !password || !title || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "name, email, password, title ve departmentId zorunludur.",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Şifre en az 6 karakter olmalıdır.",
      });
    }

    // Bölüm var mı
    const department = await prisma.department.findUnique({
      where: { id: parseInt(departmentId, 10) },
    });
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Belirtilen bölüm bulunamadı.",
      });
    }

    // Yedek doktor (opsiyonel): var olmalı ve AYNI bölümden olmalı
    let backupId = null;
    if (backupDoctorId !== undefined && backupDoctorId !== null && backupDoctorId !== "") {
      backupId = parseInt(backupDoctorId, 10);
      const backup = await prisma.doctor.findUnique({ where: { id: backupId } });
      if (!backup) {
        return res.status(404).json({ success: false, message: "Yedek doktor bulunamadı." });
      }
      if (backup.departmentId !== parseInt(departmentId, 10)) {
        return res.status(400).json({
          success: false,
          message: "Yedek doktor aynı bölümden olmalıdır.",
        });
      }
    }

    // E-posta zaten kayıtlı mı
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Bu e-posta zaten kayıtlı.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction: önce DOKTOR user, sonra doctor profili.
    const doctor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, password: hashedPassword, role: "DOKTOR" },
      });
      return tx.doctor.create({
        data: {
          userId: user.id,
          departmentId: parseInt(departmentId, 10),
          title,
          backupDoctorId: backupId,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Doktor başarıyla eklendi.",
      data: doctor,
    });
  } catch (error) {
    // Yarış durumunda benzersiz e-posta ihlali
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Bu e-posta zaten kayıtlı." });
    }
    console.error("Doktor oluşturma hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Doktor oluşturulamadı.",
    });
  }
};

// ────────────────────────────────────────────
// GET /api/doctors/:id/availability?month=YYYY-MM — Hasta takvimi doluluk özeti
// Her gün için yalnızca sayısal özet döner (hangi saatlerin dolu olduğu sızdırılmaz):
// { date, totalSlots, availableCount, dayClosed }
// ────────────────────────────────────────────
const getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const { month } = req.query;

    if (Number.isNaN(doctorId)) {
      return res.status(400).json({ success: false, message: "Geçersiz doktor id." });
    }
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res
        .status(400)
        .json({ success: false, message: "month parametresi YYYY-MM formatında zorunludur." });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor bulunamadı." });
    }

    const [y, m] = month.split("-").map(Number);
    const monthStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(y, m, 0).getDate();
    const monthEnd = new Date(y, m - 1, daysInMonth, 23, 59, 59, 999);

    const [appointments, blocks] = await Promise.all([
      prisma.appointment.findMany({
        where: { doctorId, status: "AKTIF", date: { gte: monthStart, lte: monthEnd } },
        select: { date: true, timeSlot: true },
      }),
      prisma.timeBlock.findMany({
        where: { doctorId, date: { gte: monthStart, lte: monthEnd } },
        select: { date: true, timeSlot: true },
      }),
    ]);

    // Gün numarasına göre dolu (randevu ∪ kapalı saat) kümeleri
    const busyByDay = {};
    const closedDays = new Set();
    for (const a of appointments) {
      const d = new Date(a.date).getDate();
      (busyByDay[d] ||= new Set()).add(a.timeSlot);
    }
    for (const b of blocks) {
      const d = new Date(b.date).getDate();
      if (b.timeSlot === null) closedDays.add(d);
      else (busyByDay[d] ||= new Set()).add(b.timeSlot);
    }

    const totalSlots = generateSlots().length;
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayClosed = closedDays.has(d);
      const busyCount = busyByDay[d] ? busyByDay[d].size : 0;
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        totalSlots,
        availableCount: dayClosed ? 0 : totalSlots - busyCount,
        dayClosed,
      });
    }

    return res.status(200).json({ success: true, data: { month, days } });
  } catch (error) {
    console.error("Doluluk özeti hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Doluluk bilgisi getirilemedi." });
  }
};

// Randevuları yedek doktora aktarır (tx içinde). Yedek doktor aynı gün+slotta
// doluysa randevu aktarılamaz → IPTAL edilir. { transferred, cancelled } döner.
async function transferAppointments(tx, appointments, backupId) {
  let transferred = 0;
  let cancelled = 0;
  for (const a of appointments) {
    const dayStart = new Date(a.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(a.date);
    dayEnd.setHours(23, 59, 59, 999);
    const conflict = await tx.appointment.findFirst({
      where: {
        doctorId: backupId,
        status: "AKTIF",
        timeSlot: a.timeSlot,
        date: { gte: dayStart, lte: dayEnd },
      },
    });
    if (conflict) {
      await tx.appointment.update({ where: { id: a.id }, data: { status: "IPTAL" } });
      cancelled++;
    } else {
      await tx.appointment.update({ where: { id: a.id }, data: { doctorId: backupId } });
      transferred++;
    }
  }
  return { transferred, cancelled };
}

// ────────────────────────────────────────────
// DELETE /api/admin/doctors/:id — Doktoru tamamen kaldır (ADMIN)
// Gelecek AKTIF randevular yedek doktora aktarılır; ardından doktor,
// kullanıcısı ve bağlı kayıtları (blok, geçmiş randevu, değerlendirme) silinir.
// ────────────────────────────────────────────
const deleteDoctor = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Geçersiz doktor id." });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor bulunamadı." });
    }

    // Gelecekteki AKTIF randevular (bugün dahil ileri)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const futureActive = await prisma.appointment.findMany({
      where: { doctorId: id, status: "AKTIF", date: { gte: todayStart } },
    });

    if (futureActive.length > 0 && !doctor.backupDoctorId) {
      return res.status(409).json({
        success: false,
        message:
          "Bu doktorun aktif randevuları var ancak yedek doktoru tanımlı değil. Önce randevuları iptal edin.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      let stats = { transferred: 0, cancelled: 0 };
      if (futureActive.length > 0) {
        stats = await transferAppointments(tx, futureActive, doctor.backupDoctorId);
      }
      // Bu doktora bağlı kalan kayıtları temizle (FK sırasına göre)
      await tx.review.deleteMany({ where: { doctorId: id } });
      await tx.appointment.deleteMany({ where: { doctorId: id } });
      await tx.timeBlock.deleteMany({ where: { doctorId: id } });
      // Bu doktoru yedek olarak kullananların referansını kaldır
      await tx.doctor.updateMany({ where: { backupDoctorId: id }, data: { backupDoctorId: null } });
      await tx.doctor.delete({ where: { id } });
      await tx.user.delete({ where: { id: doctor.userId } });
      return stats;
    });

    return res.status(200).json({
      success: true,
      message: "Doktor kaldırıldı.",
      data: { id, transferred: result.transferred, cancelled: result.cancelled },
    });
  } catch (error) {
    console.error("Doktor silme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Doktor kaldırılamadı." });
  }
};

// ────────────────────────────────────────────
// POST /api/admin/doctors/:id/leave — İzne ayır (ADMIN)
// Body: { startDate, endDate } (YYYY-MM-DD, ikisi de dahil).
// Aralıktaki günler TimeBlock ile kapatılır; AKTIF randevular yedeğe aktarılır.
// ────────────────────────────────────────────
const setDoctorLeave = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { startDate, endDate } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Geçersiz doktor id." });
    }
    const RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !endDate || !RE.test(startDate) || !RE.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: "startDate ve endDate (YYYY-MM-DD) zorunludur.",
      });
    }
    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
      });
    }
    const dayCount = Math.round((end - start) / 86400000) + 1;
    if (dayCount > 366) {
      return res.status(400).json({ success: false, message: "İzin süresi en fazla 366 gün olabilir." });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor bulunamadı." });
    }

    const rangeEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    const activeInRange = await prisma.appointment.findMany({
      where: { doctorId: id, status: "AKTIF", date: { gte: start, lte: rangeEnd } },
    });

    if (activeInRange.length > 0 && !doctor.backupDoctorId) {
      return res.status(409).json({
        success: false,
        message:
          "İzin aralığında aktif randevular var ancak yedek doktor tanımlı değil. Önce randevuları iptal edin.",
      });
    }

    // Aralıkta zaten kapalı (tüm gün) olan günleri atla
    const existingBlocks = await prisma.timeBlock.findMany({
      where: { doctorId: id, timeSlot: null, date: { gte: start, lte: rangeEnd } },
    });
    const existingDays = new Set(existingBlocks.map((b) => new Date(b.date).toDateString()));

    const newBlocks = [];
    for (let i = 0; i < dayCount; i++) {
      const day = new Date(sy, sm - 1, sd + i);
      if (!existingDays.has(day.toDateString())) {
        newBlocks.push({ doctorId: id, date: day, timeSlot: null });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (newBlocks.length > 0) {
        await tx.timeBlock.createMany({ data: newBlocks });
      }
      let stats = { transferred: 0, cancelled: 0 };
      if (activeInRange.length > 0) {
        stats = await transferAppointments(tx, activeInRange, doctor.backupDoctorId);
      }
      return stats;
    });

    return res.status(200).json({
      success: true,
      message: "Doktor izne ayrıldı.",
      data: {
        startDate,
        endDate,
        blockedDays: dayCount,
        transferred: result.transferred,
        cancelled: result.cancelled,
      },
    });
  } catch (error) {
    console.error("İzne ayırma hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. İzne ayırma yapılamadı." });
  }
};

module.exports = { getAllDoctors, createDoctor, deleteDoctor, setDoctorLeave, getDoctorAvailability };
