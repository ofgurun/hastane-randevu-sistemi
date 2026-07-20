// Profil Controller — giriş yapan kullanıcının kendi hesabı
// GET  /api/auth/me        → profil bilgileri (şifre hariç)
// PATCH /api/auth/profile  → ad + kişisel bilgiler (telefon, doğum tarihi, cinsiyet, adres)
// PATCH /api/auth/password → mevcut şifre doğrulamasıyla şifre değiştirme

const bcrypt = require("bcryptjs");
const prisma = require("../models/prismaClient");

const SALT_ROUNDS = 10;
const GENDERS = ["KADIN", "ERKEK", "BELIRTILMEMIS"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Date → "YYYY-MM-DD" (yerel bileşenler — UTC kaymasını önler)
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Kullanıcı kaydını API yanıtına dönüştürür (şifre asla dönmez).
function toProfile(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    birthDate: u.birthDate ? toDateStr(u.birthDate) : null,
    gender: u.gender,
    address: u.address,
  };
}

// ────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });
    }
    return res.status(200).json({ success: true, data: toProfile(user) });
  } catch (error) {
    console.error("Profil getirme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Profil getirilemedi." });
  }
};

// ────────────────────────────────────────────
// PATCH /api/auth/profile
// Body: { name, phone?, birthDate?, gender?, address? }
// ────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone, birthDate, gender, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Ad Soyad boş olamaz." });
    }
    if (gender !== undefined && gender !== null && gender !== "" && !GENDERS.includes(gender)) {
      return res.status(400).json({ success: false, message: "Geçersiz cinsiyet değeri." });
    }
    let birth = null;
    if (birthDate !== undefined && birthDate !== null && birthDate !== "") {
      if (!DATE_RE.test(birthDate)) {
        return res.status(400).json({ success: false, message: "Doğum tarihi YYYY-MM-DD formatında olmalıdır." });
      }
      const [y, m, d] = birthDate.split("-").map(Number);
      birth = new Date(y, m - 1, d);
      if (Number.isNaN(birth.getTime()) || birth > new Date()) {
        return res.status(400).json({ success: false, message: "Geçerli bir doğum tarihi girin." });
      }
    }
    if (phone && phone.trim().length > 30) {
      return res.status(400).json({ success: false, message: "Telefon en fazla 30 karakter olabilir." });
    }
    if (address && address.trim().length > 300) {
      return res.status(400).json({ success: false, message: "Adres en fazla 300 karakter olabilir." });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        birthDate: birth,
        gender: gender || null,
        address: address?.trim() || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profiliniz güncellendi.",
      data: toProfile(updated),
    });
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Profil güncellenemedi." });
  }
};

// ────────────────────────────────────────────
// PATCH /api/auth/password
// Body: { currentPassword, newPassword }
// ────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mevcut şifre ve yeni şifre zorunludur.",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Yeni şifre en az 6 karakter olmalıdır." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Mevcut şifreniz hatalı." });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: "Yeni şifre mevcut şifreyle aynı olamaz." });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return res.status(200).json({ success: true, message: "Şifreniz güncellendi." });
  } catch (error) {
    console.error("Şifre değiştirme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası. Şifre değiştirilemedi." });
  }
};

module.exports = { getMe, updateProfile, changePassword };
