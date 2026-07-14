// Doctor Controller — doktor CRUD işlemleri
// GET (tüm doktorlar) ve POST (yeni doktor: DOKTOR user + profil, transaction ile)

const prisma = require("../models/prismaClient");
const bcrypt = require("bcryptjs");

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
// POST /api/doctors — Yeni doktor (DOKTOR user + profil, tek transaction'da)
// Body: { name, email, password, title, departmentId }
// ────────────────────────────────────────────
const createDoctor = async (req, res) => {
  try {
    const { name, email, password, title, departmentId } = req.body;

    if (!name || !email || !password || !title || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "name, email, password, title ve departmentId zorunludur.",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Şifre en az 6 karakter olmalıdır.",
      });
    }

    // Bölüm var mı
    const department = await prisma.department.findUnique({
      where: { id: parseInt(departmentId, 10) },
    });
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Belirtilen bölüm bulunamadı.",
      });
    }

    // E-posta zaten kayıtlı mı
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Bu e-posta zaten kayıtlı.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction: önce DOKTOR user, sonra doctor profili.
    const doctor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, password: hashedPassword, role: "DOKTOR" },
      });
      return tx.doctor.create({
        data: { userId: user.id, departmentId: parseInt(departmentId, 10), title },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Doktor başarıyla eklendi.",
      data: doctor,
    });
  } catch (error) {
    // Yarış durumunda benzersiz e-posta ihlali
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "Bu e-posta zaten kayıtlı." });
    }
    console.error("Doktor oluşturma hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası. Doktor oluşturulamadı.",
    });
  }
};

module.exports = { getAllDoctors, createDoctor };
