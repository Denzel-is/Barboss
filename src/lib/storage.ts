import { randomUUID } from "crypto";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { deleteLocalObject, saveLocalObject } from "@/lib/storage-local";
import { buildSupabasePublicStorageUrl, getSupabaseStorageConfig } from "@/lib/supabase-storage";
import { deleteFromSupabaseStorage, uploadToSupabaseStorage } from "@/lib/supabase-storage-upload";
import {
  getSupabaseBucket,
  getSupabaseProjectUrl,
  hasSupabasePublishableOnly,
  isSupabaseStorageConfigured,
} from "@/lib/supabase-server";

export type StorageConfig = {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrl: string;
  region: string;
};

export type StorageDriver = "supabase" | "s3" | "local";

function getRawS3Config(): StorageConfig | null {
  const endpoint = process.env.STORAGE_ENDPOINT?.trim();
  const accessKey = process.env.STORAGE_ACCESS_KEY?.trim();
  const secretKey = process.env.STORAGE_SECRET_KEY?.trim();
  const bucket = process.env.STORAGE_BUCKET?.trim();
  const publicUrl = process.env.STORAGE_PUBLIC_URL?.trim();

  if (!endpoint || !accessKey || !secretKey || !bucket || !publicUrl) {
    return null;
  }

  if (accessKey === secretKey) {
    return null;
  }

  return {
    endpoint,
    accessKey,
    secretKey,
    bucket,
    publicUrl: publicUrl.replace(/\/$/, ""),
    region: process.env.STORAGE_REGION?.trim() || "us-east-1",
  };
}

export function getStorageConfig(): StorageConfig | null {
  const supabaseS3Config = getSupabaseStorageConfig();
  if (supabaseS3Config) {
    return supabaseS3Config;
  }

  return getRawS3Config();
}

export function hasValidS3Credentials() {
  return getStorageConfig() !== null && getStorageDriver() === "s3";
}

export function getStorageDriver(): StorageDriver | null {
  const explicit = process.env.STORAGE_DRIVER?.trim().toLowerCase();

  if (explicit === "local") {
    return "local";
  }

  if (explicit === "supabase") {
    if (isSupabaseStorageConfigured()) {
      return "supabase";
    }

    if (hasSupabasePublishableOnly() && process.env.NODE_ENV !== "production") {
      return "local";
    }

    return null;
  }

  if (explicit === "s3") {
    return getStorageConfig() ? "s3" : null;
  }

  if (isSupabaseStorageConfigured()) {
    return "supabase";
  }

  if (getStorageConfig()) {
    return "s3";
  }

  if (hasSupabasePublishableOnly() && process.env.NODE_ENV !== "production") {
    return "local";
  }

  if (process.env.NODE_ENV !== "production") {
    return "local";
  }

  return null;
}

export function isStorageConfigured() {
  return getStorageDriver() !== null;
}

export function getPublicStorageBaseUrl() {
  const driver = getStorageDriver();

  if (driver === "s3") {
    return getStorageConfig()?.publicUrl ?? "";
  }

  if (driver === "supabase") {
    const projectUrl = getSupabaseProjectUrl();
    if (projectUrl) {
      return buildSupabasePublicStorageUrl(projectUrl, getSupabaseBucket());
    }
  }

  const configured = process.env.STORAGE_PUBLIC_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return `${appUrl}/api/media`;
}

function createS3Client(config: StorageConfig) {
  return new S3Client({
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
}

export function buildSubmissionObjectKey(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "file";
  return `submissions/${userId}/${Date.now()}-${randomUUID()}-${safeName}`;
}

export function buildChatObjectKey(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "file";
  return `chat/${userId}/${Date.now()}-${randomUUID()}-${safeName}`;
}

export function buildPublicFileUrl(publicUrl: string, objectKey: string) {
  return `${publicUrl}/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

type UploadObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

async function uploadToS3({ key, body, contentType }: UploadObjectInput) {
  const config = getStorageConfig();

  if (!config) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }

  const client = createS3Client(config);

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return buildPublicFileUrl(config.publicUrl, key);
}

async function deleteFromS3(key: string) {
  const config = getStorageConfig();

  if (!config) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }

  const client = createS3Client(config);

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );

  return true;
}

async function uploadToSupabase(input: UploadObjectInput) {
  return uploadToSupabaseStorage(input);
}

async function uploadToLocal({ key, body }: UploadObjectInput) {
  await saveLocalObject(key, body);
  return buildPublicFileUrl(getPublicStorageBaseUrl(), key);
}

export async function uploadObject(input: UploadObjectInput) {
  const driver = getStorageDriver();

  if (driver === "supabase") {
    return uploadToSupabase(input);
  }

  if (driver === "s3") {
    return uploadToS3(input);
  }

  if (driver === "local") {
    return uploadToLocal(input);
  }

  throw new Error("STORAGE_NOT_CONFIGURED");
}

export function getObjectKeyFromPublicUrl(fileUrl: string) {
  const candidates = [
    getPublicStorageBaseUrl(),
    getStorageConfig()?.publicUrl,
    buildSupabasePublicStorageUrl(getSupabaseProjectUrl(), getSupabaseBucket()),
  ].filter(Boolean);

  for (const baseUrl of candidates) {
    if (!baseUrl || !fileUrl.startsWith(`${baseUrl}/`)) {
      continue;
    }

    return decodeURIComponent(fileUrl.slice(baseUrl.length + 1));
  }

  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const publicIndex = pathParts.findIndex((part, index) => part === "public" && pathParts[index - 2] === "object");

    if (publicIndex >= 0) {
      return pathParts.slice(publicIndex + 2).map(decodeURIComponent).join("/");
    }

    const mediaIndex = pathParts.findIndex((part) => part === "media");

    if (mediaIndex >= 0) {
      return pathParts.slice(mediaIndex + 1).map(decodeURIComponent).join("/");
    }
  } catch {
    return null;
  }

  return null;
}

export async function deleteObjectByPublicUrl(fileUrl: string) {
  const key = getObjectKeyFromPublicUrl(fileUrl);

  if (!key) {
    return false;
  }

  const driver = getStorageDriver();

  if (driver === "supabase") {
    return deleteFromSupabaseStorage(key);
  }

  if (driver === "s3") {
    return deleteFromS3(key);
  }

  if (driver === "local") {
    return deleteLocalObject(key);
  }

  return false;
}
