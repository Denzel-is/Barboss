import { ISSUE_STATUSES, LOG_LEVELS, type IssueStatusFilter, type LogLevelFilter } from "@/lib/log-types";

export const ADMIN_LOG_FILTER_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "fixed", label: "Fixed" },
] as const;

export type AdminLogFilterValue = (typeof ADMIN_LOG_FILTER_OPTIONS)[number]["value"];

export function parseAdminLogFilter(value: string | undefined): {
  level: LogLevelFilter;
  status: IssueStatusFilter;
  chip: AdminLogFilterValue;
} {
  if (!value || value === "all") {
    return { level: "all", status: "all", chip: "all" };
  }

  if (LOG_LEVELS.includes(value as (typeof LOG_LEVELS)[number])) {
    return { level: value as LogLevelFilter, status: "all", chip: value as AdminLogFilterValue };
  }

  if (ISSUE_STATUSES.includes(value as (typeof ISSUE_STATUSES)[number])) {
    return { level: "all", status: value as IssueStatusFilter, chip: value as AdminLogFilterValue };
  }

  return { level: "all", status: "all", chip: "all" };
}
