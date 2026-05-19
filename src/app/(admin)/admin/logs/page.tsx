import { Suspense } from "react";

import { AdminLogsNav } from "@/components/admin-logs-nav";
import { AdminLogsTable } from "@/components/admin-logs-table";
import { HistoryFilterChips } from "@/components/history-filter-chips";
import { SectionPanel } from "@/components/section-panel";
import { listAdminLogs } from "@/lib/admin-logs";
import { ADMIN_LOG_FILTER_OPTIONS, parseAdminLogFilter } from "@/lib/log-filters";

type AdminLogsPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function AdminLogsPage({ searchParams }: AdminLogsPageProps) {
  const params = await searchParams;
  const parsed = parseAdminLogFilter(params.filter);
  const logs = await listAdminLogs({ level: parsed.level, status: parsed.status });

  return (
    <div className="space-y-4">
      <SectionPanel eyebrow="Мониторинг" title="Логи системы">
        <AdminLogsNav />
        <p className="mt-3 text-sm text-neutral-500">
          События приложения: level, actor, action, entity, metadata и статус обработки.
        </p>
      </SectionPanel>

      <Suspense fallback={<p className="text-sm text-neutral-500">Загрузка фильтров…</p>}>
        <HistoryFilterChips options={[...ADMIN_LOG_FILTER_OPTIONS]} paramName="filter" />
      </Suspense>

      <SectionPanel eyebrow="Записи" title={`Показано: ${logs.length}`}>
        <AdminLogsTable logs={logs} />
      </SectionPanel>
    </div>
  );
}
