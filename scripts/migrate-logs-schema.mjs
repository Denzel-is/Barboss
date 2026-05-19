import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = new pg.Client({ connectionString });

const statements = [
  `DO $$ BEGIN
    CREATE TYPE "LogLevel" AS ENUM ('info', 'warning', 'error');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `DO $$ BEGIN
    CREATE TYPE "IssueStatus" AS ENUM ('open', 'in_progress', 'fixed');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$`,
  `ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "level" "LogLevel" NOT NULL DEFAULT 'info'`,
  `ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "actor" TEXT`,
  `ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "entityType" TEXT`,
  `ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "metadata" JSONB`,
  `ALTER TABLE "Log" ADD COLUMN IF NOT EXISTS "status" "IssueStatus" NOT NULL DEFAULT 'open'`,
  `UPDATE "Log" SET "level" = 'error' WHERE "action" IN ('site_error', 'telegram_failed', 'chat_send_failed', 'chat_upload_failed', 'file_upload_failed')`,
  `UPDATE "Log" SET "level" = 'warning' WHERE "action" LIKE '%_failed' AND "level" = 'info'`,
  `UPDATE "Log" l SET "actor" = u."username" FROM "User" u WHERE l."userId" = u."id" AND l."actor" IS NULL`,
  `UPDATE "Log" SET "actor" = 'system' WHERE "actor" IS NULL`,
  `CREATE TABLE IF NOT EXISTS "ErrorReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "pageUrl" TEXT NOT NULL,
    "action" TEXT,
    "errorMessage" TEXT NOT NULL,
    "stack" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ErrorReport_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "ErrorReport_status_idx" ON "ErrorReport"("status")`,
  `CREATE INDEX IF NOT EXISTS "ErrorReport_createdAt_idx" ON "ErrorReport"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ErrorReport_userId_idx" ON "ErrorReport"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Log_level_idx" ON "Log"("level")`,
  `CREATE INDEX IF NOT EXISTS "Log_status_idx" ON "Log"("status")`,
];

await client.connect();

for (const statement of statements) {
  await client.query(statement);
}

const fkExists = await client.query(
  `SELECT 1 FROM pg_constraint WHERE conname = 'ErrorReport_userId_fkey'`,
);

if (fkExists.rows.length === 0) {
  await client.query(
    `ALTER TABLE "ErrorReport" ADD CONSTRAINT "ErrorReport_userId_fkey"
     FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  );
}

await client.end();
console.log("Logs and ErrorReport schema migrated.");
