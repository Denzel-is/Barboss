import "dotenv/config";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = new pg.Client({ connectionString });

const statements = [
  `DO $$ BEGIN
    CREATE TYPE "ChatMessageType" AS ENUM ('text', 'photo', 'video', 'voice');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,
  `ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "messageType" "ChatMessageType" NOT NULL DEFAULT 'text'`,
  `ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "text" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT`,
  `ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "fileName" TEXT`,
  `UPDATE "ChatMessage" SET "messageType" = 'text' WHERE "messageType" IS NULL`,
];

await client.connect();

for (const statement of statements) {
  await client.query(statement);
}

const { rows: bodyColumn } = await client.query(
  `SELECT 1 FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'ChatMessage' AND column_name = 'body'`,
);

if (bodyColumn.length > 0) {
  await client.query(
    `UPDATE "ChatMessage" SET "text" = "body" WHERE "body" IS NOT NULL AND ("text" IS NULL OR "text" = '')`,
  );
  await client.query(`ALTER TABLE "ChatMessage" DROP COLUMN IF EXISTS "body"`);
}

await client.end();
console.log("ChatMessage schema migrated.");
