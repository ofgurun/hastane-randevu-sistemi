// Doctor Routes — /api/doctors altındaki uçlar
// Gün 3: GET (listele) ve POST (oluştur)

const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  createDoctor,
  getDoctorAvailability,
} = require("../controllers/doctorController");
const {
  createLeaveRequest,
  getMyLeaveRequests,
} = require("../controllers/leaveRequestController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// POST /api/doctors/me/leave-requests — izin talebi oluştur (yalnızca DOKTOR)
router.post("/me/leave-requests", authenticate, authorize("DOKTOR"), createLeaveRequest);

// GET  /api/doctors/me/leave-requests — kendi izin taleplerim (yalnızca DOKTOR)
router.get("/me/leave-requests", authenticate, authorize("DOKTOR"), getMyLeaveRequests);

// GET  /api/doctors — Tüm doktorları getir (opsiyonel ?departmentId filtresi, açık)
// Dönen kayıtlar averageRating ve reviewCount alanlarını da içerir.
router.get("/", getAllDoctors);

// GET  /api/doctors/:id/availability?month=YYYY-MM — Aylık doluluk özeti (hasta takvimi, açık)
router.get("/:id/availability", getDoctorAvailability);

// POST /api/doctors — Yeni doktor profili oluştur (yalnızca ADMIN)
router.post("/", authenticate, authorize("ADMIN"), createDoctor);

module.exports = router;
