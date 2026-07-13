// Doctor Routes — /api/doctors altındaki uçlar
// Gün 3: GET (listele) ve POST (oluştur)

const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  createDoctor,
} = require("../controllers/doctorController");

// GET  /api/doctors — Tüm doktorları getir (opsiyonel ?departmentId filtresi)
router.get("/", getAllDoctors);

// POST /api/doctors — Yeni doktor profili oluştur
router.post("/", createDoctor);

module.exports = router;
