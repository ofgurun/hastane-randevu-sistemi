// Bildirim yardımcısı — in-app (çan) bildirimleri oluşturur.
// best-effort: hata olursa loglar ama ana işlemi (randevu/izin vb.) bozmaz.
// Çağıran controller'lar sonucu await etmese de olur (fire-and-forget).

const prisma = require("../models/prismaClient");

// Bildirim tipleri (frontend ikon/renk seçimi de bunlara göre yapılır)
const TYPES = {
  RANDEVU_OLUSTURULDU: "RANDEVU_OLUSTURULDU",
  RANDEVU_IPTAL: "RANDEVU_IPTAL",
  RANDEVU_TAMAMLANDI: "RANDEVU_TAMAMLANDI",
  RANDEVU_HATIRLATMA: "RANDEVU_HATIRLATMA",
  RANDEVU_AKTARILDI: "RANDEVU_AKTARILDI",
  IZIN_TALEBI: "IZIN_TALEBI",
  IZIN_KARARI: "IZIN_KARARI",
  YENI_DEGERLENDIRME: "YENI_DEGERLENDIRME",
};

// Tek kullanıcıya bildirim. userId yoksa/geçersizse sessizce atlar.
// { type, title, body, link?, appointmentId? }
async function notify(userId, payload) {
  if (!userId) return null;
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link ?? null,
        appointmentId: payload.appointmentId ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] Bildirim oluşturulamadı:", err.message);
    return null;
  }
}

// Birden çok kullanıcıya aynı bildirim (ör. etkilenen hastalar). Tekilleştirir.
async function notifyMany(userIds, payload) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  if (unique.length === 0) return 0;
  try {
    const result = await prisma.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link ?? null,
        appointmentId: payload.appointmentId ?? null,
      })),
    });
    return result.count;
  } catch (err) {
    console.error("[notify] Toplu bildirim oluşturulamadı:", err.message);
    return 0;
  }
}

// Belirli role sahip tüm kullanıcılara bildirim (ör. tüm ADMIN'ler).
async function notifyRole(role, payload) {
  try {
    const users = await prisma.user.findMany({ where: { role }, select: { id: true } });
    return await notifyMany(users.map((u) => u.id), payload);
  } catch (err) {
    console.error("[notify] Rol bildirimi oluşturulamadı:", err.message);
    return 0;
  }
}

// Date → "DD.MM.YYYY" (yerel)
function toTrDate(d) {
  const x = new Date(d);
  const day = String(x.getDate()).padStart(2, "0");
  const m = String(x.getMonth() + 1).padStart(2, "0");
  return `${day}.${m}.${x.getFullYear()}`;
}

// İzin nedeniyle etkilenen hastalara bildirim (yedeğe aktarıldı / iptal edildi).
// affected: [{ patientId, appointmentId, action, date, timeSlot }] (utils/leave.js çıktısı)
async function notifyLeaveAffected(affected, doctorName) {
  if (!affected || affected.length === 0) return 0;
  let count = 0;
  for (const a of affected) {
    const when = `${toTrDate(a.date)} ${a.timeSlot}`;
    const transferred = a.action === "transferred";
    const created = await notify(a.patientId, {
      type: TYPES.RANDEVU_AKTARILDI,
      title: transferred ? "Randevunuz aktarıldı" : "Randevunuz iptal edildi",
      body: transferred
        ? `${doctorName} izne ayrıldı — ${when} randevunuz yedek doktora aktarıldı.`
        : `${doctorName} izne ayrıldı — ${when} randevunuz iptal edildi.`,
      link: "/appointments",
      appointmentId: a.appointmentId,
    });
    if (created) count++;
  }
  return count;
}

module.exports = { notify, notifyMany, notifyRole, notifyLeaveAffected, TYPES };
