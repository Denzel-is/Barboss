import type { Log, User } from "@/generated/prisma/client";
import { updateLogStatusAction } from "@/app/(admin)/admin/logs/actions";
import { EmptyState } from "@/components/empty-state";
import { IssueStatusSelect } from "@/components/issue-status-select";
import { formatMetadata } from "@/lib/admin-logs";
import { ISSUE_STATUS_LABELS, LOG_LEVEL_LABELS } from "@/lib/log-types";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type LogWithUser = Log & {
  user: Pick<User, "username" | "role"> | null;
};

const levelStyles: Record<string, string> = {
  info: "bg-sky-50 text-sky-800",
  warning: "bg-amber-50 text-amber-800",
  error: "bg-red-50 text-red-800",
};

type AdminLogsTableProps = {
  logs: LogWithUser[];
};

export function AdminLogsTable({ logs }: AdminLogsTableProps) {
  if (logs.length === 0) {
    return <EmptyState title="Нет логов" description="По выбранному фильтру событий не найдено." />;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="min-w-[880px] w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="px-2 py-2 font-medium">Level</th>
            <th className="px-2 py-2 font-medium">Actor</th>
            <th className="px-2 py-2 font-medium">Action</th>
            <th className="px-2 py-2 font-medium">Entity</th>
            <th className="px-2 py-2 font-medium">Message</th>
            <th className="px-2 py-2 font-medium">Metadata</th>
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 font-medium">Дата</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr className="border-b border-neutral-100 align-top" key={log.id}>
              <td className="px-2 py-2">
                <span
                  className={[
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    levelStyles[log.level] ?? "bg-neutral-100",
                  ].join(" ")}
                >
                  {LOG_LEVEL_LABELS[log.level]}
                </span>
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-neutral-800">
                @{log.actor ?? log.user?.username ?? "system"}
              </td>
              <td className="px-2 py-2 font-medium text-neutral-900">{log.action}</td>
              <td className="px-2 py-2 text-neutral-600">{log.entityType ?? "—"}</td>
              <td className="max-w-[14rem] px-2 py-2 text-neutral-700">{log.message ?? "—"}</td>
              <td className="max-w-[10rem] truncate px-2 py-2 font-mono text-[10px] text-neutral-500" title={formatMetadata(log.metadata)}>
                {formatMetadata(log.metadata)}
              </td>
              <td className="px-2 py-2">
                <IssueStatusSelect
                  action={updateLogStatusAction}
                  currentStatus={log.status}
                  fieldName="logId"
                  recordId={log.id}
                />
                <p className="mt-0.5 text-[9px] text-neutral-400">{ISSUE_STATUS_LABELS[log.status]}</p>
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-neutral-600">{dateFormatter.format(log.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
