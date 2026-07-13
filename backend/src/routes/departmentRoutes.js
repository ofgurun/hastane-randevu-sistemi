// Department Routes — /api/departments altındaki uçlar
// Gün 3: GET (listele) ve POST (oluştur)

const express = require("express");
const router = express.Router();
const {
  getAllDepartments,
  createDepartment,
} = require("../controllers/departmentController");

// GET  /api/departments — Tüm bölümleri getir
router.get("/", getAllDepartments);

// POST /api/departments — Yeni bölüm ekle
router.post("/", createDepartment);

module.exports = router;
