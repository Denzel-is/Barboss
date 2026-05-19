import { SectionPanel } from "@/components/section-panel";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
};

type NotificationsListProps = {
  notifications: NotificationItem[];
  markReadAction: (formData: FormData) => void | Promise<void>;
  markAllReadAction: () => void | Promise<void>;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

export function NotificationsList({ notifications, markReadAction, markAllReadAction }: NotificationsListProps) {
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <SectionPanel eyebrow="Уведомления" title={`Всего: ${notifications.length}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-neutral-600">Непрочитанных: {unreadCount}</p>
        {unreadCount > 0 ? (
          <form action={markAllReadAction}>
            <button
              className="rounded-[8px] border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700"
              type="submit"
            >
              Прочитать все
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p>Уведомлений пока нет.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li
              className={[
                "rounded-[8px] border p-3",
                notification.isRead ? "border-neutral-200 bg-white" : "border-emerald-200 bg-emerald-50",
              ].join(" ")}
              key={notification.id}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-950">{notification.title}</p>
                  <p className="mt-1 text-sm text-neutral-700">{notification.message}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {dateFormatter.format(notification.createdAt)} · {notification.type}
                  </p>
                </div>
                {!notification.isRead ? (
                  <form action={markReadAction}>
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <button
                      className="shrink-0 rounded-[8px] bg-emerald-700 px-2 py-1 text-xs font-semibold text-white"
                      type="submit"
                    >
                      Прочитано
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
