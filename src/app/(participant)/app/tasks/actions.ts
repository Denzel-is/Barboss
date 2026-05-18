"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { writeAuthLog } from "@/lib/logs";

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitTaskAction(formData: FormData) {
  const user = await requireRole("participant");
  const taskId = getFormString(formData, "taskId");
  const comment = getFormString(formData, "comment");
  const proofText = getFormString(formData, "proofText");

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

  await db.taskSubmission.create({
    data: {
      taskId: task.id,
      userId: user.id,
      comment: comment || null,
      proofText: proofText || null,
      status: "pending",
    },
  });

  await writeAuthLog({
    action: "task_submission_created",
    message: `${user.username} sent "${task.title}" for review.`,
    userId: user.id,
  });

  revalidatePath("/app/tasks");
  revalidatePath("/admin");
  revalidatePath("/admin/review");
  redirect("/app/tasks?submitted=1");
}
