"use server";

import { revalidatePath } from "next/cache";

import type { IssueStatus } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth";
import { updateErrorReportStatus } from "@/lib/error-reports";
import { ISSUE_STATUSES } from "@/lib/log-types";
import { writeAuthLog } from "@/lib/logs";

function parseStatus(value: string): IssueStatus | null {
  return ISSUE_STATUSES.includes(value as IssueStatus) ? (value as IssueStatus) : null;
}

export async function updateErrorReportStatusAction(formData: FormData) {
  const admin = await requireRole("admin");
  const reportId = String(formData.get("reportId") ?? "");
  const status = parseStatus(String(formData.get("status") ?? ""));

  if (!reportId || !status) {
    return;
  }

  await updateErrorReportStatus(reportId, status);

  await writeAuthLog({
    action: "error_report_status_updated",
    message: `${admin.username} set error ${reportId} to ${status}`,
    userId: admin.id,
    entityType: "ErrorReport",
  });

  revalidatePath("/admin/errors");
  revalidatePath("/admin/logs");
}
