import type { IssueStatus } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { writeLog } from "@/lib/logs";

export type CreateErrorReportInput = {
  pageUrl: string;
  errorMessage: string;
  stack?: string | null;
  action?: string | null;
  userId?: string | null;
  source?: string;
};

export async function createErrorReport(input: CreateErrorReportInput) {
  const pageUrl = input.pageUrl.slice(0, 2000);
  const errorMessage = input.errorMessage.slice(0, 4000);
  const stack = input.stack?.slice(0, 12000) ?? null;
  const action = input.action?.slice(0, 200) ?? input.source?.slice(0, 200) ?? null;

  let reportId: string | null = null;

  try {
    const report = await getDb().errorReport.create({
      data: {
        pageUrl,
        errorMessage,
        stack,
        action,
        userId: input.userId ?? undefined,
      },
    });

    reportId = report.id;
  } catch (error) {
    console.error("[createErrorReport] failed:", error);
  }

  await writeLog({
    level: "error",
    action: "error_report",
    message: errorMessage,
    userId: input.userId ?? undefined,
    entityType: "ErrorReport",
    metadata: {
      reportId,
      pageUrl,
      action,
      source: input.source,
    },
    status: "open",
  });

  return reportId;
}

export async function listErrorReports(options?: {
  status?: IssueStatus;
  limit?: number;
}) {
  return getDb().errorReport.findMany({
    where: options?.status ? { status: options.status } : undefined,
    include: {
      user: {
        select: {
          username: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
}

export async function updateErrorReportStatus(reportId: string, status: IssueStatus) {
  return getDb().errorReport.update({
    where: { id: reportId },
    data: { status },
  });
}
