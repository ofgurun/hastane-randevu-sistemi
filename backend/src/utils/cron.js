// Randevu hatırlatma cron görevi.
// Yaklaşan (24 saatten az kalmış) AKTİF ve henüz hatırlatılmamış randevulara
// e-posta gönderir, ardından reminderSent = true yapar (mükerrer maili önler).

const cron = require("node-cron");
const prisma = require("../models/prismaClient");
const email = require("./email");

// Test kolaylığı için her dakika; üretimde saat başı ("0 * * * *") tercih edilebilir.
const SCHEDULE = "* * * * *";

// ISO/Date → "GG.AA.YYYY" (yerel gün)
function formatDate(d) {
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${day}.${m}.${dt.getFullYear()}`;
}

// Randevunun tam zamanı (tarih + slot, yerel).
function appointmentDateTime(a) {
  const dt = new Date(a.date);
  const [h, m] = a.timeSlot.split(":").map(Number);
  dt.setHours(h, m, 0, 0);
  return dt;
}

// Bir turda hatırlatmaları işler; gönderilen e-posta sayısını döner.
async function runReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Gün bazında geniş aday çek, tam saat filtresini JS'te uygula.
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const upperDayEnd = new Date(in24h.getFullYear(), in24h.getMonth(), in24h.getDate(), 23, 59, 59, 999);

  const candidates = await prisma.appointment.findMany({
    where: {
      status: "AKTIF",
      reminderSent: false,
      date: { gte: dayStart, lte: upperDayEnd },
    },
    include: {
      patient: { select: { name: true, email: true } },
      doctor: { include: { user: { select: { name: true } } } },
    },
  });

  let sent = 0;
  for (const a of candidates) {
    const when = appointmentDateTime(a);
    // Sadece "şu an ile 24 saat sonrası" arasındakiler
    if (when > now && when <= in24h) {
      try {
        const info = await email.sendReminderEmail(
          a.patient.email,
          a.patient.name,
          a.doctor.user.name,
          formatDate(a.date),
          a.timeSlot
        );
        // Yalnızca e-posta gerçekten gönderildiyse işaretle (yapılandırma yoksa
        // sendMail null döner → sonraki turda yeniden denenir).
        if (info) {
          await prisma.appointment.update({ where: { id: a.id }, data: { reminderSent: true } });
          sent++;
        }
      } catch (err) {
        console.error(`[cron] Hatırlatma gönderilemedi (randevu ${a.id}):`, err.message);
      }
    }
  }
  return sent;
}

// Cron görevini başlatır (sunucu açılışında çağrılır).
function startReminderCron() {
  cron.schedule(SCHEDULE, () => {
    runReminders()
      .then((n) => {
        if (n > 0) console.log(`[cron] ${n} randevu hatırlatma e-postası gönderildi.`);
      })
      .catch((err) => console.error("[cron] Hatırlatma görevi hatası:", err.message));
  });
  console.log(`[cron] Randevu hatırlatma görevi başlatıldı (schedule: "${SCHEDULE}").`);
}

module.exports = { startReminderCron, runReminders };
