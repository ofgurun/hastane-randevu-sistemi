// E-posta yardımcısı — nodemailer ile onay/iptal bildirimleri.
// Gün 5: test için Ethereal SMTP (.env EMAIL_* değişkenleri).
// Best-effort: yapılandırma yoksa sessizce atlar; gönderim hatası ana işlemi bozmaz
// (çağıran controller try-catch ile sarmalar).

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn("[email] EMAIL_* yapılandırması eksik — e-posta gönderimi atlanıyor.");
    return null;
  }

  const port = Number(EMAIL_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure: port === 465, // 465 → SSL (Gmail), 587 → STARTTLS (Ethereal)
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  return transporter;
}

const FROM = process.env.EMAIL_FROM || "Hastane Randevu <no-reply@hastane.local>";

async function sendMail(to, subject, text) {
  const t = getTransporter();
  if (!t) return null; // yapılandırma yoksa atla

  const info = await t.sendMail({ from: FROM, to, subject, text });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log("[email] Ethereal önizleme:", preview);
  return info;
}

async function sendAppointmentConfirmation(to, { doctorName, date, timeSlot }) {
  return sendMail(
    to,
    "Randevunuz Oluşturuldu",
    `Sayın hastamız,\n\n${date} tarihinde saat ${timeSlot} için ${doctorName} ile randevunuz ` +
      `başarıyla oluşturulmuştur.\n\nHastane Randevu Sistemi`
  );
}

async function sendAppointmentCancellation(to, { doctorName, date, timeSlot }) {
  return sendMail(
    to,
    "Randevunuz İptal Edildi",
    `Sayın hastamız,\n\n${date} tarihinde saat ${timeSlot} için ${doctorName} ile olan ` +
      `randevunuz iptal edilmiştir.\n\nHastane Randevu Sistemi`
  );
}

async function sendAppointmentReschedule(to, { doctorName, oldDate, oldTimeSlot, date, timeSlot }) {
  return sendMail(
    to,
    "Randevunuz Ertelendi",
    `Sayın hastamız,\n\n${doctorName} ile ${oldDate} ${oldTimeSlot} tarihli randevunuz ` +
      `${date} tarihine saat ${timeSlot} olarak ertelenmiştir.\n\nHastane Randevu Sistemi`
  );
}

async function sendReminderEmail(to, patientName, doctorName, date, timeSlot) {
  return sendMail(
    to,
    "Randevu Hatırlatması",
    `Sayın ${patientName},\n\n${date} tarihinde saat ${timeSlot} için ${doctorName} ile ` +
      `randevunuz bulunmaktadır. Sizi bekliyoruz.\n\nHastane Randevu Sistemi`
  );
}

async function sendPasswordReset(to, patientName, resetUrl) {
  return sendMail(
    to,
    "Şifre Sıfırlama Talebi",
    `Sayın ${patientName},\n\nHesabınız için bir şifre sıfırlama talebinde bulunuldu. ` +
      `Yeni şifrenizi belirlemek için aşağıdaki bağlantıya tıklayın (1 saat geçerlidir):\n\n${resetUrl}\n\n` +
      `Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.\n\nHastane Randevu Sistemi`
  );
}

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentReschedule,
  sendReminderEmail,
  sendPasswordReset,
};
