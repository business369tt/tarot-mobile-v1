import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !databaseUrl.startsWith("file:")) {
  throw new Error("DATABASE_URL must be a local SQLite file URL.");
}

const workspaceRoot = process.cwd();
const databasePath = path.resolve(
  workspaceRoot,
  databaseUrl.slice("file:".length),
);
const sqlPath = path.resolve(workspaceRoot, "prisma/init.sql");
const sql = fs.readFileSync(sqlPath, "utf8");
const idempotentSql = sql
  .replaceAll("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
  .replaceAll(
    "CREATE UNIQUE INDEX ",
    "CREATE UNIQUE INDEX IF NOT EXISTS ",
  )
  .replaceAll("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ");
const statements = idempotentSql
  .split(/;\s*\n/g)
  .map((statement) =>
    statement
      .replace(/^--.*$/gm, "")
      .trim(),
  )
  .filter(Boolean)
  .map((statement) => `${statement};`);
const tableStatements = statements.filter((statement) =>
  statement.startsWith("CREATE TABLE"),
);
const indexStatements = statements.filter((statement) =>
  statement.startsWith("CREATE INDEX") ||
  statement.startsWith("CREATE UNIQUE INDEX"),
);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);

database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");

function hasColumn(tableName, columnName) {
  const rows = database.prepare(`PRAGMA table_info("${tableName}")`).all();

  return rows.some((row) => row.name === columnName);
}

function ensureColumn(tableName, columnName, statement) {
  const tableExists = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
    )
    .get(tableName);

  if (!tableExists || hasColumn(tableName, columnName)) {
    return;
  }

  database.exec(statement);
}

database.exec(tableStatements.join("\n"));
ensureColumn(
  "User",
  "points",
  'ALTER TABLE "User" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;',
);
ensureColumn(
  "ReadingRecord",
  "costPoints",
  'ALTER TABLE "ReadingRecord" ADD COLUMN "costPoints" INTEGER NOT NULL DEFAULT 0;',
);
ensureColumn(
  "ReadingRecord",
  "chargeRequestKey",
  'ALTER TABLE "ReadingRecord" ADD COLUMN "chargeRequestKey" TEXT;',
);
ensureColumn(
  "ReadingRecord",
  "chargeTransactionId",
  'ALTER TABLE "ReadingRecord" ADD COLUMN "chargeTransactionId" TEXT;',
);
database.exec(indexStatements.join("\n"));
database.close();

console.log(`Local SQLite database initialized at ${databasePath}`);
