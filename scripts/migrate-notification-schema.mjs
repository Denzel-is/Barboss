import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = new pg.Client({ connectionString });

const statements = [
  `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT`,
  `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'info'`,
  `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false`,
  `UPDATE "Notification" SET "message" = "body" WHERE "message" IS NULL AND "body" IS NOT NULL`,
  `UPDATE "Notification" SET "isRead" = true WHERE "readAt" IS NOT NULL`,
  `UPDATE "Notification" SET "message" = '' WHERE "message" IS NULL`,
  `ALTER TABLE "Notification" ALTER COLUMN "message" SET NOT NULL`,
  `ALTER TABLE "Notification" DROP COLUMN IF EXISTS "body"`,
  `ALTER TABLE "Notification" DROP COLUMN IF EXISTS "readAt"`,
  `CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead")`,
];

await client.connect();

for (const statement of statements) {
  await client.query(statement);
}

await client.end();
console.log("Notification schema migrated.");
