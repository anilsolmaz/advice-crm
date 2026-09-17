// lib/prisma.ts
// ─────────────────────────────────────────────────────────────────────────────
// PrismaClient singleton — prevents "too many connections" during hot-reload
// in Next.js development mode.
//
// In production, the module is evaluated once per worker process.
// In development, Next.js hot-reloads modules but `globalThis` persists,
// so we attach the client there to avoid spawning a new pool on every reload.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
