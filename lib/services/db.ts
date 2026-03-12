// @ts-nocheck
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma v7 requires a "driver adapter" — a bridge between Prisma
// and your actual database driver. This replaces the old DATABASE_URL
// approach. We use PrismaPg which wraps the `pg` npm package.

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
