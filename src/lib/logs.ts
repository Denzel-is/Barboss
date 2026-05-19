import { headers } from "next/headers";

import type { IssueStatus, LogLevel, Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

export type WriteLogInput = {
  level?: LogLevel;
  action: string;
  message?: string;
  userId?: string;
  actor?: string;
  entityType?: string;
  metadata?: Prisma.InputJsonValue;
  status?: IssueStatus;
};

type AuthLogInput = {
  action: string;
  message?: string;
  userId?: string;
  entityType?: string;
  metadata?: Prisma.InputJsonValue;
};

async function resolveActor(userId?: string, actor?: string) {
  if (actor?.trim()) {
    return actor.trim();
  }

  if (!userId) {
    return "system";
  }

  try {
    const user = await getDb().user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    return user?.username ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function writeLog(input: WriteLogInput) {
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? undefined;
    const userAgent = headerStore.get("user-agent") ?? undefined;
    const actor = await resolveActor(input.userId, input.actor);

    await getDb().log.create({
      data: {
        level: input.level ?? "info",
        action: input.action,
        message: input.message,
        userId: input.userId,
        actor,
        entityType: input.entityType,
        metadata: input.metadata,
        status: input.status ?? "open",
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[writeLog] failed:", error);
  }
}

export async function writeAuthLog({ action, message, userId, entityType, metadata }: AuthLogInput) {
  await writeLog({
    level: "info",
    action,
    message,
    userId,
    entityType,
    metadata,
    status: "open",
  });
}
