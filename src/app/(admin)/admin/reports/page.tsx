import { Suspense } from "react";

import { AdminReportSummaryCards } from "@/components/admin-report-summary";
import { AdminReportsTable } from "@/components/admin-reports-table";
import { AdminReportsToolbar } from "@/components/admin-reports-toolbar";
import { SectionPanel } from "@/components/section-panel";
import { requireRole } from "@/lib/auth";
import { buildAdminReportRows, getAdminReportSummary } from "@/lib/admin-reports";
import {
  parseAdminOperationFilter,
  parseAdminReportPeriod,
  parseAdminStatusFilter,
} from "@/lib/history-types";
import { writeAuthLog } from "@/lib/logs";

type AdminReportsPageProps = {
  searchParams: Promise<{
    period?: string;
    operation?: string;
    status?: string;
  }>;
};

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const admin = await requireRole("admin");
  const params = await searchParams;

  const period = parseAdminReportPeriod(params.period);
  const operation = parseAdminOperationFilter(params.operation);
  const status = parseAdminStatusFilter(params.status);

  await writeAuthLog({
    action: "admin_reports_opened",
    message: `period=${period}; operation=${operation}; status=${status}`,
    userId: admin.id,
  });

  const [summary, rows] = await Promise.all([
    getAdminReportSummary(),
    buildAdminReportRows({ period, operation, status }),
  ]);

  return (
    <div className="space-y-4">
      <SectionPanel eyebrow="Отчёты" title="Сводка">
        <AdminReportSummaryCards summary={summary} />
      </SectionPanel>

      <SectionPanel eyebrow="Фильтры" title="Параметры отчёта">
        <Suspense fallback={<p className="text-sm text-neutral-500">Загрузка фильтров…</p>}>
          <AdminReportsToolbar />
        </Suspense>
      </SectionPanel>

      <SectionPanel eyebrow="Данные" title={`Записей: ${rows.length}`}>
        <AdminReportsTable rows={rows} />
      </SectionPanel>
    </div>
  );
}
