import { formatBalance, formatReward } from "@/lib/format";
import type { AdminReportSummary } from "@/lib/history-types";

type AdminReportSummaryCardsProps = {
  summary: AdminReportSummary;
};

export function AdminReportSummaryCards({ summary }: AdminReportSummaryCardsProps) {
  const cards = [
    {
      label: `Баланс ${summary.participantUsername}`,
      value: formatBalance(summary.balance),
    },
    {
      label: "Заработано за неделю",
      value: formatReward(summary.earnedWeek),
    },
    {
      label: "Потрачено за неделю",
      value: formatReward(-summary.spentWeek),
    },
    {
      label: "На проверке",
      value: String(summary.pendingTasks),
    },
    {
      label: "Покупок всего",
      value: String(summary.purchasesCount),
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <article className="rounded-[8px] border border-neutral-200 bg-white p-3" key={card.label}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{card.label}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
