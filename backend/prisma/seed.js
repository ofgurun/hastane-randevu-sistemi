// Prisma Seed — sunum için tutarlı demo veri.
// 5 bölüm, 10 doktor (şifre: doktor123), 2 hasta (şifre: hasta123),
// geçmiş (değerlendirilebilir) ve gelecek AKTİF randevular + örnek iptal.
// Çalıştırma: `npm run seed` (backend dizininde).

require("dotenv").config();
const prisma = require("../src/models/prismaClient");
const bcrypt = require("bcryptjs");

// Bugünden n gün öncesi/sonrası — yerel gün başı (createAppointment ile tutarlı).
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  // --- 1) Temizlik (FK sırasına göre) ---
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash("admin123", 10);
  const doctorPass = await bcrypt.hash("doktor123", 10);
  const patientPass = await bcrypt.hash("hasta123", 10);

  // --- 0) Admin ---
  await prisma.user.create({
    data: { name: "Sistem Yöneticisi", email: "admin@medirandevu.local", password: adminPass, role: "ADMIN" },
  });

  // --- 2) Bölümler ---
  const departmentData = [
    { name: "Kardiyoloji", description: "Kalp ve damar hastalıkları" },
    { name: "Dahiliye", description: "İç hastalıkları" },
    { name: "Nöroloji", description: "Sinir sistemi hastalıkları" },
    { name: "Göz Hastalıkları", description: "Göz sağlığı ve cerrahisi" },
    { name: "Ortopedi", description: "Kemik, eklem ve kas hastalıkları" },
  ];
  const dept = {};
  for (const d of departmentData) {
    dept[d.name] = await prisma.department.create({ data: d });
  }

  // --- 3) Doktorlar (10) ---
  const doctorData = [
    { name: "Prof. Dr. Ahmet Yılmaz", email: "ahmet.yilmaz@medirandevu.local", title: "Prof. Dr.", dept: "Kardiyoloji" },
    { name: "Uzm. Dr. Elif Demir", email: "elif.demir@medirandevu.local", title: "Uzm. Dr.", dept: "Kardiyoloji" },
    { name: "Doç. Dr. Mehmet Kaya", email: "mehmet.kaya@medirandevu.local", title: "Doç. Dr.", dept: "Dahiliye" },
    { name: "Uzm. Dr. Ayşe Şahin", email: "ayse.sahin@medirandevu.local", title: "Uzm. Dr.", dept: "Dahiliye" },
    { name: "Prof. Dr. Mustafa Aydın", email: "mustafa.aydin@medirandevu.local", title: "Prof. Dr.", dept: "Nöroloji" },
    { name: "Uzm. Dr. Zeynep Çelik", email: "zeynep.celik@medirandevu.local", title: "Uzm. Dr.", dept: "Nöroloji" },
    { name: "Op. Dr. Can Öztürk", email: "can.ozturk@medirandevu.local", title: "Op. Dr.", dept: "Göz Hastalıkları" },
    { name: "Uzm. Dr. Fatma Arslan", email: "fatma.arslan@medirandevu.local", title: "Uzm. Dr.", dept: "Göz Hastalıkları" },
    { name: "Prof. Dr. Emre Doğan", email: "emre.dogan@medirandevu.local", title: "Prof. Dr.", dept: "Ortopedi" },
    { name: "Op. Dr. Selin Koç", email: "selin.koc@medirandevu.local", title: "Op. Dr.", dept: "Ortopedi" },
  ];
  const doc = {};
  for (const d of doctorData) {
    const user = await prisma.user.create({
      data: { name: d.name, email: d.email, password: doctorPass, role: "DOKTOR" },
    });
    doc[d.email] = await prisma.doctor.create({
      data: { userId: user.id, departmentId: dept[d.dept].id, title: d.title },
    });
  }

  // --- 4) Hastalar (2) ---
  const hasta1 = await prisma.user.create({
    data: { name: "Ali Veli", email: "hasta1@medirandevu.local", password: patientPass, role: "HASTA" },
  });
  const hasta2 = await prisma.user.create({
    data: { name: "Zehra Yıldız", email: "hasta2@medirandevu.local", password: patientPass, role: "HASTA" },
  });

  // --- 5) Randevular (geçmiş=değerlendirilebilir, gelecek=aktif, +örnek iptal) ---
  // Her hasta için günler ayrık (hasta günde tek aktif randevu kuralına uygun).
  const appointmentData = [
    // hasta1
    { patient: hasta1, docEmail: "ahmet.yilmaz@medirandevu.local", day: -30, slot: "09:00", status: "AKTIF" }, // geçmiş → Değerlendir
    { patient: hasta1, docEmail: "mehmet.kaya@medirandevu.local", day: -18, slot: "10:30", status: "AKTIF" }, // geçmiş → Değerlendir
    { patient: hasta1, docEmail: "can.ozturk@medirandevu.local", day: -10, slot: "14:00", status: "IPTAL" }, // geçmiş iptal (geçmiş kaydı)
    { patient: hasta1, docEmail: "mustafa.aydin@medirandevu.local", day: 5, slot: "09:30", status: "AKTIF" }, // gelecek → İptal Et
    { patient: hasta1, docEmail: "emre.dogan@medirandevu.local", day: 12, slot: "11:00", status: "AKTIF" }, // gelecek → İptal Et
    // hasta2
    { patient: hasta2, docEmail: "elif.demir@medirandevu.local", day: -25, slot: "15:00", status: "AKTIF" }, // geçmiş → Değerlendir
    { patient: hasta2, docEmail: "ayse.sahin@medirandevu.local", day: -8, slot: "13:30", status: "AKTIF" }, // geçmiş → Değerlendir
    { patient: hasta2, docEmail: "zeynep.celik@medirandevu.local", day: 7, slot: "10:00", status: "AKTIF" }, // gelecek → İptal Et
    { patient: hasta2, docEmail: "selin.koc@medirandevu.local", day: 15, slot: "16:00", status: "AKTIF" }, // gelecek → İptal Et
  ];
  for (const a of appointmentData) {
    await prisma.appointment.create({
      data: {
        patientId: a.patient.id,
        doctorId: doc[a.docEmail].id,
        date: daysFromNow(a.day),
        timeSlot: a.slot,
        status: a.status,
      },
    });
  }

  // --- Özet ---
  console.log("✅ Seed tamamlandı:");
  console.log("  Admin  :", await prisma.user.count({ where: { role: "ADMIN" } }), "(şifre: admin123)");
  console.log("  Bölüm  :", await prisma.department.count());
  console.log("  Doktor :", await prisma.doctor.count(), "(şifre: doktor123)");
  console.log("  Hasta  :", await prisma.user.count({ where: { role: "HASTA" } }), "(şifre: hasta123)");
  console.log("  Randevu:", await prisma.appointment.count());
  console.log("\n  Örnek giriş → admin@medirandevu.local / admin123");
  console.log("               hasta1@medirandevu.local / hasta123");
  console.log("               ahmet.yilmaz@medirandevu.local / doktor123");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
