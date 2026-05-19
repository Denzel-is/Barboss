import type { ErrorReport, User } from "@/generated/prisma/client";
import { updateErrorReportStatusAction } from "@/app/(admin)/admin/errors/actions";
import { IssueStatusSelect } from "@/components/issue-status-select";
import { ISSUE_STATUS_LABELS } from "@/lib/log-types";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type ErrorReportWithUser = ErrorReport & {
  user: Pick<User, "username" | "role"> | null;
};

type AdminErrorReportsTableProps = {
  reports: ErrorReportWithUser[];
};

export function AdminErrorReportsTable({ reports }: AdminErrorReportsTableProps) {
  if (reports.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">Отчётов об ошибках пока нет.</p>;
  }

  return (
    <div className="-mx-4 space-y-3 px-4">
      {reports.map((report) => (
        <article className="rounded-[8px] border border-neutral-200 bg-white p-3 text-xs" key={report.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-neutral-900">{report.errorMessage}</p>
              <p className="mt-1 text-neutral-500">
                @{report.user?.username ?? "guest"} · {dateFormatter.format(report.createdAt)}
              </p>
            </div>
            <IssueStatusSelect
              action={updateErrorReportStatusAction}
              currentStatus={report.status}
              fieldName="reportId"
              recordId={report.id}
            />
          </div>
          <dl className="mt-2 space-y-1 text-neutral-700">
            <div>
              <dt className="inline font-medium">URL: </dt>
              <dd className="inline break-all">{report.pageUrl}</dd>
            </div>
            {report.action ? (
              <div>
                <dt className="inline font-medium">Action: </dt>
                <dd className="inline">{report.action}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline font-medium">Status: </dt>
              <dd className="inline">{ISSUE_STATUS_LABELS[report.status]}</dd>
            </div>
          </dl>
          {report.stack ? (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium text-neutral-600">Stack trace</summary>
              <pre className="mt-1 max-h-40 overflow-auto rounded-[6px] bg-neutral-50 p-2 font-mono text-[10px] text-neutral-700">
                {report.stack}
              </pre>
            </details>
          ) : null}
        </article>
      ))}
    </div>
  );
}
