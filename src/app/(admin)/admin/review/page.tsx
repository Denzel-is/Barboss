import { SubmissionFiles } from "@/components/submission-files";
import { EmptyState } from "@/components/empty-state";
import { RewardFloat } from "@/components/reward-float";
import { SectionPanel } from "@/components/section-panel";
import { formatReward } from "@/lib/format";
import { getDb } from "@/lib/db";
import { reviewSubmissionAction } from "@/app/(admin)/admin/review/actions";

type AdminReviewPageProps = {
  searchParams: Promise<{
    reviewed?: string;
    error?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

export default async function AdminReviewPage({ searchParams }: AdminReviewPageProps) {
  const params = await searchParams;
  const submissions = await getDb().taskSubmission.findMany({
    where: { status: "pending" },
    include: {
      files: true,
      task: true,
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      {params.error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Отправку не удалось обработать.
        </p>
      ) : null}

      <SectionPanel eyebrow="Проверка" title={`Ожидают проверки: ${submissions.length}`}>
        {submissions.length === 0 ? (
          <EmptyState title="Нет заданий на проверку" description="Очередь чистая. Новые отправки появятся здесь." />
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <article className="relative rounded-[8px] border border-neutral-200 p-3" key={submission.id}>
                <RewardFloat amount={submission.task.reward} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-500">@{submission.user.username}</p>
                    <h3 className="mt-1 text-base font-semibold text-neutral-950">{submission.task.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{submission.task.description}</p>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-[8px] px-2 py-1 text-xs font-semibold",
                      submission.task.reward < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800",
                    ].join(" ")}
                  >
                    {formatReward(submission.task.reward)}
                  </span>
                </div>

                <div className="mt-3 space-y-2 rounded-[8px] bg-neutral-50 p-3">
                  <p>
                    <span className="font-medium text-neutral-800">Комментарий:</span>{" "}
                    {submission.comment || "нет"}
                  </p>
                  <p>
                    <span className="font-medium text-neutral-800">Доказательство:</span>{" "}
                    {submission.proofText || "нет"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Отправлено: {dateFormatter.format(submission.createdAt)} · Файлов: {submission.files.length}
                  </p>
                  <SubmissionFiles files={submission.files} taskTitle={submission.task.title} />
                </div>

                <form action={reviewSubmissionAction} className="mt-3 space-y-3">
                  <input name="submissionId" type="hidden" value={submission.id} />
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-700">Комментарий админа</span>
                    <textarea
                      className="mt-2 min-h-20 w-full rounded-[8px] border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      name="adminComment"
                      placeholder="Причина решения или заметка"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="h-11 rounded-[8px] bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      name="intent"
                      type="submit"
                      value="approve"
                    >
                      Approve
                    </button>
                    <button
                      className="h-11 rounded-[8px] bg-red-700 px-3 text-sm font-semibold text-white transition hover:bg-red-800"
                      name="intent"
                      type="submit"
                      value="reject"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
