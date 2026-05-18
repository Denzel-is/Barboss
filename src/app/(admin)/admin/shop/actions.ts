"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeAuthLog } from "@/lib/logs";

type ShopItemFormData = {
  title: string;
  description: string;
  price: number;
  isActive: boolean;
};

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseShopItemForm(formData: FormData): ShopItemFormData | null {
  const title = getFormString(formData, "title");
  const description = getFormString(formData, "description");
  const price = Number.parseInt(getFormString(formData, "price"), 10);

  if (!title || !description || Number.isNaN(price) || price < 0) {
    return null;
  }

  return {
    title,
    description,
    price,
    isActive: formData.get("isActive") === "on",
  };
}

function shopPath(params?: string) {
  return `/admin/shop${params ? `?${params}` : ""}`;
}

export async function createShopItemAction(formData: FormData) {
  const admin = await requireRole("admin");
  const data = parseShopItemForm(formData);

  if (!data) {
    redirect(shopPath("error=invalid"));
  }

  const db = getDb();
  const existingItem = await db.shopItem.findUnique({
    where: { title: data.title },
    select: { id: true },
  });

  if (existingItem) {
    redirect(shopPath("error=duplicate"));
  }

  const item = await db.shopItem.create({ data });

  await writeAuthLog({
    action: "shop_item_created",
    message: `${admin.username} created shop item "${item.title}".`,
    userId: admin.id,
  });

  revalidatePath("/admin/shop");
  revalidatePath("/app/shop");
  redirect(shopPath("created=1"));
}

export async function updateShopItemAction(formData: FormData) {
  const admin = await requireRole("admin");
  const itemId = getFormString(formData, "itemId");
  const data = parseShopItemForm(formData);

  if (!itemId || !data) {
    redirect(shopPath("error=invalid"));
  }

  const db = getDb();
  const existingItem = await db.shopItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  });

  if (!existingItem) {
    redirect(shopPath("error=missing"));
  }

  const duplicateItem = await db.shopItem.findFirst({
    where: {
      title: data.title,
      id: { not: itemId },
    },
    select: { id: true },
  });

  if (duplicateItem) {
    redirect(shopPath("error=duplicate"));
  }

  const item = await db.shopItem.update({
    where: { id: itemId },
    data,
  });

  await writeAuthLog({
    action: "shop_item_updated",
    message: `${admin.username} updated shop item "${item.title}".`,
    userId: admin.id,
  });

  revalidatePath("/admin/shop");
  revalidatePath("/app/shop");
  redirect(shopPath("updated=1"));
}

export async function archiveShopItemAction(formData: FormData) {
  const admin = await requireRole("admin");
  const itemId = getFormString(formData, "itemId");

  if (!itemId) {
    redirect(shopPath("error=invalid"));
  }

  const db = getDb();
  const item = await db.shopItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      title: true,
      isActive: true,
    },
  });

  if (!item) {
    redirect(shopPath("error=missing"));
  }

  if (item.isActive) {
    await db.shopItem.update({
      where: { id: item.id },
      data: { isActive: false },
    });

    await writeAuthLog({
      action: "shop_item_archived",
      message: `${admin.username} archived shop item "${item.title}".`,
      userId: admin.id,
    });
  }

  revalidatePath("/admin/shop");
  revalidatePath("/app/shop");
  redirect(shopPath("archived=1"));
}
