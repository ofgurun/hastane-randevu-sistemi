// Admin Routes — /api/admin altındaki uçlar (tümü ADMIN korumalı)
// Takvim yönetimi: doktor ay takvimi + gün/saat kapat-aç.

const express = require("express");
const router = express.Router();
const { getDoctorCalendar, toggleBlock } = require("../controllers/scheduleController");
const { deleteDoctor, setDoctorLeave } = require("../controllers/doctorController");
const {
  getAllLeaveRequests,
  decideLeaveRequest,
} = require("../controllers/leaveRequestController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// GET /api/admin/leave-requests — izin talepleri (bekleyenler önce)
router.get("/leave-requests", authenticate, authorize("ADMIN"), getAllLeaveRequests);

// PATCH /api/admin/leave-requests/:id — { action: "approve" | "reject" }
router.patch("/leave-requests/:id", authenticate, authorize("ADMIN"), decideLeaveRequest);

// GET /api/admin/doctors/:id/calendar?month=YYYY-MM
router.get("/doctors/:id/calendar", authenticate, authorize("ADMIN"), getDoctorCalendar);

// POST /api/admin/doctors/:id/blocks — { date, timeSlot? } toggle
router.post("/doctors/:id/blocks", authenticate, authorize("ADMIN"), toggleBlock);

// POST /api/admin/doctors/:id/leave — { startDate, endDate } izne ayır
router.post("/doctors/:id/leave", authenticate, authorize("ADMIN"), setDoctorLeave);

// DELETE /api/admin/doctors/:id — doktoru tamamen kaldır
router.delete("/doctors/:id", authenticate, authorize("ADMIN"), deleteDoctor);

module.exports = router;
