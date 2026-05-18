"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";

import { homePathForRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeAuthLog } from "@/lib/logs";
import { setSession } from "@/lib/session";

function normalizeFormValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(formData: FormData) {
  const username = normalizeFormValue(formData.get("username"));
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!username || !password) {
    await writeAuthLog({
      action: "login_failed",
      message: `Empty login attempt for "${username || "unknown"}".`,
    });
    redirect("/login?error=missing");
  }

  const db = getDb();
  const user = await db.user.findUnique({
    where: { username },
  });

  if (!user) {
    await writeAuthLog({
      action: "login_failed",
      message: `Unknown username "${username}".`,
    });
    redirect("/login?error=invalid");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    await writeAuthLog({
      action: "login_failed",
      message: `Wrong password for "${username}".`,
      userId: user.id,
    });
    redirect("/login?error=invalid");
  }

  await setSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  await writeAuthLog({
    action: "login_success",
    message: `${user.username} signed in as ${user.role}.`,
    userId: user.id,
  });

  redirect(homePathForRole(user.role));
}
