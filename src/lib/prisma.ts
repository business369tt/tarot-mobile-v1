import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { PrismaClient as GeneratedPrismaClient } from "@prisma/client/index";
import type { ITXClientDenyList } from "@prisma/client/runtime/client";

type PrismaClientConstructor = new (options?: {
  adapter?: PrismaBetterSqlite3;
  log?: Array<"error" | "warn">;
}) => GeneratedPrismaClient;

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: PrismaClientConstructor;
};

export type TransactionClient = Omit<GeneratedPrismaClient, ITXClientDenyList>;

const globalForPrisma = globalThis as unknown as {
  prismaAdapter?: PrismaBetterSqlite3;
  prisma?: GeneratedPrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma.");
}

const prismaAdapter =
  globalForPrisma.prismaAdapter ??
  new PrismaBetterSqlite3({
    url: databaseUrl,
  });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: prismaAdapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaAdapter = prismaAdapter;
  globalForPrisma.prisma = prisma;
}
