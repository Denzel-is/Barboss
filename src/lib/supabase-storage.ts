import type { StorageConfig } from "@/lib/storage";

function trim(value: string | undefined) {
  return value?.trim() ?? "";
}

export function resolveSupabaseProjectUrl() {
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

export function buildSupabaseS3Endpoint(projectUrl: string) {
  return `${projectUrl}/storage/v1/s3`;
}

export function buildSupabasePublicStorageUrl(projectUrl: string, bucket: string) {
  return `${projectUrl}/storage/v1/object/public/${bucket}`;
}

export function getSupabaseStorageConfig(): StorageConfig | null {
  const projectUrl = resolveSupabaseProjectUrl();
  const accessKey = trim(process.env.STORAGE_ACCESS_KEY) || trim(process.env.SUPABASE_S3_ACCESS_KEY);
  const secretKey = trim(process.env.STORAGE_SECRET_KEY) || trim(process.env.SUPABASE_S3_SECRET_KEY);
  const bucket = trim(process.env.STORAGE_BUCKET) || trim(process.env.SUPABASE_STORAGE_BUCKET) || "barboss";

  if (!projectUrl || !accessKey || !secretKey || accessKey === secretKey) {
    return null;
  }

  const endpoint = trim(process.env.STORAGE_ENDPOINT) || buildSupabaseS3Endpoint(projectUrl);
  const publicUrl = trim(process.env.STORAGE_PUBLIC_URL) || buildSupabasePublicStorageUrl(projectUrl, bucket);

  return {
    endpoint,
    accessKey,
    secretKey,
    bucket,
    publicUrl: publicUrl.replace(/\/$/, ""),
    region: trim(process.env.STORAGE_REGION) || "us-east-1",
  };
}
