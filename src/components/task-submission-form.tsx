"use client";

import { useCallback, useState } from "react";

import { submitTaskAction } from "@/app/(participant)/app/tasks/actions";
import { LiveVideoRecorder, type RecordedVideoClip } from "@/components/live-video-recorder";
import type { StorageDriver } from "@/lib/storage";
import { hasSupabasePublishableOnly } from "@/lib/supabase-server";

type UploadedFilePayload = {
  fileUrl: string;
  fileType: string;
  fileName: string;
  captureMode: "live";
  recordedAt: number;
  durationMs: number;
};

type TaskSubmissionFormProps = {
  taskId: string;
  taskTitle: string;
  proofType: string;
  storageConfigured: boolean;
  storageDriver: StorageDriver | null;
};

function isCircleVideoTask(taskTitle: string) {
  return taskTitle.toLowerCase().includes("кружоч");
}

function getMaxClips(taskTitle: string) {
  return isCircleVideoTask(taskTitle) ? 6 : 1;
}

export function TaskSubmissionForm({
  taskId,
  taskTitle,
  proofType,
  storageConfigured,
  storageDriver,
}: TaskSubmissionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recordedClips, setRecordedClips] = useState<RecordedVideoClip[]>([]);

  const videoRequired = proofType === "video";
  const isCircle = isCircleVideoTask(taskTitle);
  const maxClips = getMaxClips(taskTitle);

  const handleClipsChange = useCallback((clips: RecordedVideoClip[]) => {
    setRecordedClips(clips);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!storageConfigured) {
      setError("Хранилище не настроено. Добавь Supabase STORAGE_* в .env и перезапусти сервер.");
      return;
    }

    if (videoRequired && recordedClips.length === 0) {
      setError("Сначала сними видео с камеры — загрузка из галереи отключена.");
      return;
    }

    if (isCircle && recordedClips.length < 6) {
      setError("Для этого задания нужно снять 6 коротких видео-кружочков.");
      return;
    }

    setUploading(true);

    try {
      const uploadedFiles: UploadedFilePayload[] = [];

      for (const clip of recordedClips) {
        const uploadBody = new FormData();
        uploadBody.append("file", clip.blob, clip.fileName);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "X-Proof-Capture": "live",
          },
          body: uploadBody,
        });

        const payload = (await response.json()) as UploadedFilePayload & { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Не удалось загрузить видео.");
          return;
        }

        uploadedFiles.push({
          fileUrl: payload.fileUrl,
          fileType: payload.fileType,
          fileName: payload.fileName,
          captureMode: "live",
          recordedAt: clip.recordedAt,
          durationMs: clip.durationMs,
        });
      }

      const submitData = new FormData();
      submitData.set("taskId", taskId);
      submitData.set("comment", String(formData.get("comment") ?? ""));
      submitData.set("proofText", String(formData.get("proofText") ?? ""));
      submitData.set("files", JSON.stringify(uploadedFiles));
      submitData.set("proofCapture", "live");

      await submitTaskAction(submitData);
    } catch {
      setError("Не удалось отправить задание. Попробуй еще раз.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="mt-3 space-y-3 rounded-[8px] bg-neutral-50 p-3" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Комментарий</span>
        <textarea
          className="mt-2 min-h-20 w-full rounded-[8px] border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          disabled={uploading}
          name="comment"
          placeholder="Что сделано?"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Текстовое доказательство (необязательно)</span>
        <textarea
          className="mt-2 min-h-16 w-full rounded-[8px] border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          disabled={uploading}
          name="proofText"
          placeholder="Заметка для проверки"
        />
      </label>

      {videoRequired ? (
        <LiveVideoRecorder
          disabled={uploading}
          isCircle={isCircle}
          maxClips={maxClips}
          maxDurationSeconds={isCircle ? 15 : 120}
          onClipsChange={handleClipsChange}
        />
      ) : null}

      {storageDriver === "supabase" || storageDriver === "s3" ? (
        <p className="text-xs text-emerald-700">Файлы сохраняются в Supabase Storage.</p>
      ) : null}
      {storageDriver === "local" && hasSupabasePublishableOnly() ? (
        <p className="text-xs text-amber-700">
          Сейчас локальное хранилище. Создай Secret key в Supabase → SUPABASE_SECRET_KEY в .env.
        </p>
      ) : null}
      {storageDriver === "local" && !hasSupabasePublishableOnly() ? (
        <p className="text-xs text-amber-700">Локальное хранилище (для продакшена добавь SUPABASE_SERVICE_ROLE_KEY).</p>
      ) : null}

      <button
        className="h-11 w-full rounded-[8px] bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
        disabled={uploading || (videoRequired && recordedClips.length === 0)}
        type="submit"
      >
        {uploading ? "Загрузка видео..." : "Отправить"}
      </button>
    </form>
  );
}
