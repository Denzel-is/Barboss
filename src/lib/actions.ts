"use server";

import { redirect } from "next/navigation";

import { clearSession, getSession } from "@/lib/session";
import { writeAuthLog } from "@/lib/logs";

export async function logoutAction() {
  const session = await getSession();

  if (session) {
    await writeAuthLog({
      action: "logout",
      message: `${session.username} signed out.`,
      userId: session.userId,
    });
  }

  await clearSession();
  redirect("/login?loggedOut=1");
}
