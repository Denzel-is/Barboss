import "dotenv/config";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!key) {
  console.error("Нужен SUPABASE_SECRET_KEY (sb_secret_...) или legacy anon JWT (eyJ...).");
  console.error("Dashboard → Settings → API Keys → Create secret key");
  process.exit(1);
}

if (key.startsWith("sb_publishable_")) {
  console.error("sb_publishable_* не для upload. Создай Secret key в API Keys.");
  process.exit(1);
}
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "barboss";

if (!url || !key) {
  console.error("Missing SUPABASE_URL or API key in .env");
  process.exit(1);
}

const objectKey = `healthcheck/${Date.now()}.txt`;
const uploadUrl = `${url.replace(/\/$/, "")}/storage/v1/object/${bucket}/${objectKey}`;

const headers = {
  apikey: key,
  "Content-Type": "text/plain",
  "x-upsert": "true",
};

if (key.startsWith("eyJ")) {
  headers.Authorization = `Bearer ${key}`;
}

const response = await fetch(uploadUrl, {
  method: "POST",
  headers,
  body: Buffer.from("barboss supabase storage ok", "utf8"),
});

const responseText = await response.text();

if (!response.ok) {
  console.error("Upload failed:", response.status, responseText);
  process.exit(1);
}

const publicUrl = `${url.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${objectKey}`;
console.log("Upload OK:", publicUrl);
