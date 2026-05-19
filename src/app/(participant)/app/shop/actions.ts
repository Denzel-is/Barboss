"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatReward } from "@/lib/format";
import { writeAuthLog } from "@/lib/logs";
import { NOTIFICATION_TYPES, TOAST_KEYS } from "@/lib/notification-types";
import { createAdminNotifications, createNotification } from "@/lib/notifications";
import { notifyAdminNewPurchase, notifyParticipantPurchase } from "@/lib/telegram";

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function buyShopItemAction(formData: FormData) {
  const user = await requireRole("participant");
  const itemId = getFormString(formData, "itemId");

  if (!itemId) {
    redirect("/app/shop?error=invalid");
  }

  const db = getDb();
  const result = await db.$transaction(async (tx) => {
    const item = await tx.shopItem.findFirst({
      where: {
        id: itemId,
        isActive: true,
      },
    });

    if (!item) {
      return { status: "missing" as const };
    }

    const balanceResult = await tx.walletTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    const balance = balanceResult._sum.amount ?? 0;

    if (balance < item.price) {
      return { status: "insufficient" as const };
    }

    const purchase = await tx.shopPurchase.create({
      data: {
        userId: user.id,
        itemId: item.id,
        price: item.price,
        status: "purchased",
      },
    });

    await tx.walletTransaction.create({
      data: {
        userId: user.id,
        amount: -item.price,
        type: "shop_purchase",
        sourceId: purchase.id,
        description: item.title,
      },
    });

    await createNotification(
      {
        userId: user.id,
        title: "Покупка оформлена",
        message: `«${item.title}»: ${formatReward(-item.price)}.`,
        type: NOTIFICATION_TYPES.shopPurchased,
      },
      tx,
    );

    await createAdminNotifications(
      {
        title: "Новая покупка",
        message: `${user.username} купил(а) «${item.title}» за ${item.price} райданчиков.`,
        type: NOTIFICATION_TYPES.shopSale,
      },
      tx,
    );

    return {
      status: "purchased" as const,
      itemTitle: item.title,
      price: item.price,
      purchasedAt: purchase.createdAt,
    };
  });

  if (result.status === "missing") {
    redirect("/app/shop?error=missing");
  }

  if (result.status === "insufficient") {
    redirect("/app/shop?error=balance");
  }

  await writeAuthLog({
    action: "shop_item_purchased",
    message: `${user.username} bought "${result.itemTitle}" for ${result.price} райданчиков.`,
    userId: user.id,
  });

  await notifyAdminNewPurchase({
    itemTitle: result.itemTitle,
    price: result.price,
    purchasedAt: result.purchasedAt,
    username: user.username,
    userId: user.id,
  });

  await notifyParticipantPurchase({
    itemTitle: result.itemTitle,
    price: result.price,
    userId: user.id,
  });

  revalidatePath("/app");
  revalidatePath("/app/shop");
  revalidatePath("/app/notifications");
  revalidatePath("/admin");
  revalidatePath("/admin/shop");
  revalidatePath("/admin/notifications");
  redirect(`/app/shop?toast=${TOAST_KEYS.shopPurchased}`);
}
