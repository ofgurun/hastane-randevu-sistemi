// LeaveRequest Controller — doktor izin talebi akışı
// Doktor: talep oluşturur + kendi taleplerini listeler.
// Admin: tüm talepleri listeler, onaylar (izin uygulanır) veya reddeder.

const prisma = require("../models/prismaClient");
const { applyLeave } = require("../utils/leave");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// "YYYY-MM-DD" → yerel gün başı Date
function toLocalDay(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Date → "YYYY-MM-DD" (yerel)
function toDateStr(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

// ────────────────────────────────────────────
// POST /api/doctors/me/leave-requests — İzin talebi oluştur (DOKTOR)
// Body: { startDate, endDate } (YYYY-MM-DD, ikisi de dahil)
// ────────────────────────────────────────────
const createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: "startDate ve endDate (YYYY-MM-DD) zorunludur.",
      });
    }
    const trimmedReason = typeof reason === "string" ? reason.trim() : "";
    if (!trimmedReason) {
      return res.status(400).json({ success: false, message: "İzin açıklaması (reason) zorunludur." });
    }
    if (trimmedReason.length > 500) {
      return res.status(400).json({ success: false, message: "Açıklama en fazla 500 karakter olabilir." });
    }
    const start = toLocalDay(startDate);
    const end = toLocalDay(endDate);
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({ success: false, message: "Geçmiş bir tarih için izin talep edilemez." });
    }
    const dayCount = Math.round((end - start) / 86400000) + 1;
    if (dayCount > 366) {
      return res.status(400).json({ success: false, message: "İzin süresi en fazla 366 gün olabilir." });
    }

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor profili bulunamadı." });
    }

    // Aynı aralıkla çakışan bekleyen VEYA onaylanmış talep varsa engelle
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        doctorId: doctor.id,
        status: { in: ["BEKLIYOR", "ONAYLANDI"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlapping) {
      return res.status(409).json({
        success: false,
        message:
          overlapping.status === "ONAYLANDI"
            ? "Bu tarih aralığıyla çakışan onaylanmış bir izniniz zaten var."
            : "Bu tarihlerle çakışan bekleyen bir izin talebiniz zaten var.",
      });
    }

    // Aralıktaki TÜM günler zaten kapalıysa (ör. admin doğrudan izne ayırdıysa)
    // talep kaydı yanıltıcı olur — engelle.
    const closedBlocks = await prisma.timeBlock.findMany({
      where: { doctorId: doctor.id, timeSlot: null, date: { gte: start, lte: end } },
    });
    const closedDaySet = new Set(closedBlocks.map((b) => new Date(b.date).toDateString()));
    if (closedDaySet.size >= dayCount) {
      return res.status(409).json({
        success: false,
        message: "Bu tarih aralığında zaten izinli görünüyorsunuz (günler randevuya kapalı).",
      });
    }

    const request = await prisma.leaveRequest.create({
      data: { doctorId: doctor.id, startDate: start, endDate: end, reason: trimmedReason },
    });

    return res.status(201).json({
      success: true,
      message: "İzin talebiniz alındı. Yönetici onayı bekleniyor.",
      data: { ...request, startDate: startDate, endDate: endDate },
    });
  } catch (error) {
    console.error("İzin talebi oluşturma hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. İzin talebi oluşturulamadı." });
  }
};

// ────────────────────────────────────────────
// GET /api/doctors/me/leave-requests — Kendi taleplerim (DOKTOR)
// ────────────────────────────────────────────
const getMyLeaveRequests = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doktor profili bulunamadı." });
    }
    const requests = await prisma.leaveRequest.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({
      success: true,
      data: requests.map((r) => ({ ...r, startDate: toDateStr(r.startDate), endDate: toDateStr(r.endDate) })),
    });
  } catch (error) {
    console.error("İzin talepleri listeleme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Talepler getirilemedi." });
  }
};

// ────────────────────────────────────────────
// GET /api/admin/leave-requests — Tüm talepler (ADMIN, bekleyenler önce)
// ────────────────────────────────────────────
const getAllLeaveRequests = async (req, res) => {
  try {
    const requests = await prisma.leaveRequest.findMany({
      include: {
        doctor: {
          select: {
            id: true,
            title: true,
            user: { select: { name: true } },
            department: { select: { name: true } },
            backupDoctor: { select: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });
    // Bekleyenler önce, ardından karar tarihine göre yeniler
    const order = { BEKLIYOR: 0, ONAYLANDI: 1, REDDEDILDI: 1 };
    requests.sort((a, b) => order[a.status] - order[b.status]);
    return res.status(200).json({
      success: true,
      data: requests.map((r) => ({ ...r, startDate: toDateStr(r.startDate), endDate: toDateStr(r.endDate) })),
    });
  } catch (error) {
    console.error("İzin talepleri (admin) hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Talepler getirilemedi." });
  }
};

// ────────────────────────────────────────────
// PATCH /api/admin/leave-requests/:id — Onayla/Reddet (ADMIN)
// Body: { action: "approve" | "reject" }
// approve: izin uygulanır (günler kapatılır + randevular yedeğe aktarılır);
// yedek yokken aralıkta AKTIF randevu varsa 409 döner ve talep BEKLIYOR kalır.
// ────────────────────────────────────────────
const decideLeaveRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { action } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "Geçersiz talep id." });
    }
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "action 'approve' veya 'reject' olmalıdır." });
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { doctor: true },
    });
    if (!request) {
      return res.status(404).json({ success: false, message: "İzin talebi bulunamadı." });
    }
    if (request.status !== "BEKLIYOR") {
      return res.status(400).json({ success: false, message: "Bu talep zaten karara bağlanmış." });
    }

    if (action === "reject") {
      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: { status: "REDDEDILDI", decidedAt: new Date() },
      });
      return res.status(200).json({
        success: true,
        message: "İzin talebi reddedildi.",
        data: { id: updated.id, status: updated.status },
      });
    }

    // Onay öncesi koruma: aynı doktorun çakışan ONAYLANMIŞ başka talebi varsa
    // veya aralıktaki tüm günler zaten kapalıysa tekrar onay yanıltıcı olur.
    const overlapApproved = await prisma.leaveRequest.findFirst({
      where: {
        doctorId: request.doctorId,
        status: "ONAYLANDI",
        id: { not: request.id },
        startDate: { lte: request.endDate },
        endDate: { gte: request.startDate },
      },
    });
    if (overlapApproved) {
      return res.status(409).json({
        success: false,
        message:
          "Bu talep, doktorun zaten onaylanmış bir izniyle çakışıyor. Talebi reddedebilirsiniz.",
      });
    }
    const closedBlocks = await prisma.timeBlock.findMany({
      where: { doctorId: request.doctorId, timeSlot: null, date: { gte: request.startDate, lte: request.endDate } },
    });
    const reqDayCount = Math.round((request.endDate - request.startDate) / 86400000) + 1;
    const closedDaySet = new Set(closedBlocks.map((b) => new Date(b.date).toDateString()));
    if (closedDaySet.size >= reqDayCount) {
      return res.status(409).json({
        success: false,
        message:
          "Bu aralıktaki günler zaten randevuya kapalı — doktor bu tarihlerde izinli görünüyor. Talebi reddedebilirsiniz.",
      });
    }

    // Onay: admin "izne ayır" ile aynı mantık
    const result = await applyLeave(request.doctor, toDateStr(request.startDate), toDateStr(request.endDate));
    if (!result.ok) {
      return res.status(409).json({ success: false, message: result.message });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: "ONAYLANDI", decidedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: "İzin talebi onaylandı ve izin uygulandı.",
      data: {
        id: updated.id,
        status: updated.status,
        blockedDays: result.blockedDays,
        transferred: result.transferred,
        cancelled: result.cancelled,
      },
    });
  } catch (error) {
    console.error("İzin talebi karar hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. İşlem yapılamadı." });
  }
};

module.exports = { createLeaveRequest, getMyLeaveRequests, getAllLeaveRequests, decideLeaveRequest };
