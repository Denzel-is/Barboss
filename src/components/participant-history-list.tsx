import { formatReward } from "@/lib/format";
import type { ParticipantHistoryEntry } from "@/lib/history-types";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusStyles: Record<ParticipantHistoryEntry["statusVariant"], string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
  completed: "bg-neutral-100 text-neutral-700",
  info: "bg-sky-50 text-sky-800",
};

type ParticipantHistoryListProps = {
  entries: ParticipantHistoryEntry[];
};

export function ParticipantHistoryList({ entries }: ParticipantHistoryListProps) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">Записей по этому фильтру пока нет.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200">
      {entries.map((entry) => (
        <li className="flex items-start justify-between gap-3 py-3" key={entry.id}>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900">{entry.title}</p>
            <p className="mt-1 text-xs text-neutral-500">{dateFormatter.format(entry.date)}</p>
            <span
              className={[
                "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                statusStyles[entry.statusVariant],
              ].join(" ")}
            >
              {entry.statusLabel}
            </span>
          </div>
          <div className="shrink-0 text-right">
            {entry.amount === null ? (
              <span className="text-xs text-neutral-400">—</span>
            ) : (
              <span
                className={["text-sm font-semibold", entry.amount < 0 ? "text-red-700" : "text-emerald-700"].join(" ")}
              >
                {formatReward(entry.amount)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
