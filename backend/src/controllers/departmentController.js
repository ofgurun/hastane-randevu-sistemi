// Department Controller — bölüm CRUD işlemleri
// Gün 3: GET (tüm bölümler) ve POST (yeni bölüm)

const prisma = require("../models/prismaClient");

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

module.exports = { getAllDepartments, createDepartment };
