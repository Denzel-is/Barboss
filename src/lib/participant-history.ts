import type { SubmissionStatus } from "@/generated/prisma/client";
import type { ParticipantHistoryEntry, ParticipantHistoryFilter } from "@/lib/history-types";
import { getDb } from "@/lib/db";

function submissionStatus(status: SubmissionStatus) {
  switch (status) {
    case "pending":
      return { label: "На проверке", variant: "pending" as const };
    case "approved":
      return { label: "Принято", variant: "approved" as const };
    case "rejected":
      return { label: "Отклонено", variant: "rejected" as const };
  }
}

function walletTypeLabel(type: string) {
  switch (type) {
    case "easter_bonus":
      return "Пасхальный бонус";
    case "penalty":
      return "Штраф";
    case "task_reward":
      return "Награда за задание";
    case "shop_purchase":
      return "Покупка";
    default:
      return type.replaceAll("_", " ");
  }
}

function groupsForSubmission(reward: number, status: SubmissionStatus): ParticipantHistoryFilter[] {
  const groups: ParticipantHistoryFilter[] = ["all", "tasks"];

  if (status === "approved") {
    if (reward > 0) {
      groups.push("credits");
    }

    if (reward < 0) {
      groups.push("penalties");
    }
  }

  if (status === "rejected" && reward < 0) {
    groups.push("penalties");
  }

  return groups;
}

function groupsForWallet(type: string, amount: number): ParticipantHistoryFilter[] {
  const groups: ParticipantHistoryFilter[] = ["all"];

  if (type === "easter_bonus" || (amount > 0 && type !== "shop_purchase")) {
    groups.push("credits");
  }

  if (type === "penalty" || amount < 0) {
    groups.push("penalties");
  }

  return groups;
}

export async function getParticipantHistory(userId: string, filter: ParticipantHistoryFilter) {
  const db = getDb();

  const [submissions, purchases, walletExtras] = await Promise.all([
    db.taskSubmission.findMany({
      where: { userId },
      include: {
        task: {
          select: {
            title: true,
            reward: true,
            isPenalty: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.shopPurchase.findMany({
      where: { userId, status: "purchased" },
      include: {
        item: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.walletTransaction.findMany({
      where: {
        userId,
        type: {
          notIn: ["task_reward", "shop_purchase"],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const entries: ParticipantHistoryEntry[] = [];

  for (const submission of submissions) {
    const status = submissionStatus(submission.status);

    entries.push({
      id: `submission-${submission.id}`,
      date: submission.reviewedAt ?? submission.createdAt,
      title: submission.task.title,
      statusLabel: status.label,
      statusVariant: status.variant,
      amount: submission.status === "approved" ? submission.task.reward : null,
      groups: groupsForSubmission(submission.task.reward, submission.status),
    });
  }

  for (const purchase of purchases) {
    entries.push({
      id: `purchase-${purchase.id}`,
      date: purchase.createdAt,
      title: purchase.item.title,
      statusLabel: "Куплено",
      statusVariant: "completed",
      amount: -purchase.price,
      groups: ["all", "shop"],
    });
  }

  for (const transaction of walletExtras) {
    const isEaster = transaction.type === "easter_bonus";
    const groups = groupsForWallet(transaction.type, transaction.amount);

    if (isEaster && !groups.includes("credits")) {
      groups.push("credits");
    }

    entries.push({
      id: `wallet-${transaction.id}`,
      date: transaction.createdAt,
      title: isEaster ? transaction.description || "Пасхальный бонус" : transaction.description,
      statusLabel: walletTypeLabel(transaction.type),
      statusVariant: transaction.amount >= 0 ? "approved" : "rejected",
      amount: transaction.amount,
      groups,
    });
  }

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (filter === "all") {
    return entries;
  }

  return entries.filter((entry) => entry.groups.includes(filter));
}
