// Doctor Routes — /api/doctors altındaki uçlar
// Gün 3: GET (listele) ve POST (oluştur)

const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  createDoctor,
} = require("../controllers/doctorController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// GET  /api/doctors — Tüm doktorları getir (opsiyonel ?departmentId filtresi, açık)
router.get("/", getAllDoctors);

// POST /api/doctors — Yeni doktor profili oluştur (yalnızca ADMIN)
router.post("/", authenticate, authorize("ADMIN"), createDoctor);

module.exports = router;
