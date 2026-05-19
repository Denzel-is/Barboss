import type { IssueStatus, LogLevel } from "@/generated/prisma/client";
import type { IssueStatusFilter, LogLevelFilter } from "@/lib/log-types";
import { getDb } from "@/lib/db";

export async function listAdminLogs(options: {
  level: LogLevelFilter;
  status: IssueStatusFilter;
  limit?: number;
}) {
  const where: {
    level?: LogLevel;
    status?: IssueStatus;
  } = {};

  if (options.level !== "all") {
    where.level = options.level;
  }

  if (options.status !== "all") {
    where.status = options.status;
  }

  return getDb().log.findMany({
    where,
    include: {
      user: {
        select: {
          username: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 150,
  });
}

export async function updateLogStatus(logId: string, status: IssueStatus) {
  return getDb().log.update({
    where: { id: logId },
    data: { status },
  });
}

export function formatMetadata(metadata: unknown) {
  if (metadata === null || metadata === undefined) {
    return "—";
  }

  try {
    const text = JSON.stringify(metadata);
    return text.length > 120 ? `${text.slice(0, 117)}…` : text;
  } catch {
    return "—";
  }
}
