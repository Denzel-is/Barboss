import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const prismaCli = join(root, "node_modules", "prisma", "build", "index.js");
const envPath = join(root, ".env");
const envExamplePath = join(root, ".env.example");

function runPrisma(args, options = {}) {
  return execFileSync(process.execPath, [prismaCli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
}

function parsePrismaDevUrls(output) {
  const apiKeyMatch = output.match(/api_key=([A-Za-z0-9_-]+)/);

  if (!apiKeyMatch) {
    throw new Error("Could not find Prisma dev api_key in `prisma dev ls` output.");
  }

  const metadata = JSON.parse(Buffer.from(apiKeyMatch[1], "base64url").toString("utf8"));

  if (!metadata.databaseUrl) {
    throw new Error("Could not find databaseUrl in Prisma dev metadata.");
  }

  return {
    databaseUrl: metadata.databaseUrl,
    shadowDatabaseUrl: metadata.shadowDatabaseUrl,
  };
}

function readEnvFile() {
  if (existsSync(envPath)) {
    return readFileSync(envPath, "utf8");
  }

  if (existsSync(envExamplePath)) {
    return readFileSync(envExamplePath, "utf8");
  }

  return "";
}

function upsertEnvValue(content, key, value) {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  return `${content.trimEnd()}\n${line}\n`;
}

runPrisma(["dev", "--name", "barboss", "--detach"], { stdio: "inherit" });

const output = runPrisma(["dev", "ls"]);
const urls = parsePrismaDevUrls(output);

let envContent = readEnvFile();
envContent = upsertEnvValue(envContent, "DATABASE_URL", urls.databaseUrl);

if (urls.shadowDatabaseUrl) {
  envContent = upsertEnvValue(envContent, "SHADOW_DATABASE_URL", urls.shadowDatabaseUrl);
}

const sessionSecretMatch = envContent.match(/^SESSION_SECRET="?(.*?)"?$/m);
const sessionSecret = sessionSecretMatch?.[1] ?? "";

if (!sessionSecret || sessionSecret.length < 16 || sessionSecret.includes("replace-with")) {
  envContent = upsertEnvValue(
    envContent,
    "SESSION_SECRET",
    "barboss-local-dev-session-secret-32",
  );
}

writeFileSync(envPath, envContent);

console.log("Local Prisma Postgres is running.");
console.log(`DATABASE_URL was written to ${envPath}`);
