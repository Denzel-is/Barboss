import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import type { NotificationType } from "@/lib/notification-types";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType | string;
};

type DbClient = Prisma.TransactionClient | ReturnType<typeof getDb>;

function getClient(tx?: Prisma.TransactionClient) {
  return tx ?? getDb();
}

export async function createNotification(input: CreateNotificationInput, tx?: Prisma.TransactionClient) {
  return getClient(tx).notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: false,
    },
  });
}

export async function createAdminNotifications(
  input: Omit<CreateNotificationInput, "userId">,
  tx?: Prisma.TransactionClient,
) {
  const client = getClient(tx);
  const admins = await client.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });

  if (admins.length === 0) {
    return;
  }

  await client.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: false,
    })),
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return getDb().notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export function notificationsPathForRole(role: "admin" | "participant") {
  return role === "admin" ? "/admin/notifications" : "/app/notifications";
}
