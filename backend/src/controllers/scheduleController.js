// Schedule Controller — admin takvim yönetimi (kapalı gün/saat: TimeBlock)
// GET  /api/admin/doctors/:id/calendar?month=YYYY-MM → ayın gün özeti (doluluk + bloklar)
// POST /api/admin/doctors/:id/blocks → gün/saat kapat-aç (toggle)

const prisma = require("../models/prismaClient");
const { generateSlots } = require("../utils/slots");

// ────────────────────────────────────────────
// GET /api/admin/doctors/:id/calendar?month=YYYY-MM
// Her gün için: randevu sayısı, dolu slotlar, kapalı slotlar, gün-kapalı bayrağı.
// ────────────────────────────────────────────
const getDoctorCalendar = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const { month } = req.query;

    if (Number.isNaN(doctorId)) {
      return res.status(400).json({ success: false, message: "Geçersiz doktor id." });
    }
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({ success: false, message: "month parametresi YYYY-MM formatında zorunludur." });
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
      }),
    ]);

    // Gün numarasına göre grupla
    const bookedByDay = {};
    for (const a of appointments) {
      const d = new Date(a.date).getDate();
      (bookedByDay[d] ||= []).push(a.timeSlot);
    }
    const blockedByDay = {};
    const closedDays = new Set();
    for (const b of blocks) {
      const d = new Date(b.date).getDate();
      if (b.timeSlot === null) closedDays.add(d);
      else (blockedByDay[d] ||= []).push(b.timeSlot);
    }

    const totalSlots = generateSlots().length;
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        appointmentCount: (bookedByDay[d] || []).length,
        bookedSlots: bookedByDay[d] || [],
        blockedSlots: blockedByDay[d] || [],
        dayClosed: closedDays.has(d),
        totalSlots,
      });
    }

    return res.status(200).json({ success: true, data: { month, days } });
  } catch (error) {
    console.error("Takvim getirme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Takvim getirilemedi." });
  }
};

// ────────────────────────────────────────────
// POST /api/admin/doctors/:id/blocks — toggle
// Body: { date: "YYYY-MM-DD", timeSlot?: "HH:mm" } (timeSlot yoksa tüm gün)
// Kayıt varsa siler (açar), yoksa oluşturur (kapatır).
// ────────────────────────────────────────────
const toggleBlock = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const { date, timeSlot } = req.body;

    if (Number.isNaN(doctorId)) {
      return res.status(400).json({ success: false, message: "Geçersiz doktor id." });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "date (YYYY-MM-DD) zorunludur." });
    }
    if (timeSlot !== undefined && timeSlot !== null && !generateSlots().includes(timeSlot)) {
      return res.status(400).json({ success: false, message: "Geçersiz zaman dilimi (slot)." });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor bulunamadı." });
    }

    const [y, mo, d] = date.split("-").map(Number);
    const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, mo - 1, d, 23, 59, 59, 999);
    const slotValue = timeSlot ?? null;

    const existing = await prisma.timeBlock.findFirst({
      where: { doctorId, timeSlot: slotValue, date: { gte: dayStart, lte: dayEnd } },
    });

    if (existing) {
      await prisma.timeBlock.delete({ where: { id: existing.id } });
      return res.status(200).json({
        success: true,
        message: slotValue ? "Saat randevuya açıldı." : "Gün randevuya açıldı.",
        data: { blocked: false, date, timeSlot: slotValue },
      });
    }

    await prisma.timeBlock.create({
      data: { doctorId, date: dayStart, timeSlot: slotValue },
    });
    return res.status(201).json({
      success: true,
      message: slotValue ? "Saat randevuya kapatıldı." : "Gün randevuya kapatıldı.",
      data: { blocked: true, date, timeSlot: slotValue },
    });
  } catch (error) {
    console.error("Blok toggle hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. İşlem yapılamadı." });
  }
};

module.exports = { getDoctorCalendar, toggleBlock };
