import { mkdir, unlink, writeFile } from "fs/promises";
import { dirname, join, normalize } from "path";

const UPLOAD_ROOT = join(process.cwd(), "storage", "uploads");

export function getLocalUploadRoot() {
  return UPLOAD_ROOT;
}

export async function saveLocalObject(key: string, body: Buffer) {
  const filePath = join(UPLOAD_ROOT, ...key.split("/"));
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export async function deleteLocalObject(key: string) {
  const filePath = resolveLocalFilePath(key.split("/"));

  try {
    await unlink(filePath);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

export function resolveLocalFilePath(segments: string[]) {
  const filePath = normalize(join(UPLOAD_ROOT, ...segments));

  if (!filePath.startsWith(normalize(UPLOAD_ROOT))) {
    throw new Error("INVALID_STORAGE_PATH");
  }

  return filePath;
}
