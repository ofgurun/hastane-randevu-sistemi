// Doctor Controller — doktor CRUD işlemleri
// Gün 3: GET (tüm doktorlar, include ile ilişkili veriler) ve POST (yeni doktor)

const prisma = require("../models/prismaClient");

// ────────────────────────────────────────────
// GET /api/doctors — Tüm doktorları listele
// Query parametreleri: ?departmentId=1 (opsiyonel filtreleme)
// ────────────────────────────────────────────
const getAllDoctors = async (req, res) => {
  try {
    const { departmentId } = req.query;

    // Opsiyonel bölüm filtresi
    const where = {};
    if (departmentId) {
      where.departmentId = parseInt(departmentId, 10);
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("Doktor listeleme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Doktorlar getirilemedi.",
    });
  }
};

// ────────────────────────────────────────────
// POST /api/doctors — Yeni doktor profili oluştur
// Body: { userId, departmentId, title }
// ────────────────────────────────────────────
const createDoctor = async (req, res) => {
  try {
    const { userId, departmentId, title } = req.body;

    if (!userId || !departmentId || !title) {
      return res.status(400).json({
        success: false,
        message: "userId, departmentId ve title alanları zorunludur.",
      });
    }

    // Kullanıcı var mı ve DOKTOR rolünde mi kontrol et
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Belirtilen userId ile kullanıcı bulunamadı.",
      });
    }

    if (user.role !== "DOKTOR") {
      return res.status(400).json({
        success: false,
        message: "Kullanıcının rolü DOKTOR olmalıdır.",
      });
    }

    // Bu kullanıcı için zaten doktor profili var mı
    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: parseInt(userId, 10) },
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "Bu kullanıcı için zaten bir doktor profili mevcut.",
      });
    }

    // Bölüm var mı kontrol et
    const department = await prisma.department.findUnique({
      where: { id: parseInt(departmentId, 10) },
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Belirtilen departmentId ile bölüm bulunamadı.",
      });
    }

    const doctor = await prisma.doctor.create({
      data: {
        userId: parseInt(userId, 10),
        departmentId: parseInt(departmentId, 10),
        title,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Doktor profili başarıyla oluşturuldu.",
      data: doctor,
    });
  } catch (error) {
    console.error("Doktor oluşturma hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Doktor profili oluşturulamadı.",
    });
  }
};

module.exports = { getAllDoctors, createDoctor };
