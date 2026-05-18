import Link from "next/link";

import { ArchiveTaskButton } from "@/components/archive-task-button";
import { SectionPanel } from "@/components/section-panel";
import { archiveTaskAction, createTaskAction, updateTaskAction } from "@/app/(admin)/admin/tasks/actions";
import { getDb } from "@/lib/db";
import { formatReward } from "@/lib/format";

type AdminTasksPageProps = {
  searchParams: Promise<{
    filter?: string;
    created?: string;
    updated?: string;
    archived?: string;
    error?: string;
  }>;
};

type TaskFilter = "active" | "archived" | "all";

const filters: Array<{ value: TaskFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const errorMessages: Record<string, string> = {
  duplicate: "Задание с таким названием уже есть.",
  invalid: "Проверь поля формы.",
  missing: "Задание не найдено.",
};

function normalizeFilter(value?: string): TaskFilter {
  if (value === "archived" || value === "all") {
    return value;
  }

  return "active";
}

function getTaskWhere(filter: TaskFilter) {
  if (filter === "active") {
    return { isActive: true };
  }

  if (filter === "archived") {
    return { isActive: false };
  }

  return {};
}

function checkboxClasses() {
  return "h-4 w-4 rounded border-neutral-300 text-emerald-700";
}

type TaskFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  buttonLabel: string;
  filter: TaskFilter;
  mode: "create" | "edit";
  task?: {
    id: string;
    title: string;
    description: string;
    category: string;
    reward: number;
    proofType: string;
    isDaily: boolean;
    isPenalty: boolean;
    isActive: boolean;
  };
};

function TaskForm({ action, buttonLabel, filter, mode, task }: TaskFormProps) {
  return (
    <form action={action} className="space-y-3">
      {task ? <input name="taskId" type="hidden" value={task.id} /> : null}
      <input name="returnFilter" type="hidden" value={filter} />

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Title</span>
        <input
          className="mt-2 h-11 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={task?.title}
          name="title"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Description</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-[8px] border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={task?.description}
          name="description"
          required
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Category</span>
          <input
            className="mt-2 h-11 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={task?.category}
            name="category"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Reward</span>
          <input
            className="mt-2 h-11 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            defaultValue={task?.reward ?? 1}
            inputMode="numeric"
            name="reward"
            required
            type="number"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Proof type</span>
        <select
          className="mt-2 h-11 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={task?.proofType ?? "text"}
          name="proofType"
        >
          <option value="text">text</option>
          <option value="video">video</option>
          <option value="photo">photo</option>
          <option value="file">file</option>
        </select>
      </label>

      <div className="grid grid-cols-1 gap-2 text-sm text-neutral-700">
        <label className="flex items-center gap-2 rounded-[8px] border border-neutral-200 px-3 py-2">
          <input className={checkboxClasses()} defaultChecked={task?.isDaily ?? false} name="isDaily" type="checkbox" />
          Daily task
        </label>
        <label className="flex items-center gap-2 rounded-[8px] border border-neutral-200 px-3 py-2">
          <input className={checkboxClasses()} defaultChecked={task?.isPenalty ?? false} name="isPenalty" type="checkbox" />
          Penalty task
        </label>
        <label className="flex items-center gap-2 rounded-[8px] border border-neutral-200 px-3 py-2">
          <input className={checkboxClasses()} defaultChecked={task?.isActive ?? true} name="isActive" type="checkbox" />
          Active
        </label>
      </div>

      <button
        className={[
          "h-11 w-full rounded-[8px] px-4 text-sm font-semibold text-white transition",
          mode === "create" ? "bg-neutral-950 hover:bg-neutral-800" : "bg-emerald-700 hover:bg-emerald-800",
        ].join(" ")}
        type="submit"
      >
        {buttonLabel}
      </button>
    </form>
  );
}

export default async function AdminTasksPage({ searchParams }: AdminTasksPageProps) {
  const params = await searchParams;
  const filter = normalizeFilter(params.filter);
  const tasks = await getDb().task.findMany({
    where: getTaskWhere(filter),
    include: {
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-4">
      {params.created || params.updated || params.archived ? (
        <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Изменения сохранены.
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessages[params.error] ?? "Не удалось сохранить задание."}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        {filters.map((item) => (
          <Link
            className={[
              "rounded-[8px] border px-3 py-2 text-center text-sm font-semibold transition",
              filter === item.value
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
            ].join(" ")}
            href={`/admin/tasks?filter=${item.value}`}
            key={item.value}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <details className="rounded-[8px] border border-neutral-200 bg-white p-4">
        <summary className="cursor-pointer list-none rounded-[8px] bg-neutral-950 px-3 py-3 text-center text-sm font-semibold text-white">
          Создать задание
        </summary>
        <div className="mt-4">
          <TaskForm action={createTaskAction} buttonLabel="Создать" filter={filter} mode="create" />
        </div>
      </details>

      <SectionPanel eyebrow="Задания" title={`Список заданий: ${tasks.length}`}>
        {tasks.length === 0 ? (
          <p>Заданий в этом фильтре нет.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <article className="rounded-[8px] border border-neutral-200 p-3" key={task.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-500">{task.category}</p>
                    <h3 className="mt-1 text-base font-semibold text-neutral-950">{task.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{task.description}</p>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-[8px] px-2 py-1 text-xs font-semibold",
                      task.reward < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800",
                    ].join(" ")}
                  >
                    {formatReward(task.reward)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                  <span className={task.isActive ? "rounded-[8px] bg-emerald-50 px-2 py-1 text-emerald-800" : "rounded-[8px] bg-neutral-100 px-2 py-1"}>
                    {task.isActive ? "active" : "archived"}
                  </span>
                  {task.isDaily ? <span className="rounded-[8px] bg-neutral-100 px-2 py-1">daily</span> : null}
                  {task.isPenalty ? <span className="rounded-[8px] bg-red-50 px-2 py-1 text-red-700">penalty</span> : null}
                  <span className="rounded-[8px] bg-neutral-100 px-2 py-1">proof: {task.proofType}</span>
                  <span className="rounded-[8px] bg-neutral-100 px-2 py-1">submissions: {task._count.submissions}</span>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer list-none rounded-[8px] border border-neutral-300 px-3 py-2 text-center text-sm font-semibold text-neutral-800">
                    Редактировать
                  </summary>
                  <div className="mt-3 rounded-[8px] bg-neutral-50 p-3">
                    <TaskForm
                      action={updateTaskAction}
                      buttonLabel="Сохранить"
                      filter={filter}
                      mode="edit"
                      task={task}
                    />
                  </div>
                </details>

                {task.isActive ? (
                  <div className="mt-2">
                    <ArchiveTaskButton
                      action={archiveTaskAction}
                      filter={filter}
                      taskId={task.id}
                      title={task.title}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
