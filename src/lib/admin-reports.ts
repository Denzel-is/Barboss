import type {
  AdminOperationFilter,
  AdminReportPeriod,
  AdminReportRow,
  AdminReportSummary,
  AdminStatusFilter,
} from "@/lib/history-types";
import { periodToDateFrom } from "@/lib/history-types";
import { getDb } from "@/lib/db";

const RAYA_USERNAME = "rayakrutaya2006";

function walletOperationType(type: string, amount: number) {
  if (type === "easter_bonus") {
    return "easter";
  }

  if (type === "shop_purchase") {
    return "shop";
  }

  if (type === "penalty") {
    return "penalty";
  }

  if (type === "task_reward") {
    return "task";
  }

  return amount > 0 ? "credit" : "penalty";
}

function walletActionLabel(type: string) {
  switch (type) {
    case "task_reward":
      return "Начисление за задание";
    case "shop_purchase":
      return "Покупка в магазине";
    case "penalty":
      return "Штраф";
    case "easter_bonus":
      return "Пасхальный бонус";
    default:
      return type.replaceAll("_", " ");
  }
}

function submissionAction(status: string) {
  switch (status) {
    case "pending":
      return "Задание на проверке";
    case "rejected":
      return "Задание отклонено";
    default:
      return "Задание";
  }
}

function matchesOperation(row: AdminReportRow, filter: AdminOperationFilter) {
  if (filter === "all") {
    return true;
  }

  return row.operationType === filter;
}

function matchesStatus(row: AdminReportRow, filter: AdminStatusFilter) {
  if (filter === "all") {
    return true;
  }

  return row.status === filter;
}

function matchesDate(row: AdminReportRow, from: Date | null) {
  if (!from) {
    return true;
  }

  return row.date >= from;
}

export async function buildAdminReportRows(options: {
  period: AdminReportPeriod;
  operation: AdminOperationFilter;
  status: AdminStatusFilter;
}) {
  const from = periodToDateFrom(options.period);
  const db = getDb();

  const dateWhere = from ? { gte: from } : undefined;

  const [walletRows, pendingSubmissions, rejectedSubmissions] = await Promise.all([
    db.walletTransaction.findMany({
      where: dateWhere ? { createdAt: dateWhere } : undefined,
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.taskSubmission.findMany({
      where: {
        status: "pending",
        ...(dateWhere ? { createdAt: dateWhere } : {}),
      },
      include: {
        user: { select: { id: true, username: true } },
        task: { select: { title: true, reward: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.taskSubmission.findMany({
      where: {
        status: "rejected",
        ...(dateWhere ? { reviewedAt: dateWhere } : {}),
      },
      include: {
        user: { select: { id: true, username: true } },
        task: { select: { title: true, reward: true } },
      },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);

  const rows: AdminReportRow[] = [];

  for (const transaction of walletRows) {
    const operationType = walletOperationType(transaction.type, transaction.amount);

    rows.push({
      id: `wallet-${transaction.id}`,
      userId: transaction.userId,
      username: transaction.user.username,
      action: walletActionLabel(transaction.type),
      operationType,
      amount: transaction.amount,
      source: transaction.description,
      date: transaction.createdAt,
      status: "completed",
    });
  }

  for (const submission of pendingSubmissions) {
    rows.push({
      id: `submission-pending-${submission.id}`,
      userId: submission.userId,
      username: submission.user.username,
      action: submissionAction("pending"),
      operationType: "task",
      amount: null,
      source: submission.task.title,
      date: submission.createdAt,
      status: "pending",
    });
  }

  for (const submission of rejectedSubmissions) {
    rows.push({
      id: `submission-rejected-${submission.id}`,
      userId: submission.userId,
      username: submission.user.username,
      action: submissionAction("rejected"),
      operationType: submission.task.reward < 0 ? "penalty" : "task",
      amount: 0,
      source: submission.task.title,
      date: submission.reviewedAt ?? submission.createdAt,
      status: "rejected",
    });
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  return rows.filter(
    (row) => matchesOperation(row, options.operation) && matchesStatus(row, options.status) && matchesDate(row, from),
  );
}

export async function getAdminReportSummary(): Promise<AdminReportSummary> {
  const db = getDb();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const participant = await db.user.findUnique({
    where: { username: RAYA_USERNAME },
    select: { id: true, username: true },
  });

  if (!participant) {
    return {
      participantUsername: RAYA_USERNAME,
      balance: 0,
      earnedWeek: 0,
      spentWeek: 0,
      pendingTasks: 0,
      purchasesCount: 0,
    };
  }

  const [balanceResult, weekTransactions, pendingTasks, purchasesCount] = await Promise.all([
    db.walletTransaction.aggregate({
      where: { userId: participant.id },
      _sum: { amount: true },
    }),
    db.walletTransaction.findMany({
      where: {
        userId: participant.id,
        createdAt: { gte: weekAgo },
      },
      select: { amount: true },
    }),
    db.taskSubmission.count({ where: { status: "pending" } }),
    db.shopPurchase.count({ where: { status: "purchased" } }),
  ]);

  let earnedWeek = 0;
  let spentWeek = 0;

  for (const transaction of weekTransactions) {
    if (transaction.amount > 0) {
      earnedWeek += transaction.amount;
    } else {
      spentWeek += Math.abs(transaction.amount);
    }
  }

  return {
    participantUsername: participant.username,
    balance: balanceResult._sum.amount ?? 0,
    earnedWeek,
    spentWeek,
    pendingTasks,
    purchasesCount,
  };
}

export function rowsToCsv(rows: AdminReportRow[]) {
  const header = ["Пользователь", "Действие", "Сумма", "Источник", "Дата", "Статус"];
  const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;

  const lines = [
    header.map(escape).join(","),
    ...rows.map((row) =>
      [
        row.username,
        row.action,
        row.amount === null ? "" : String(row.amount),
        row.source,
        dateFormatter.format(row.date),
        row.status,
      ]
        .map(escape)
        .join(","),
    ),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}
