// Appointment Controller — Randevu Motoru
// Gün 4: GET /api/appointments/available — bir doktor ve tarih için boş 30 dk slotlar.

const prisma = require("../models/prismaClient");
const { generateSlots, slotToMinutes } = require("../utils/slots");

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
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: parsedDoctorId,
        status: "AKTIF",
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { timeSlot: true },
    });

    const busy = new Set(activeAppointments.map((a) => a.timeSlot));

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

module.exports = { getAvailableSlots };
