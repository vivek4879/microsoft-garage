import { PrismaClient } from "@/app/generated/prisma";

// Why this weird pattern? In development, Next.js hot-reloads your code on every
// file save. Each reload would create a NEW database connection, eventually
// exhausting your connection pool. This singleton ensures we reuse the same
// client across hot reloads.

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
