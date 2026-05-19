import { formatReward } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import type { AdminReportRow } from "@/lib/history-types";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const statusLabels: Record<string, string> = {
  pending: "На проверке",
  approved: "Принято",
  rejected: "Отклонено",
  completed: "Завершено",
};

type AdminReportsTableProps = {
  rows: AdminReportRow[];
};

export function AdminReportsTable({ rows }: AdminReportsTableProps) {
  if (rows.length === 0) {
    return <EmptyState title="Нет отчетов" description="По выбранным фильтрам данных пока нет." />;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="min-w-[720px] w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="px-2 py-2 font-medium">Пользователь</th>
            <th className="px-2 py-2 font-medium">Действие</th>
            <th className="px-2 py-2 font-medium">Сумма</th>
            <th className="px-2 py-2 font-medium">Источник</th>
            <th className="px-2 py-2 font-medium">Дата</th>
            <th className="px-2 py-2 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-neutral-100 align-top" key={row.id}>
              <td className="px-2 py-2 font-medium text-neutral-900">@{row.username}</td>
              <td className="px-2 py-2 text-neutral-800">{row.action}</td>
              <td className="px-2 py-2 whitespace-nowrap">
                {row.amount === null ? (
                  <span className="text-neutral-400">—</span>
                ) : (
                  <span className={row.amount < 0 ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                    {formatReward(row.amount)}
                  </span>
                )}
              </td>
              <td className="max-w-[10rem] truncate px-2 py-2 text-neutral-700" title={row.source}>
                {row.source}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-neutral-600">{dateFormatter.format(row.date)}</td>
              <td className="px-2 py-2 whitespace-nowrap text-neutral-600">
                {statusLabels[row.status] ?? row.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
