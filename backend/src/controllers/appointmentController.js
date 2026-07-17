// Appointment Controller — Randevu Motoru
// Gün 4: GET /api/appointments/available — bir doktor ve tarih için boş 30 dk slotlar.

const prisma = require("../models/prismaClient");
const { generateSlots, slotToMinutes } = require("../utils/slots");
const email = require("../utils/email");

// Yerel tarih bileşenlerinden "YYYY-MM-DD" üretir (tek referans saat dilimi — sunucu yereli).
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ────────────────────────────────────────────
// GET /api/appointments/available?doctorId=<id>&date=YYYY-MM-DD
// ────────────────────────────────────────────
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    // Alan doğrulama
    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId ve date (YYYY-MM-DD) parametreleri zorunludur.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "date parametresi YYYY-MM-DD formatında olmalıdır.",
      });
    }

    const parsedDoctorId = parseInt(doctorId, 10);
    if (Number.isNaN(parsedDoctorId)) {
      return res.status(400).json({
        success: false,
        message: "doctorId geçerli bir sayı olmalıdır.",
      });
    }

    // Doktor var mı kontrolü
    const doctor = await prisma.doctor.findUnique({ where: { id: parsedDoctorId } });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Belirtilen doctorId ile doktor bulunamadı.",
      });
    }

    // O gün için tarih aralığı (sunucu yerel saatiyle gün başı–sonu)
    const [y, mo, d] = date.split("-").map(Number);
    const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, mo - 1, d, 23, 59, 59, 999);

    // Yalnızca AKTIF randevular slotu bloke eder (IPTAL edilenler boşa çıkar).
    // Ayrıca admin tarafından kapatılan gün/saatler (TimeBlock) de hariç tutulur.
    const [activeAppointments, blocks] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          doctorId: parsedDoctorId,
          status: "AKTIF",
          date: { gte: dayStart, lte: dayEnd },
        },
        select: { timeSlot: true },
      }),
      prisma.timeBlock.findMany({
        where: { doctorId: parsedDoctorId, date: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    // Gün komple kapalıysa (timeSlot null blok) hiç slot dönme.
    if (blocks.some((b) => b.timeSlot === null)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const busy = new Set(activeAppointments.map((a) => a.timeSlot));
    for (const b of blocks) busy.add(b.timeSlot);

    // Tüm slotlardan dolu olanları çıkar
    let available = generateSlots().filter((slot) => !busy.has(slot));

    // Tarih bugünse, o an itibarıyla geçmiş/başlamış slotları da çıkar
    const now = new Date();
    if (date === toDateStr(now)) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      available = available.filter((slot) => slotToMinutes(slot) > nowMinutes);
    }

    return res.status(200).json({
      success: true,
      data: available,
    });
  } catch (error) {
    console.error("Boş slot hesaplama hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Boş saatler getirilemedi.",
    });
  }
};

// ────────────────────────────────────────────
// POST /api/appointments — Yeni randevu (AKTIF)
// Hasta = token'daki kullanıcı. İş kuralları: geçerli slot, geçmiş tarih/saat reddi,
// doktor slot çakışması, hastanın aynı gün başka AKTIF randevusu olmaması.
// ────────────────────────────────────────────
const createAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, date, timeSlot } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "doctorId, date (YYYY-MM-DD) ve timeSlot (HH:mm) zorunludur.",
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "date YYYY-MM-DD formatında olmalıdır." });
    }
    if (!generateSlots().includes(timeSlot)) {
      return res.status(400).json({ success: false, message: "Geçersiz zaman dilimi (slot)." });
    }

    const parsedDoctorId = parseInt(doctorId, 10);
    const [y, mo, d] = date.split("-").map(Number);
    const slotMin = slotToMinutes(timeSlot);

    // Geçmiş tarih/saat reddi (FR-014)
    const apptDateTime = new Date(y, mo - 1, d, Math.floor(slotMin / 60), slotMin % 60, 0, 0);
    if (apptDateTime <= new Date()) {
      return res.status(400).json({ success: false, message: "Geçmiş bir tarih/saat için randevu alınamaz." });
    }

    // Doktor var mı
    const doctor = await prisma.doctor.findUnique({
      where: { id: parsedDoctorId },
      include: { user: { select: { name: true } } },
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor bulunamadı." });
    }

    const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, mo - 1, d, 23, 59, 59, 999);

    // Admin tarafından kapatılmış gün/saat kontrolü (TimeBlock)
    const block = await prisma.timeBlock.findFirst({
      where: {
        doctorId: parsedDoctorId,
        date: { gte: dayStart, lte: dayEnd },
        OR: [{ timeSlot: null }, { timeSlot }],
      },
    });
    if (block) {
      return res.status(409).json({
        success: false,
        message: block.timeSlot === null ? "Bu tarih randevuya kapatılmıştır." : "Bu saat randevuya kapatılmıştır.",
      });
    }

    // Slot cidden boş mu? (doktor + gün + slot AKTIF) (FR-013)
    const slotTaken = await prisma.appointment.findFirst({
      where: { doctorId: parsedDoctorId, status: "AKTIF", timeSlot, date: { gte: dayStart, lte: dayEnd } },
    });
    if (slotTaken) {
      return res.status(409).json({ success: false, message: "Bu zaman dilimi dolu." });
    }

    // Hastanın aynı gün başka AKTIF randevusu var mı? (FR-012 — günde tek randevu)
    const sameDay = await prisma.appointment.findFirst({
      where: { patientId, status: "AKTIF", date: { gte: dayStart, lte: dayEnd } },
    });
    if (sameDay) {
      return res.status(409).json({ success: false, message: "Aynı gün için zaten aktif bir randevunuz var." });
    }

    // Oluştur (date: yerel gün başı — available hesabıyla tutarlı)
    const appointment = await prisma.appointment.create({
      data: { patientId, doctorId: parsedDoctorId, date: new Date(y, mo - 1, d), timeSlot, status: "AKTIF" },
    });

    // Onay e-postası (best-effort — hata ana işlemi bozmaz)
    try {
      await email.sendAppointmentConfirmation(req.user.email, {
        doctorName: doctor.user.name,
        date,
        timeSlot,
      });
    } catch (mailErr) {
      console.error("Onay e-postası gönderilemedi:", mailErr.message);
    }

    return res.status(201).json({ success: true, message: "Randevu oluşturuldu.", data: appointment });
  } catch (error) {
    console.error("Randevu oluşturma hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Randevu oluşturulamadı." });
  }
};

// ────────────────────────────────────────────
// DELETE /api/appointments/:id — İptal (status → IPTAL)
// Yalnızca randevunun sahibi hasta veya ADMIN. Satır silinmez.
// ────────────────────────────────────────────
const cancelAppointment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Geçersiz randevu id." });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { email: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Randevu bulunamadı." });
    }

    const isOwner = appointment.patientId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Bu randevuyu iptal etme yetkiniz yok." });
    }

    if (appointment.status === "IPTAL") {
      return res.status(400).json({ success: false, message: "Randevu zaten iptal edilmiş." });
    }

    const updated = await prisma.appointment.update({ where: { id }, data: { status: "IPTAL" } });

    // İptal e-postası hastaya (best-effort)
    try {
      await email.sendAppointmentCancellation(appointment.patient.email, {
        doctorName: appointment.doctor.user.name,
        date: toDateStr(appointment.date),
        timeSlot: appointment.timeSlot,
      });
    } catch (mailErr) {
      console.error("İptal e-postası gönderilemedi:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Randevu iptal edildi.",
      data: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Randevu iptal hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Randevu iptal edilemedi." });
  }
};

// ────────────────────────────────────────────
// GET /api/appointments/me — Giriş yapan hastanın kendi AKTIF randevuları
// ────────────────────────────────────────────
const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    // Hastanın tüm randevuları (AKTIF + IPTAL), tarihe göre yeniden eskiye sıralı.
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            id: true,
            title: true,
            user: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
    });
    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Randevularım hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Randevular getirilemedi." });
  }
};

// ────────────────────────────────────────────
// GET /api/appointments/doctor — Giriş yapan doktorun ajandası (AKTIF, sıralı)
// ────────────────────────────────────────────
const getDoctorAgenda = async (req, res) => {
  try {
    if (req.user.role !== "DOKTOR") {
      return res.status(403).json({ success: false, message: "Bu işlem yalnızca doktorlar içindir." });
    }
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor profili bulunamadı." });
    }
    // Doktorun tüm randevuları (AKTIF + IPTAL), tarih+saate sıralı.
    // İptal edilenler ajandada farklı/pasif rozetle gösterilir.
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    });
    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Doktor ajanda hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Ajanda getirilemedi." });
  }
};

module.exports = {
  getAvailableSlots,
  createAppointment,
  cancelAppointment,
  getMyAppointments,
  getDoctorAgenda,
};
