import { NotificationsList } from "@/components/notifications-list";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(admin)/admin/notifications/actions";

export default async function AdminNotificationsPage() {
  const user = await requireRole("admin");

  const notifications = await getDb().notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <NotificationsList
      markAllReadAction={markAllNotificationsReadAction}
      markReadAction={markNotificationReadAction}
      notifications={notifications}
    />
  );
}
