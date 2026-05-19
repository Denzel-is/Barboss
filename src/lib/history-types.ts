export const PARTICIPANT_HISTORY_FILTERS = ["all", "tasks", "shop", "credits", "penalties"] as const;

export type ParticipantHistoryFilter = (typeof PARTICIPANT_HISTORY_FILTERS)[number];

export const ADMIN_REPORT_PERIODS = ["7d", "30d", "90d", "all"] as const;

export type AdminReportPeriod = (typeof ADMIN_REPORT_PERIODS)[number];

export const ADMIN_OPERATION_FILTERS = [
  "all",
  "task",
  "shop",
  "credit",
  "penalty",
  "easter",
] as const;

export type AdminOperationFilter = (typeof ADMIN_OPERATION_FILTERS)[number];

export const ADMIN_STATUS_FILTERS = ["all", "pending", "approved", "rejected", "completed"] as const;

export type AdminStatusFilter = (typeof ADMIN_STATUS_FILTERS)[number];

export type ParticipantHistoryEntry = {
  id: string;
  date: Date;
  title: string;
  statusLabel: string;
  statusVariant: "pending" | "approved" | "rejected" | "completed" | "info";
  amount: number | null;
  groups: ParticipantHistoryFilter[];
};

export type AdminReportRow = {
  id: string;
  userId: string;
  username: string;
  action: string;
  operationType: string;
  amount: number | null;
  source: string;
  date: Date;
  status: string;
};

export type AdminReportSummary = {
  participantUsername: string;
  balance: number;
  earnedWeek: number;
  spentWeek: number;
  pendingTasks: number;
  purchasesCount: number;
};

export function parseParticipantHistoryFilter(value: string | undefined): ParticipantHistoryFilter {
  if (value && PARTICIPANT_HISTORY_FILTERS.includes(value as ParticipantHistoryFilter)) {
    return value as ParticipantHistoryFilter;
  }

  return "all";
}

export function parseAdminReportPeriod(value: string | undefined): AdminReportPeriod {
  if (value && ADMIN_REPORT_PERIODS.includes(value as AdminReportPeriod)) {
    return value as AdminReportPeriod;
  }

  return "30d";
}

export function parseAdminOperationFilter(value: string | undefined): AdminOperationFilter {
  if (value && ADMIN_OPERATION_FILTERS.includes(value as AdminOperationFilter)) {
    return value as AdminOperationFilter;
  }

  return "all";
}

export function parseAdminStatusFilter(value: string | undefined): AdminStatusFilter {
  if (value && ADMIN_STATUS_FILTERS.includes(value as AdminStatusFilter)) {
    return value as AdminStatusFilter;
  }

  return "all";
}

export function periodToDateFrom(period: AdminReportPeriod): Date | null {
  if (period === "all") {
    return null;
  }

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days + 1);
  return from;
}
