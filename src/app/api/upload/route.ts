import { NextResponse } from "next/server";

import { writeAuthLog } from "@/lib/logs";
import { getSession } from "@/lib/session";
import { reportSiteError } from "@/lib/site-errors";
import { hasSupabasePublishableOnly } from "@/lib/supabase-server";
import { buildSubmissionObjectKey, getStorageDriver, isStorageConfigured, uploadObject } from "@/lib/storage";
import { formatMaxUploadSize, getMaxUploadSize, getMediaCategory } from "@/lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "participant") {
    return NextResponse.json({ error: "Нужна авторизация участника." }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    const publishableOnlyHint = hasSupabasePublishableOnly()
      ? " Publishable key не для upload. Создай Secret key: Dashboard → Settings → API Keys → Create secret key → SUPABASE_SECRET_KEY в .env."
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

    const captureMode = request.headers.get("x-proof-capture");
    const category = getMediaCategory(fileValue.type);

    if (category === "video" && captureMode !== "live") {
      return NextResponse.json(
        { error: "Видео можно отправить только после записи с камеры в приложении." },
        { status: 400 },
      );
    }

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
          error: `Файл слишком большой. Максимум для ${category}: ${formatMaxUploadSize(category)}.`,
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await fileValue.arrayBuffer());
    const objectKey = buildSubmissionObjectKey(session.userId, fileValue.name);
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
    const message = error instanceof Error ? error.message : "Unknown upload error";

    await writeAuthLog({
      action: "file_upload_failed",
      message: `${session.username}: ${message}`,
      userId: session.userId,
    });

    await reportSiteError({
      message: `Upload failed for ${session.username}: ${message}`,
      userId: session.userId,
      source: "api/upload",
    });

    if (message === "STORAGE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Хранилище не настроено. Проверь NEXT_PUBLIC_SUPABASE_URL и ключ в .env." },
        { status: 503 },
      );
    }

    if (message === "SUPABASE_BUCKET_NOT_FOUND") {
      return NextResponse.json(
        { error: "Bucket barboss не найден в Supabase. Создай public bucket «barboss» в Storage." },
        { status: 503 },
      );
    }

    if (message === "SUPABASE_STORAGE_UNAUTHORIZED") {
      return NextResponse.json(
        {
          error:
            "Supabase отклонил загрузку. Добавь SUPABASE_SECRET_KEY (Secret key в API Keys) или legacy anon JWT + политику для bucket barboss.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ error: "Не удалось загрузить файл. Попробуй еще раз." }, { status: 500 });
  }
}
