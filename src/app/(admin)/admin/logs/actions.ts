"use server";

import { revalidatePath } from "next/cache";

import type { IssueStatus } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth";
import { updateLogStatus } from "@/lib/admin-logs";
import { ISSUE_STATUSES } from "@/lib/log-types";
import { writeAuthLog } from "@/lib/logs";

function parseStatus(value: string): IssueStatus | null {
  return ISSUE_STATUSES.includes(value as IssueStatus) ? (value as IssueStatus) : null;
}

export async function updateLogStatusAction(formData: FormData) {
  const admin = await requireRole("admin");
  const logId = String(formData.get("logId") ?? "");
  const status = parseStatus(String(formData.get("status") ?? ""));

  if (!logId || !status) {
    return;
  }

  await updateLogStatus(logId, status);

  await writeAuthLog({
    action: "log_status_updated",
    message: `${admin.username} set log ${logId} to ${status}`,
    userId: admin.id,
    entityType: "Log",
  });

  revalidatePath("/admin/logs");
}
