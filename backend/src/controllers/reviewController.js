// Review Controller — Hizmet Değerlendirmesi (yönetici talebi)
// Gün 5: POST /api/reviews — hasta, geçmişte gerçekleşmiş ve iptal edilmemiş kendi
// randevusu için doktora 1–5 puan ve yorum bırakır. Randevu başına tek değerlendirme.

const prisma = require("../models/prismaClient");
const { slotToMinutes } = require("../utils/slots");
const { notify, TYPES } = require("../utils/notify");

const createReview = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { appointmentId, rating, comment } = req.body;

    // Alan doğrulama
    if (!appointmentId || rating === undefined || rating === null || !comment) {
      return res.status(400).json({
        success: false,
        message: "appointmentId, rating (1-5) ve comment zorunludur.",
      });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "rating 1 ile 5 arasında bir tam sayı olmalıdır." });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId, 10) },
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Randevu bulunamadı." });
    }

    // Sahiplik
    if (appointment.patientId !== patientId) {
      return res.status(403).json({ success: false, message: "Yalnızca kendi randevunuzu değerlendirebilirsiniz." });
    }

    // İptal edilmiş randevu değerlendirilemez
    if (appointment.status === "IPTAL") {
      return res.status(400).json({ success: false, message: "İptal edilmiş bir randevu değerlendirilemez." });
    }

    // Randevu gerçekleşmiş olmalı (tarih + slot geçmişte)
    const slotMin = slotToMinutes(appointment.timeSlot);
    const apptDateTime = new Date(appointment.date);
    apptDateTime.setHours(Math.floor(slotMin / 60), slotMin % 60, 0, 0);
    if (apptDateTime > new Date()) {
      return res.status(400).json({ success: false, message: "Henüz gerçekleşmemiş bir randevu değerlendirilemez." });
    }

    // Tekrar değerlendirme kontrolü (appointmentId benzersiz)
    const existing = await prisma.review.findUnique({ where: { appointmentId: appointment.id } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Bu randevu için zaten bir değerlendirme yapılmış." });
    }

    const review = await prisma.review.create({
      data: {
        appointmentId: appointment.id,
        patientId,
        doctorId: appointment.doctorId,
        rating: numericRating,
        comment,
      },
    });

    // In-app bildirim (best-effort): doktora "yeni değerlendirme aldınız".
    (async () => {
      const doctor = await prisma.doctor.findUnique({
        where: { id: appointment.doctorId },
        select: { userId: true },
      });
      if (doctor) {
        await notify(doctor.userId, {
          type: TYPES.YENI_DEGERLENDIRME,
          title: "Yeni değerlendirme",
          body: `Bir hastanız randevunuzu değerlendirdi: ${numericRating}★`,
          link: "/doctor-dashboard",
          appointmentId: appointment.id,
        });
      }
    })().catch((e) => console.error("Değerlendirme bildirimi hatası:", e.message));

    return res.status(201).json({ success: true, message: "Değerlendirmeniz kaydedildi.", data: review });
  } catch (error) {
    // Yarış durumunda benzersizlik ihlali güvencesi
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Bu randevu için zaten bir değerlendirme yapılmış." });
    }
    console.error("Değerlendirme oluşturma hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Değerlendirme kaydedilemedi." });
  }
};

module.exports = { createReview };
