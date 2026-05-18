import { SectionPanel } from "@/components/section-panel";
import { getDb } from "@/lib/db";

const logFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

export default async function AdminLogsPage() {
  const logs = await getDb().log.findMany({
    include: {
      user: {
        select: {
          username: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <SectionPanel eyebrow="Логи" title="Последние события">
      {logs.length === 0 ? (
        <p>Логов пока нет.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {logs.map((log) => (
            <li className="py-3" key={log.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-neutral-900">{log.action}</p>
                <time className="shrink-0 text-xs text-neutral-500" dateTime={log.createdAt.toISOString()}>
                  {logFormatter.format(log.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-neutral-600">{log.message ?? "Без описания"}</p>
              <p className="mt-1 text-xs text-neutral-500">{log.user?.username ?? "unknown"}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
