import { readFile, stat } from "fs/promises";
import { extname } from "path";
import { NextResponse } from "next/server";

import { resolveLocalFilePath } from "@/lib/storage-local";
import { getStorageDriver } from "@/lib/storage";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
};

type MediaRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(_request: Request, context: MediaRouteContext) {
  if (getStorageDriver() !== "local") {
    return NextResponse.json({ error: "Media route is only used for local storage." }, { status: 404 });
  }

  const { path } = await context.params;

  if (!path?.length) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const filePath = resolveLocalFilePath(path);
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const buffer = await readFile(filePath);
    const extension = extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXTENSION[extension] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buffer.length),
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
