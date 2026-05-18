import { SectionPanel } from "@/components/section-panel";
import { formatReward } from "@/lib/format";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { submitTaskAction } from "@/app/(participant)/app/tasks/actions";

type TasksPageProps = {
  searchParams: Promise<{
    submitted?: string;
    error?: string;
  }>;
};

const categoryOrder = [
  "Ежедневные",
  "Спорт",
  "Встреча",
  "Милые бонусы",
  "Видео / внимание",
  "Ричи",
  "Штрафы",
];

function sortCategories(a: string, b: string) {
  const aIndex = categoryOrder.indexOf(a);
  const bIndex = categoryOrder.indexOf(b);

  if (aIndex === -1 && bIndex === -1) {
    return a.localeCompare(b, "ru");
  }

  if (aIndex === -1) {
    return 1;
  }

  if (bIndex === -1) {
    return -1;
  }

  return aIndex - bIndex;
}

export default async function ParticipantTasksPage({ searchParams }: TasksPageProps) {
  const user = await requireRole("participant");
  const params = await searchParams;

  const [tasks, pendingSubmissions] = await Promise.all([
    getDb().task.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    }),
    getDb().taskSubmission.findMany({
      where: {
        userId: user.id,
        status: "pending",
      },
      select: {
        taskId: true,
      },
    }),
  ]);

  const pendingTaskIds = new Set(pendingSubmissions.map((submission) => submission.taskId));
  const groupedTasks = tasks.reduce<Record<string, typeof tasks>>((groups, task) => {
    groups[task.category] = groups[task.category] ?? [];
    groups[task.category].push(task);
    return groups;
  }, {});
  const categories = Object.keys(groupedTasks).sort(sortCategories);

  return (
    <div className="space-y-4">
      {params.submitted ? (
        <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Отправлено на проверку.
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Не удалось отправить задание. Попробуй еще раз.
        </p>
      ) : null}

      {categories.map((category) => (
        <SectionPanel eyebrow="Задания" title={category} key={category}>
          <div className="space-y-3">
            {(groupedTasks[category] ?? []).map((task) => {
              const isPending = pendingTaskIds.has(task.id);

              return (
                <article className="rounded-[8px] border border-neutral-200 p-3" key={task.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-neutral-950">{task.title}</h3>
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
                    {task.isDaily ? <span className="rounded-[8px] bg-neutral-100 px-2 py-1">ежедневное</span> : null}
                    {task.isPenalty ? <span className="rounded-[8px] bg-red-50 px-2 py-1 text-red-700">штраф</span> : null}
                    <span className="rounded-[8px] bg-neutral-100 px-2 py-1">proof: {task.proofType}</span>
                  </div>

                  {isPending ? (
                    <p className="mt-3 rounded-[8px] bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                      Уже на проверке.
                    </p>
                  ) : (
                    <details className="mt-3">
                      <summary className="cursor-pointer list-none rounded-[8px] bg-neutral-950 px-3 py-2 text-center text-sm font-semibold text-white">
                        Отправить на проверку
                      </summary>

                      <form action={submitTaskAction} className="mt-3 space-y-3 rounded-[8px] bg-neutral-50 p-3">
                        <input name="taskId" type="hidden" value={task.id} />

                        <label className="block">
                          <span className="text-sm font-medium text-neutral-700">Комментарий</span>
                          <textarea
                            className="mt-2 min-h-20 w-full rounded-[8px] border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                            name="comment"
                            placeholder="Что сделано?"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium text-neutral-700">Текстовое доказательство</span>
                          <textarea
                            className="mt-2 min-h-20 w-full rounded-[8px] border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                            name="proofText"
                            placeholder="Ссылка, описание или заметка для проверки"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-medium text-neutral-700">Файлы</span>
                          <input
                            className="mt-2 w-full rounded-[8px] border border-dashed border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-500"
                            disabled
                            type="file"
                          />
                          <span className="mt-1 block text-xs text-neutral-500">Загрузка файлов появится позже.</span>
                        </label>

                        <button
                          className="h-11 w-full rounded-[8px] bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                          type="submit"
                        >
                          Отправить
                        </button>
                      </form>
                    </details>
                  )}
                </article>
              );
            })}
          </div>
        </SectionPanel>
      ))}
    </div>
  );
}
