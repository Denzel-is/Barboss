"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { writeAuthLog } from "@/lib/logs";
import { formatReward } from "@/lib/format";
import { NOTIFICATION_TYPES, TOAST_KEYS } from "@/lib/notification-types";
import { createNotification } from "@/lib/notifications";
import {
  getMoscowDayRange,
  getSixCircleRewardSourceId,
  isSixCircleTaskTitle,
  SIX_CIRCLE_REQUIRED_COUNT,
} from "@/lib/task-requirements";
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

    const isSixCircleTask = isSixCircleTaskTitle(submission.task.title);
    let rewardCredited = false;
    let approvedVideoCountToday: number | null = null;

    if (approved && isSixCircleTask) {
      const submissionDay = getMoscowDayRange(submission.createdAt);
      approvedVideoCountToday = await tx.submissionFile.count({
        where: {
          fileType: { startsWith: "video/" },
          submission: {
            taskId: submission.taskId,
            userId: submission.userId,
            status: "approved",
            createdAt: {
              gte: submissionDay.start,
              lt: submissionDay.end,
            },
          },
        },
      });

      const rewardSourceId = getSixCircleRewardSourceId(submission.taskId, submission.userId, submission.createdAt);
      const existingReward = await tx.walletTransaction.findFirst({
        where: { sourceId: rewardSourceId },
        select: { id: true },
      });

      if (approvedVideoCountToday >= SIX_CIRCLE_REQUIRED_COUNT && !existingReward) {
        await tx.walletTransaction.create({
          data: {
            userId: submission.userId,
            amount: submission.task.reward,
            type: submission.task.reward < 0 ? "penalty" : "task_reward",
            sourceId: rewardSourceId,
            description: submission.task.title,
          },
        });
        rewardCredited = true;
      }
    } else if (approved) {
      await tx.walletTransaction.create({
        data: {
          userId: submission.userId,
          amount: submission.task.reward,
          type: submission.task.reward < 0 ? "penalty" : "task_reward",
          sourceId: submission.id,
          description: submission.task.title,
        },
      });
      rewardCredited = true;
    }

    if (approved) {
      if (isSixCircleTask && !rewardCredited) {
        await createNotification(
          {
            userId: submission.userId,
            title: "Кружочек принят",
            message: `${approvedVideoCountToday ?? 1}/${SIX_CIRCLE_REQUIRED_COUNT} видео принято. Райданчики начислятся после 6 принятых кружочков.`,
            type: NOTIFICATION_TYPES.taskApproved,
          },
          tx,
        );
      } else {
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
      }
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
      rewardCredited,
      reward: submission.task.reward,
    };
  });

  if (!result) {
    redirect("/admin/review?error=not_pending");
  }

  await writeAuthLog({
    action: result.approved ? "task_submission_approved" : "task_submission_rejected",
    message: result.approved
      ? `${admin.username} approved "${result.taskTitle}" for ${result.participantUsername}${
          result.rewardCredited ? `: ${formatReward(result.reward)}` : " without reward yet"
        }.`
      : `${admin.username} rejected "${result.taskTitle}" for ${result.participantUsername}.`,
    userId: admin.id,
  });

  try {
    if (result.approved && result.rewardCredited) {
      await notifyParticipantTaskApproved({
        taskTitle: result.taskTitle,
        reward: result.reward,
        userId: result.participantId,
      });
    } else if (!result.approved) {
      await notifyParticipantTaskRejected({
        taskTitle: result.taskTitle,
        userId: result.participantId,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown notification error";
    await writeAuthLog({
      action: "participant_notification_failed",
      message: message.slice(0, 500),
      userId: admin.id,
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
