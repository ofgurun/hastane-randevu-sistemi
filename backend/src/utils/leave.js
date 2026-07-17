// İzin yardımcıları — admin "izne ayır" ve izin talebi onayı aynı mantığı kullanır.

const prisma = require("../models/prismaClient");

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

// İzni uygular: aralıktaki günleri TimeBlock ile kapatır, AKTIF randevuları
// yedeğe aktarır. Tarihler "YYYY-MM-DD" (doğrulanmış) olmalı.
// → { ok: true, blockedDays, transferred, cancelled }
// → { ok: false, message } (aralıkta AKTIF randevu var ama yedek doktor yok)
async function applyLeave(doctor, startDate, endDate) {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const rangeEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);
  const dayCount = Math.round((new Date(ey, em - 1, ed) - start) / 86400000) + 1;

  const activeInRange = await prisma.appointment.findMany({
    where: { doctorId: doctor.id, status: "AKTIF", date: { gte: start, lte: rangeEnd } },
  });

  if (activeInRange.length > 0 && !doctor.backupDoctorId) {
    return {
      ok: false,
      message:
        "İzin aralığında aktif randevular var ancak yedek doktor tanımlı değil. Önce randevuları iptal edin.",
    };
  }

  // Aralıkta zaten kapalı (tüm gün) olan günleri atla
  const existingBlocks = await prisma.timeBlock.findMany({
    where: { doctorId: doctor.id, timeSlot: null, date: { gte: start, lte: rangeEnd } },
  });
  const existingDays = new Set(existingBlocks.map((b) => new Date(b.date).toDateString()));

  const newBlocks = [];
  for (let i = 0; i < dayCount; i++) {
    const day = new Date(sy, sm - 1, sd + i);
    if (!existingDays.has(day.toDateString())) {
      newBlocks.push({ doctorId: doctor.id, date: day, timeSlot: null });
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

  return { ok: true, blockedDays: dayCount, ...result };
}

module.exports = { transferAppointments, applyLeave };
