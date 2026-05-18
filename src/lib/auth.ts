import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export type CurrentUser = {
  id: string;
  username: string;
  role: Role;
};

export function homePathForRole(role: Role) {
  return role === "admin" ? "/admin" : "/app";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await getDb().user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  return user;
}

export async function requireRole(role: Role) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== role) {
    redirect(homePathForRole(user.role));
  }

  return user;
}
