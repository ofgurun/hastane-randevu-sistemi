// Prisma Client singleton — tüm veri erişim katmanı bunu kullanır.
// Geliştirmede nodemon yeniden başlatmalarında bağlantı sızıntısını önlemek için
// global örnek yeniden kullanılır.

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
