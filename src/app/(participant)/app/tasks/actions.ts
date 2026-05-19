"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { writeAuthLog } from "@/lib/logs";
import { NOTIFICATION_TYPES, TOAST_KEYS } from "@/lib/notification-types";
import { createAdminNotifications, createNotification } from "@/lib/notifications";
import { getMoscowDayRange, isSixCircleTaskTitle, SIX_CIRCLE_REQUIRED_COUNT } from "@/lib/task-requirements";
import { notifyAdminNewSubmission } from "@/lib/telegram";

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

type SubmissionFileInput = {
  fileUrl: string;
  fileType: string;
  fileName: string;
  captureMode?: string;
  recordedAt?: number;
  durationMs?: number;
};

function parseSubmissionFiles(rawValue: string): SubmissionFileInput[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized: SubmissionFileInput[] = [];

    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const file = entry as Partial<SubmissionFileInput>;
      const fileUrl = typeof file.fileUrl === "string" ? file.fileUrl.trim() : "";
      const fileType = typeof file.fileType === "string" ? file.fileType.trim() : "";
      const fileName = typeof file.fileName === "string" ? file.fileName.trim() : "";

      if (!fileUrl || !fileType || !fileName) {
        continue;
      }

      if (!fileType.startsWith("image/") && !fileType.startsWith("video/") && !fileType.startsWith("audio/")) {
        continue;
      }

      normalized.push({
        fileUrl,
        fileType,
        fileName,
        captureMode: typeof file.captureMode === "string" ? file.captureMode : undefined,
        recordedAt: typeof file.recordedAt === "number" ? file.recordedAt : undefined,
        durationMs: typeof file.durationMs === "number" ? file.durationMs : undefined,
      });
    }

    return normalized;
  } catch {
    return [];
  }
}

export async function submitTaskAction(formData: FormData) {
  const user = await requireRole("participant");
  const taskId = getFormString(formData, "taskId");
  const comment = getFormString(formData, "comment");
  const proofText = getFormString(formData, "proofText");
  const files = parseSubmissionFiles(getFormString(formData, "files"));
  const proofCapture = getFormString(formData, "proofCapture");

  if (!taskId) {
    redirect("/app/tasks?error=task");
  }

  const db = getDb();
  const task = await db.task.findFirst({
    where: {
      id: taskId,
      isActive: true,
    },
  });

  if (!task) {
    redirect("/app/tasks?error=task");
  }

  const isSixCircleTask = isSixCircleTaskTitle(task.title);

  if (isSixCircleTask) {
    const today = getMoscowDayRange();
    const todayAcceptedOrPendingCount = await db.taskSubmission.count({
      where: {
        taskId: task.id,
        userId: user.id,
        status: { in: ["pending", "approved"] },
        createdAt: {
          gte: today.start,
          lt: today.end,
        },
      },
    });

    if (todayAcceptedOrPendingCount >= SIX_CIRCLE_REQUIRED_COUNT) {
      redirect("/app/tasks?submitted=1");
    }
  } else {
    const existingPending = await db.taskSubmission.findFirst({
      where: {
        taskId: task.id,
        userId: user.id,
        status: "pending",
      },
      select: {
        id: true,
      },
    });

    if (existingPending) {
      redirect("/app/tasks?submitted=1");
    }
  }

  const hasVideo = files.some((file) => file.fileType.startsWith("video/"));
  const maxRecordingAgeMs = 30 * 60 * 1000;
  const now = Date.now();

  if (task.proofType === "video" && proofCapture !== "live") {
    redirect("/app/tasks?error=video_required");
  }

  if (task.proofType === "video" && !hasVideo) {
    redirect("/app/tasks?error=video_required");
  }

  if (files.length === 0) {
    redirect("/app/tasks?error=video_required");
  }

  for (const file of files) {
    if (file.fileType.startsWith("video/") && file.captureMode !== "live") {
      redirect("/app/tasks?error=video_required");
    }

    if (
      file.fileType.startsWith("video/") &&
      (typeof file.recordedAt !== "number" || now - file.recordedAt > maxRecordingAgeMs || file.recordedAt > now + 60_000)
    ) {
      redirect("/app/tasks?error=video_required");
    }

    if (file.fileType.startsWith("video/") && typeof file.durationMs === "number" && file.durationMs < 500) {
      redirect("/app/tasks?error=video_required");
    }
  }

  const videoCount = files.filter((file) => file.fileType.startsWith("video/")).length;

  if (isSixCircleTask && videoCount !== 1) {
    redirect("/app/tasks?error=video_required");
  }

  await db.$transaction(async (tx) => {
    await tx.taskSubmission.create({
      data: {
        taskId: task.id,
        userId: user.id,
        comment: comment || null,
        proofText: proofText || null,
        status: "pending",
        files:
          files.length > 0
            ? {
                create: files.map((file) => ({
                  fileUrl: file.fileUrl,
                  fileType: file.fileType,
                  fileName: file.fileName,
                })),
              }
            : undefined,
      },
    });

    await createNotification(
      {
        userId: user.id,
        title: "Задание отправлено",
        message: `«${task.title}» отправлено на проверку.`,
        type: NOTIFICATION_TYPES.taskSubmitted,
      },
      tx,
    );

    await createAdminNotifications(
      {
        title: "Новое выполнение",
        message: `${user.username} отправил(а) «${task.title}» на проверку.`,
        type: NOTIFICATION_TYPES.taskSubmitted,
      },
      tx,
    );
  });

  await writeAuthLog({
    action: "task_submission_created",
    message: `${user.username} sent "${task.title}" for review${files.length > 0 ? ` with ${files.length} file(s)` : ""}.`,
    userId: user.id,
  });

  await notifyAdminNewSubmission({
    username: user.username,
    taskTitle: task.title,
    userId: user.id,
  });

  revalidatePath("/app");
  revalidatePath("/app/tasks");
  revalidatePath("/app/notifications");
  revalidatePath("/admin");
  revalidatePath("/admin/review");
  revalidatePath("/admin/notifications");
  redirect(`/app/tasks?toast=${TOAST_KEYS.taskSubmitted}`);
}
