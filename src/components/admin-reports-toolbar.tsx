"use client";

import { Download } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { HistoryFilterChips } from "@/components/history-filter-chips";
import {
  ADMIN_OPERATION_FILTERS,
  ADMIN_REPORT_PERIODS,
  ADMIN_STATUS_FILTERS,
} from "@/lib/history-types";

const periodOptions = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
  { value: "all", label: "Всё время" },
];

const operationOptions = [
  { value: "all", label: "Все типы" },
  { value: "task", label: "Задания" },
  { value: "shop", label: "Магазин" },
  { value: "credit", label: "Начисления" },
  { value: "penalty", label: "Штрафы" },
  { value: "easter", label: "Пасхалки" },
];

const statusOptions = [
  { value: "all", label: "Все статусы" },
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Принято" },
  { value: "rejected", label: "Отклонено" },
  { value: "completed", label: "Завершено" },
];

export function AdminReportsToolbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const exportHref = `/api/admin/reports/export?${searchParams.toString()}`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-neutral-500">Период</p>
        <a
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-neutral-300 px-3 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
          href={exportHref}
        >
          <Download className="h-4 w-4" />
          CSV
        </a>
      </div>

      <HistoryFilterChips options={periodOptions} paramName="period" />

      <p className="text-xs font-medium text-neutral-500">Тип операции</p>
      <HistoryFilterChips options={operationOptions} paramName="operation" />

      <p className="text-xs font-medium text-neutral-500">Статус</p>
      <HistoryFilterChips options={statusOptions} paramName="status" />

      <p className="sr-only">
        Filters: {ADMIN_REPORT_PERIODS.join(", ")}, {ADMIN_OPERATION_FILTERS.join(", ")},{" "}
        {ADMIN_STATUS_FILTERS.join(", ")} · {pathname}
      </p>
    </section>
  );
}
