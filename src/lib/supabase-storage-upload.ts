import { buildSupabasePublicStorageUrl } from "@/lib/supabase-storage";
import { getSupabaseBucket, getSupabaseProjectUrl, getSupabaseServerKey } from "@/lib/supabase-server";

type UploadToSupabaseStorageInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export async function uploadToSupabaseStorage({ key, body, contentType }: UploadToSupabaseStorageInput) {
  const projectUrl = getSupabaseProjectUrl();
  const apiKey = getSupabaseServerKey();
  const bucket = getSupabaseBucket();

  if (!projectUrl || !apiKey) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }

  const uploadUrl = `${projectUrl}/storage/v1/object/${bucket}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const headers: Record<string, string> = {
    apikey: apiKey,
    "Content-Type": contentType,
    "x-upsert": "false",
  };

  // sb_secret_* — только apikey. Legacy JWT (eyJ...) — ещё и Authorization.
  if (apiKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers,
    body: new Uint8Array(body),
  });

  const responseText = await response.text();

  if (!response.ok) {
    const message = responseText.toLowerCase();

    if (message.includes("bucket") && message.includes("not found")) {
      throw new Error("SUPABASE_BUCKET_NOT_FOUND");
    }

    if (
      response.status === 401 ||
      response.status === 403 ||
      message.includes("row-level security") ||
      message.includes("unauthorized") ||
      message.includes("invalid compact jws")
    ) {
      throw new Error("SUPABASE_STORAGE_UNAUTHORIZED");
    }

    throw new Error(responseText || `Supabase upload failed (${response.status})`);
  }

  return `${buildSupabasePublicStorageUrl(projectUrl, bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function deleteFromSupabaseStorage(key: string) {
  const projectUrl = getSupabaseProjectUrl();
  const apiKey = getSupabaseServerKey();
  const bucket = getSupabaseBucket();

  if (!projectUrl || !apiKey) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }

  const deleteUrl = `${projectUrl}/storage/v1/object/${bucket}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const headers: Record<string, string> = {
    apikey: apiKey,
  };

  if (apiKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers,
  });

  if (!response.ok && response.status !== 404) {
    throw new Error((await response.text()) || `Supabase delete failed (${response.status})`);
  }

  return response.ok;
}
