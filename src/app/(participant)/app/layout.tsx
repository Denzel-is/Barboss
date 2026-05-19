import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("participant");
  const unreadCount = await getUnreadNotificationCount(user.id);

  return (
    <AppShell unreadCount={unreadCount} user={user}>
      {children}
    </AppShell>
  );
}
