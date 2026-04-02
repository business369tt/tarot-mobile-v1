import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { ITXClientDenyList } from "@prisma/client/runtime/client";

// The generated Prisma client shape differs across environments here, so we keep
// a wide compatibility type and narrow at the usage sites that rely on delegates.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientLike = Record<string, any>;

type PrismaClientConstructor = new (options?: {
  adapter?: PrismaBetterSqlite3;
  log?: Array<"error" | "warn">;
}) => PrismaClientLike;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: PrismaClientConstructor;
};

export type TransactionClient = Omit<PrismaClientLike, ITXClientDenyList>;

const globalForPrisma = globalThis as unknown as {
  prismaAdapter?: PrismaBetterSqlite3;
  prisma?: PrismaClientLike;
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
