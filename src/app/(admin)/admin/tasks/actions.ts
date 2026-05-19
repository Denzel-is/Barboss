"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeAuthLog } from "@/lib/logs";

type TaskFormData = {
  title: string;
  description: string;
  category: string;
  reward: number;
  proofType: string;
  isDaily: boolean;
  isPenalty: boolean;
  isActive: boolean;
};

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getFormBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getReturnFilter(formData: FormData) {
  const filter = getFormString(formData, "returnFilter");
  return filter === "archived" || filter === "all" ? filter : "active";
}

function parseTaskForm(formData: FormData): TaskFormData | null {
  const title = getFormString(formData, "title");
  const description = getFormString(formData, "description");
  const category = getFormString(formData, "category");
  const proofType = getFormString(formData, "proofType") || "video";
  const reward = Number.parseInt(getFormString(formData, "reward"), 10);

  if (!title || !description || !category || Number.isNaN(reward)) {
    return null;
  }

  return {
    title,
    description,
    category,
    reward,
    proofType,
    isDaily: getFormBoolean(formData, "isDaily"),
    isPenalty: getFormBoolean(formData, "isPenalty"),
    isActive: getFormBoolean(formData, "isActive"),
  };
}

function tasksPath(filter: string, params?: string) {
  return `/admin/tasks?filter=${filter}${params ? `&${params}` : ""}`;
}

export async function createTaskAction(formData: FormData) {
  const admin = await requireRole("admin");
  const filter = getReturnFilter(formData);
  const data = parseTaskForm(formData);

  if (!data) {
    redirect(tasksPath(filter, "error=invalid"));
  }

  const db = getDb();
  const existingTask = await db.task.findUnique({
    where: { title: data.title },
    select: { id: true },
  });

  if (existingTask) {
    redirect(tasksPath(filter, "error=duplicate"));
  }

  const task = await db.task.create({ data });

  await writeAuthLog({
    action: "task_created",
    message: `${admin.username} created task "${task.title}".`,
    userId: admin.id,
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/app/tasks");
  redirect(tasksPath(filter, "created=1"));
}

export async function updateTaskAction(formData: FormData) {
  const admin = await requireRole("admin");
  const filter = getReturnFilter(formData);
  const taskId = getFormString(formData, "taskId");
  const data = parseTaskForm(formData);

  if (!taskId || !data) {
    redirect(tasksPath(filter, "error=invalid"));
  }

  const db = getDb();
  const existingTask = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true },
  });

  if (!existingTask) {
    redirect(tasksPath(filter, "error=missing"));
  }

  const duplicateTask = await db.task.findFirst({
    where: {
      title: data.title,
      id: { not: taskId },
    },
    select: { id: true },
  });

  if (duplicateTask) {
    redirect(tasksPath(filter, "error=duplicate"));
  }

  const task = await db.task.update({
    where: { id: taskId },
    data,
  });

  await writeAuthLog({
    action: "task_updated",
    message: `${admin.username} updated task "${task.title}".`,
    userId: admin.id,
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/app/tasks");
  redirect(tasksPath(filter, "updated=1"));
}

export async function archiveTaskAction(formData: FormData) {
  const admin = await requireRole("admin");
  const filter = getReturnFilter(formData);
  const taskId = getFormString(formData, "taskId");

  if (!taskId) {
    redirect(tasksPath(filter, "error=invalid"));
  }

  const db = getDb();
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      isActive: true,
    },
  });

  if (!task) {
    redirect(tasksPath(filter, "error=missing"));
  }

  if (task.isActive) {
    await db.task.update({
      where: { id: task.id },
      data: { isActive: false },
    });

    await writeAuthLog({
      action: "task_archived",
      message: `${admin.username} archived task "${task.title}".`,
      userId: admin.id,
    });
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/app/tasks");
  redirect(tasksPath("archived", "archived=1"));
}
