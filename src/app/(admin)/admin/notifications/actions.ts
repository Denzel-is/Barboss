"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireRole("admin");
  const notificationId = String(formData.get("notificationId") ?? "").trim();

  if (!notificationId) {
    return;
  }

  await getDb().notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
    data: { isRead: true },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireRole("admin");

  await getDb().notification.updateMany({
    where: {
      userId: user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}
