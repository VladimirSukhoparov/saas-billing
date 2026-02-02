/**
 * Подключение к БД через Prisma.
 * Один экземпляр на приложение (в dev не создаём новый при hot-reload).
 */
import { PrismaClient } from "./generated/prisma/client.ts";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
