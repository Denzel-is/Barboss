import { NextResponse } from "next/server";

import { writeAuthLog } from "@/lib/logs";
import { getSession } from "@/lib/session";
import { reportSiteError } from "@/lib/site-errors";
import { hasSupabasePublishableOnly } from "@/lib/supabase-server";
import {
  buildChatObjectKey,
  getStorageDriver,
  isStorageConfigured,
  uploadObject,
} from "@/lib/storage";
import { formatMaxUploadSize, getMaxUploadSize, getMediaCategory } from "@/lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Нужна авторизация." }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    const publishableOnlyHint = hasSupabasePublishableOnly()
      ? " Добавь SUPABASE_SECRET_KEY в .env."
      : "";

    return NextResponse.json(
      {
        error: `Хранилище не настроено.${publishableOnlyHint}`,
      },
      { status: 503 },
    );
  }

  const storageDriver = getStorageDriver();

  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File) || fileValue.size === 0) {
      return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
    }

    const category = getMediaCategory(fileValue.type);

    if (!category) {
      return NextResponse.json(
        { error: "Разрешены только фото, видео и голосовые (image/*, video/*, audio/*)." },
        { status: 400 },
      );
    }

    const maxSize = getMaxUploadSize(category);

    if (fileValue.size > maxSize) {
      return NextResponse.json(
        {
          error: `Файл слишком большой. Максимум: ${formatMaxUploadSize(category)}.`,
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await fileValue.arrayBuffer());
    const objectKey = buildChatObjectKey(session.userId, fileValue.name);
    const fileUrl = await uploadObject({
      key: objectKey,
      body: buffer,
      contentType: fileValue.type,
    });

    return NextResponse.json({
      fileUrl,
      fileType: fileValue.type,
      fileName: fileValue.name,
      storageDriver,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown chat upload error";

    await writeAuthLog({
      action: "chat_upload_failed",
      message: `${session.username}: ${message}`,
      userId: session.userId,
    });

    await reportSiteError({
      message: `Chat upload failed for ${session.username}: ${message}`,
      userId: session.userId,
      source: "api/chat/upload",
    });

    if (message === "STORAGE_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Хранилище не настроено." }, { status: 503 });
    }

    return NextResponse.json({ error: "Не удалось загрузить файл." }, { status: 500 });
  }
}
