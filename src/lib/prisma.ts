// @ts-ignore
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const supabaseDatabaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres.wddrjvrioaijgogmojfa:Elzoz_Badawy132%40@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: supabaseDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
