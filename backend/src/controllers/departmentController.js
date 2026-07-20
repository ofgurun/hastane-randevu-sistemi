// Department Controller — bölüm CRUD işlemleri
// Gün 3: GET (tüm bölümler) ve POST (yeni bölüm)

const prisma = require("../models/prismaClient");
const { generateSlots, slotToMinutes } = require("../utils/slots");

// Doluluk özeti penceresi (bugünden itibaren kaç gün ileriye bakılır)
const WINDOW_DAYS = 30;

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ────────────────────────────────────────────
// GET /api/departments — Tüm bölümleri listele
// ────────────────────────────────────────────
const getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Bölüm listeleme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Bölümler getirilemedi.",
    });
  }
};

// ────────────────────────────────────────────
// POST /api/departments — Yeni bölüm oluştur
// ────────────────────────────────────────────
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Bölüm adı (name) zorunludur.",
      });
    }

    // Aynı isimde bölüm kontrolü
    const existing = await prisma.department.findFirst({
      where: { name },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Bu isimde bir bölüm zaten mevcut.",
      });
    }

    const department = await prisma.department.create({
      data: { name, description: description || null },
    });

    return res.status(201).json({
      success: true,
      message: "Bölüm başarıyla oluşturuldu.",
      data: department,
    });
  } catch (error) {
    console.error("Bölüm oluşturma hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Bölüm oluşturulamadı.",
    });
  }
};

// ────────────────────────────────────────────
// GET /api/departments/availability-summary
// Her bölüm için önümüzdeki 30 gündeki toplam boş slot sayısı ve en yakın boş slot.
// → { data: [ { id, availableCount, nextSlot: { date, time } | null } ] }
// ────────────────────────────────────────────
const getAvailabilitySummary = async (req, res) => {
  try {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + WINDOW_DAYS, 23, 59, 59, 999);
    const todayStr = toDateStr(now);
    const ALL_SLOTS = generateSlots();

    // Doktorlar (bölüm eşlemesi) + penceredeki AKTIF randevular + kapalı zamanlar
    const [doctors, appointments, blocks] = await Promise.all([
      prisma.doctor.findMany({ select: { id: true, departmentId: true } }),
      prisma.appointment.findMany({
        where: { status: "AKTIF", date: { gte: windowStart, lte: windowEnd } },
        select: { doctorId: true, date: true, timeSlot: true },
      }),
      prisma.timeBlock.findMany({
        where: { date: { gte: windowStart, lte: windowEnd } },
        select: { doctorId: true, date: true, timeSlot: true },
      }),
    ]);

    // doctorId → "YYYY-MM-DD" → { busy:Set, closed:bool }
    const byDoctorDay = new Map();
    const ensure = (docId, ds) => {
      let m = byDoctorDay.get(docId);
      if (!m) { m = new Map(); byDoctorDay.set(docId, m); }
      let cell = m.get(ds);
      if (!cell) { cell = { busy: new Set(), closed: false }; m.set(ds, cell); }
      return cell;
    };
    for (const a of appointments) ensure(a.doctorId, toDateStr(new Date(a.date))).busy.add(a.timeSlot);
    for (const b of blocks) {
      const cell = ensure(b.doctorId, toDateStr(new Date(b.date)));
      if (b.timeSlot === null) cell.closed = true;
      else cell.busy.add(b.timeSlot);
    }

    // Bölüm bazında topla
    const summary = new Map(); // departmentId → { availableCount, nextSlotMin, nextSlot }
    const getDept = (id) => {
      let s = summary.get(id);
      if (!s) { s = { availableCount: 0, nextSlotMin: Infinity, nextSlot: null }; summary.set(id, s); }
      return s;
    };

    for (const doc of doctors) {
      const dayMap = byDoctorDay.get(doc.id);
      const dept = getDept(doc.departmentId);
      for (let i = 0; i <= WINDOW_DAYS; i++) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const ds = toDateStr(day);
        const cell = dayMap?.get(ds);
        if (cell?.closed) continue;
        const busy = cell?.busy;
        const isToday = ds === todayStr;
        for (const slot of ALL_SLOTS) {
          if (busy?.has(slot)) continue;
          const slotMin = slotToMinutes(slot);
          if (isToday && slotMin <= nowMinutes) continue; // bugün geçmiş saatler
          dept.availableCount++;
          const absMin = i * 1440 + slotMin; // en yakın için sıralama anahtarı
          if (absMin < dept.nextSlotMin) {
            dept.nextSlotMin = absMin;
            dept.nextSlot = { date: ds, time: slot };
          }
        }
      }
    }

    const departments = await prisma.department.findMany({ select: { id: true } });
    const data = departments.map((d) => {
      const s = summary.get(d.id) || { availableCount: 0, nextSlot: null };
      return { id: d.id, availableCount: s.availableCount, nextSlot: s.nextSlot };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Bölüm doluluk özeti hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Doluluk özeti getirilemedi." });
  }
};

module.exports = { getAllDepartments, createDepartment, getAvailabilitySummary };
