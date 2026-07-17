// Appointment Routes — /api/appointments altındaki uçlar
// Gün 4: GET /available — boş slotlar
// Gün 5: POST / (oluştur), DELETE /:id (iptal)

const express = require("express");
const router = express.Router();
const {
  getAvailableSlots,
  createAppointment,
  cancelAppointment,
  completeAppointment,
  getMyAppointments,
  getDoctorAgenda,
} = require("../controllers/appointmentController");
const { authenticate } = require("../middlewares/authMiddleware");

// GET /api/appointments/available?doctorId=&date=YYYY-MM-DD
router.get("/available", authenticate, getAvailableSlots);

// GET /api/appointments/me — hastanın kendi AKTIF randevuları
router.get("/me", authenticate, getMyAppointments);

// GET /api/appointments/doctor — doktorun kendi ajandası
router.get("/doctor", authenticate, getDoctorAgenda);

// POST /api/appointments — yeni randevu (hasta = token)
router.post("/", authenticate, createAppointment);

// DELETE /api/appointments/:id — iptal (sahibi hasta veya ADMIN)
router.delete("/:id", authenticate, cancelAppointment);

// PATCH /api/appointments/:id/complete — tamamlandı işaretle (randevunun doktoru)
router.patch("/:id/complete", authenticate, completeAppointment);

module.exports = router;
