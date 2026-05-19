import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

const root = process.cwd();
const envPath = join(root, ".env");

function trim(value) {
  return value?.trim() ?? "";
}

function resolveSupabaseProjectUrl() {
  const direct = trim(process.env.SUPABASE_URL);
  if (direct) {
    return direct.replace(/\/$/, "");
  }

  const projectRef = trim(process.env.SUPABASE_PROJECT_REF);
  if (projectRef) {
    return `https://${projectRef}.supabase.co`;
  }

  return "";
}

function buildSupabaseS3Endpoint(projectUrl) {
  return `${projectUrl}/storage/v1/s3`;
}

function buildSupabasePublicStorageUrl(projectUrl, bucket) {
  return `${projectUrl}/storage/v1/object/public/${bucket}`;
}

function readEnv() {
  if (!existsSync(envPath)) {
    throw new Error(".env not found. Copy .env.example to .env first.");
  }

  return readFileSync(envPath, "utf8");
}

function upsertEnvValue(content, key, value) {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
}

function getConfigFromEnv() {
  const projectUrl = resolveSupabaseProjectUrl();
  const accessKey = trim(process.env.STORAGE_ACCESS_KEY) || trim(process.env.SUPABASE_S3_ACCESS_KEY);
  const secretKey = trim(process.env.STORAGE_SECRET_KEY) || trim(process.env.SUPABASE_S3_SECRET_KEY);
  const bucket = trim(process.env.STORAGE_BUCKET) || trim(process.env.SUPABASE_STORAGE_BUCKET) || "barboss";

  if (!projectUrl) {
    throw new Error("Set SUPABASE_URL or SUPABASE_PROJECT_REF in .env");
  }

  if (!accessKey || !secretKey) {
    throw new Error("Set STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY (S3 keys from Supabase → Storage → S3).");
  }

  const endpoint = trim(process.env.STORAGE_ENDPOINT) || buildSupabaseS3Endpoint(projectUrl);
  const publicUrl = trim(process.env.STORAGE_PUBLIC_URL) || buildSupabasePublicStorageUrl(projectUrl, bucket);
  const region = trim(process.env.STORAGE_REGION) || "us-east-1";

  return { projectUrl, accessKey, secretKey, bucket, endpoint, publicUrl, region };
}

async function testUpload(config) {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const key = `healthcheck/${Date.now()}.txt`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: Buffer.from("barboss storage ok", "utf8"),
      ContentType: "text/plain",
    }),
  );

  return `${config.publicUrl}/${key}`;
}

async function main() {
  const config = getConfigFromEnv();
  let envContent = readEnv();

  envContent = upsertEnvValue(envContent, "STORAGE_DRIVER", "s3");
  envContent = upsertEnvValue(envContent, "STORAGE_ENDPOINT", config.endpoint);
  envContent = upsertEnvValue(envContent, "STORAGE_PUBLIC_URL", config.publicUrl);
  envContent = upsertEnvValue(envContent, "STORAGE_BUCKET", config.bucket);
  envContent = upsertEnvValue(envContent, "STORAGE_REGION", config.region);

  if (!trim(process.env.SUPABASE_URL)) {
    envContent = upsertEnvValue(envContent, "SUPABASE_URL", config.projectUrl);
  }

  writeFileSync(envPath, envContent);

  const publicFileUrl = await testUpload(config);

  console.log("Supabase Storage configured.");
  console.log(`Bucket: ${config.bucket}`);
  console.log(`S3 endpoint: ${config.endpoint}`);
  console.log(`Public URL base: ${config.publicUrl}`);
  console.log(`Test file uploaded: ${publicFileUrl}`);
  console.log("Restart dev server: npm run dev");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error("\nHow to get keys:");
  console.error("1. supabase.com → your project → Storage → New bucket (public): barboss");
  console.error("2. Storage → S3 → Generate access keys");
  console.error("3. Put SUPABASE_URL, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY into .env");
  console.error("4. Run: npm run storage:setup");
  process.exit(1);
});
