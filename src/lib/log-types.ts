import type { IssueStatus, LogLevel } from "@/generated/prisma/client";

export const LOG_LEVELS = ["info", "warning", "error"] as const;
export const ISSUE_STATUSES = ["open", "in_progress", "fixed"] as const;

export type LogLevelFilter = (typeof LOG_LEVELS)[number] | "all";
export type IssueStatusFilter = (typeof ISSUE_STATUSES)[number] | "all";

export const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  info: "Info",
  warning: "Warning",
  error: "Error",
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  fixed: "Fixed",
};

export function parseLogLevelFilter(value: string | undefined): LogLevelFilter {
  if (value && LOG_LEVELS.includes(value as LogLevel)) {
    return value as LogLevel;
  }

  return "all";
}

export function parseIssueStatusFilter(value: string | undefined): IssueStatusFilter {
  if (value && ISSUE_STATUSES.includes(value as IssueStatus)) {
    return value as IssueStatus;
  }

  return "all";
}
