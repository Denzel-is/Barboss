import { headers } from "next/headers";

import { getDb } from "@/lib/db";

type AuthLogInput = {
  action: string;
  message?: string;
  userId?: string;
};

export async function writeAuthLog({ action, message, userId }: AuthLogInput) {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip");
  const userAgent = headerStore.get("user-agent");

  await getDb().log.create({
    data: {
      action,
      message,
      userId,
      ipAddress,
      userAgent,
    },
  });
}
