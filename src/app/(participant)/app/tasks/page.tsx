import { TaskSubmissionForm } from "@/components/task-submission-form";
import { EmptyState } from "@/components/empty-state";
import { RewardFloat } from "@/components/reward-float";
import { SectionPanel } from "@/components/section-panel";
import { formatReward } from "@/lib/format";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getStorageDriver, isStorageConfigured } from "@/lib/storage";
import { getMoscowDayRange, isSixCircleTaskTitle, SIX_CIRCLE_REQUIRED_COUNT } from "@/lib/task-requirements";

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
  const storageConfigured = isStorageConfigured();
  const storageDriver = getStorageDriver();
  const today = getMoscowDayRange();

  const [tasks, pendingSubmissions, todayProgressSubmissions] = await Promise.all([
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
    getDb().taskSubmission.findMany({
      where: {
        userId: user.id,
        status: { in: ["pending", "approved"] },
        createdAt: {
          gte: today.start,
          lt: today.end,
        },
      },
      select: {
        taskId: true,
        status: true,
      },
    }),
  ]);

  const pendingTaskIds = new Set(pendingSubmissions.map((submission) => submission.taskId));
  const progressByTaskId = new Map<string, { approved: number; pending: number; total: number }>();

  for (const submission of todayProgressSubmissions) {
    const current = progressByTaskId.get(submission.taskId) ?? { approved: 0, pending: 0, total: 0 };

    if (submission.status === "approved") {
      current.approved += 1;
    }

    if (submission.status === "pending") {
      current.pending += 1;
    }

    current.total += 1;
    progressByTaskId.set(submission.taskId, current);
  }

  const groupedTasks = tasks.reduce<Record<string, typeof tasks>>((groups, task) => {
    groups[task.category] = groups[task.category] ?? [];
    groups[task.category].push(task);
    return groups;
  }, {});
  const categories = Object.keys(groupedTasks).sort(sortCategories);

  return (
    <div className="space-y-4">
      {params.error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.error === "video_required"
            ? "Для задания нужно прикрепить видео."
            : "Не удалось отправить задание. Попробуй еще раз."}
        </p>
      ) : null}

      {categories.length === 0 ? (
        <EmptyState title="Нет заданий" description="Когда появятся новые задания, они будут здесь." />
      ) : null}

      {categories.map((category) => (
        <SectionPanel eyebrow="Задания" title={category} key={category}>
          <div className="space-y-3">
            {(groupedTasks[category] ?? []).map((task) => {
              const isSixCircleTask = isSixCircleTaskTitle(task.title);
              const progress = progressByTaskId.get(task.id) ?? { approved: 0, pending: 0, total: 0 };
              const isPending = pendingTaskIds.has(task.id);
              const isSixCircleFull = isSixCircleTask && progress.total >= SIX_CIRCLE_REQUIRED_COUNT;
              const shouldBlockSubmission = isSixCircleTask ? isSixCircleFull : isPending;

              return (
                <article className="relative rounded-[8px] border border-neutral-200 p-3" key={task.id}>
                  <RewardFloat amount={task.reward} />
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
                    <span className="rounded-[8px] bg-violet-50 px-2 py-1 text-violet-800">видео</span>
                    {isSixCircleTask ? (
                      <span className="rounded-[8px] bg-emerald-50 px-2 py-1 text-emerald-800">
                        {progress.total}/{SIX_CIRCLE_REQUIRED_COUNT} кружочков
                      </span>
                    ) : null}
                  </div>

                  {shouldBlockSubmission ? (
                    <p className="mt-3 rounded-[8px] bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                      {isSixCircleTask
                        ? "Сегодня отправлены все 6 кружочков. Райданчики придут после принятия всех видео."
                        : "Уже на проверке."}
                    </p>
                  ) : (
                    <details className="mt-3">
                      <summary className="cursor-pointer list-none rounded-[8px] bg-neutral-950 px-3 py-2 text-center text-sm font-semibold text-white">
                        Отправить на проверку
                      </summary>

                      <TaskSubmissionForm
                        proofType={task.proofType}
                        storageConfigured={storageConfigured}
                        storageDriver={storageDriver}
                        taskId={task.id}
                        taskTitle={task.title}
                      />
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
