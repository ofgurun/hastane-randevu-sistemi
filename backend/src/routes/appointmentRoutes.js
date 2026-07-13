// Appointment Routes — /api/appointments altındaki uçlar
// Gün 4: GET /available — boş slotlar (kimlik doğrulaması gerekli)

const express = require("express");
const router = express.Router();
const { getAvailableSlots } = require("../controllers/appointmentController");
const { authenticate } = require("../middlewares/authMiddleware");

// GET /api/appointments/available?doctorId=&date=YYYY-MM-DD
router.get("/available", authenticate, getAvailableSlots);

module.exports = router;
