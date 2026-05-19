"use client";

import { ISSUE_STATUS_LABELS, ISSUE_STATUSES } from "@/lib/log-types";

type IssueStatusSelectProps = {
  action: (formData: FormData) => void | Promise<void>;
  fieldName: string;
  recordId: string;
  currentStatus: string;
};

export function IssueStatusSelect({ action, fieldName, recordId, currentStatus }: IssueStatusSelectProps) {
  return (
    <form action={action} className="inline-block">
      <input name={fieldName} type="hidden" value={recordId} />
      <select
        className="rounded-[6px] border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-800"
        defaultValue={currentStatus}
        name="status"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {ISSUE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ISSUE_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </form>
  );
}
