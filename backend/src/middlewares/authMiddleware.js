// Auth Middleware — JWT doğrulama ve rol tabanlı yetkilendirme
// authenticate: Authorization header'ından token'ı doğrular, req.user'ı doldurur.
// authorize: verilen rollerden birine sahip olmayan istekleri 403 ile reddeder.

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Yetkilendirme token'ı bulunamadı.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Doğrulanmış kullanıcı bilgisini isteğe ekle
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Geçersiz veya süresi dolmuş token.",
    });
  }
};

// Rol tabanlı yetkilendirme — authenticate'ten SONRA kullanılır.
// Örnek: router.post("/", authenticate, authorize("ADMIN"), handler)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bu işlem için yetkiniz yok.",
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
