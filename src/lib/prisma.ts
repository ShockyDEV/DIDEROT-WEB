import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma como singleton. En desarrollo, Next.js recarga los módulos
 * con frecuencia; guardamos la instancia en `globalThis` para no agotar las
 * conexiones a PostgreSQL.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
