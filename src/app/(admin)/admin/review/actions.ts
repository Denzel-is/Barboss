"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { writeAuthLog } from "@/lib/logs";
import { formatReward } from "@/lib/format";

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function reviewSubmissionAction(formData: FormData) {
  const admin = await requireRole("admin");
  const submissionId = getFormString(formData, "submissionId");
  const intent = getFormString(formData, "intent");
  const adminComment = getFormString(formData, "adminComment");

  if (!submissionId || (intent !== "approve" && intent !== "reject")) {
    redirect("/admin/review?error=invalid");
  }

  const db = getDb();
  const result = await db.$transaction(async (tx) => {
    const updateResult = await tx.taskSubmission.updateMany({
      where: {
        id: submissionId,
        status: "pending",
      },
      data: {
        status: intent === "approve" ? "approved" : "rejected",
        adminComment: adminComment || null,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      },
    });

    if (updateResult.count === 0) {
      return null;
    }

    const submission = await tx.taskSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!submission) {
      return null;
    }

    const approved = intent === "approve";

    if (approved) {
      await tx.walletTransaction.create({
        data: {
          userId: submission.userId,
          amount: submission.task.reward,
          type: submission.task.reward < 0 ? "penalty" : "task_reward",
          sourceId: submission.id,
          description: submission.task.title,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: submission.userId,
        title: approved ? "Задание подтверждено" : "Задание отклонено",
        body: approved
          ? `${submission.task.title}: ${formatReward(submission.task.reward)}.`
          : `${submission.task.title}: отправка отклонена.`,
      },
    });

    return {
      approved,
      taskTitle: submission.task.title,
      participantId: submission.userId,
      participantUsername: submission.user.username,
      reward: submission.task.reward,
    };
  });

  if (!result) {
    redirect("/admin/review?error=not_pending");
  }

  await writeAuthLog({
    action: result.approved ? "task_submission_approved" : "task_submission_rejected",
    message: result.approved
      ? `${admin.username} approved "${result.taskTitle}" for ${result.participantUsername}: ${formatReward(result.reward)}.`
      : `${admin.username} rejected "${result.taskTitle}" for ${result.participantUsername}.`,
    userId: admin.id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/review");
  revalidatePath("/app");
  revalidatePath("/app/tasks");
  redirect(`/admin/review?reviewed=${result.approved ? "approved" : "rejected"}`);
}
