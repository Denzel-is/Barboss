import Link from "next/link";
import { Bell } from "lucide-react";

import type { Role } from "@/generated/prisma/client";
import { notificationsPathForRole } from "@/lib/notifications";

type NotificationBellProps = {
  role: Role;
  unreadCount: number;
};

export function NotificationBell({ role, unreadCount }: NotificationBellProps) {
  const href = notificationsPathForRole(role);

  return (
    <Link
      aria-label={`Уведомления${unreadCount > 0 ? `, непрочитанных: ${unreadCount}` : ""}`}
      className="relative flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-[0_8px_22px_rgba(23,53,42,0.06)] transition hover:text-emerald-800"
      href={href}
    >
      <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
      {unreadCount > 0 ? (
        <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
