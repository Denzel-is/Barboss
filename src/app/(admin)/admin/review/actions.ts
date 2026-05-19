"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { writeAuthLog } from "@/lib/logs";
import { formatReward } from "@/lib/format";
import { NOTIFICATION_TYPES, TOAST_KEYS } from "@/lib/notification-types";
import { createNotification } from "@/lib/notifications";
import { notifyParticipantTaskApproved, notifyParticipantTaskRejected } from "@/lib/telegram";

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

    if (approved) {
      await createNotification(
        {
          userId: submission.userId,
          title: "Задание принято",
          message: `«${submission.task.title}»: ${formatReward(submission.task.reward)}.`,
          type: NOTIFICATION_TYPES.taskApproved,
        },
        tx,
      );

      await createNotification(
        {
          userId: submission.userId,
          title: "Райданчики начислены",
          message: `${formatReward(submission.task.reward)} за «${submission.task.title}».`,
          type: NOTIFICATION_TYPES.rewardCredited,
        },
        tx,
      );
    } else {
      await createNotification(
        {
          userId: submission.userId,
          title: "Задание отклонено",
          message: `«${submission.task.title}» не принято.`,
          type: NOTIFICATION_TYPES.taskRejected,
        },
        tx,
      );
    }

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

  if (result.approved) {
    await notifyParticipantTaskApproved({
      taskTitle: result.taskTitle,
      reward: result.reward,
      userId: result.participantId,
    });
  } else {
    await notifyParticipantTaskRejected({
      taskTitle: result.taskTitle,
      userId: result.participantId,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/review");
  revalidatePath("/admin/notifications");
  revalidatePath("/app");
  revalidatePath("/app/tasks");
  revalidatePath("/app/notifications");
  redirect(
    `/admin/review?toast=${result.approved ? TOAST_KEYS.taskApproved : TOAST_KEYS.taskRejected}`,
  );
}
