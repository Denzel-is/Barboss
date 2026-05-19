import { Suspense } from "react";

import { AdminErrorReportsTable } from "@/components/admin-error-reports-table";
import { AdminLogsNav } from "@/components/admin-logs-nav";
import { HistoryFilterChips } from "@/components/history-filter-chips";
import { SectionPanel } from "@/components/section-panel";
import { listErrorReports } from "@/lib/error-reports";
import type { IssueStatus } from "@/generated/prisma/client";
import { ISSUE_STATUSES } from "@/lib/log-types";

const statusFilterOptions = [
  { value: "all", label: "Все" },
  ...ISSUE_STATUSES.map((status) => ({
    value: status,
    label: status === "in_progress" ? "In progress" : status.charAt(0).toUpperCase() + status.slice(1),
  })),
];

type AdminErrorsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function AdminErrorsPage({ searchParams }: AdminErrorsPageProps) {
  const params = await searchParams;
  const status =
    params.status && ISSUE_STATUSES.includes(params.status as IssueStatus)
      ? (params.status as IssueStatus)
      : undefined;

  const reports = await listErrorReports({ status, limit: 100 });

  return (
    <div className="space-y-4">
      <SectionPanel eyebrow="Мониторинг" title="Отчёты об ошибках">
        <AdminLogsNav />
        <p className="mt-3 text-sm text-neutral-500">
          Ошибки с сайта: URL, действие, сообщение и stack (только для админа).
        </p>
      </SectionPanel>

      <Suspense fallback={<p className="text-sm text-neutral-500">Загрузка фильтров…</p>}>
        <HistoryFilterChips options={statusFilterOptions} paramName="status" />
      </Suspense>

      <SectionPanel eyebrow="Error reports" title={`Показано: ${reports.length}`}>
        <AdminErrorReportsTable reports={reports} />
      </SectionPanel>
    </div>
  );
}
