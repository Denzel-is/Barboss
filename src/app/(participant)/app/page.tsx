import { SectionPanel } from "@/components/section-panel";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatBalance, formatReward } from "@/lib/format";

export default async function ParticipantHomePage() {
  const user = await requireRole("participant");
  const db = getDb();

  const [balanceResult, recentTransactions, pendingCount] = await Promise.all([
    db.walletTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    }),
    db.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.taskSubmission.count({
      where: {
        userId: user.id,
        status: "pending",
      },
    }),
  ]);

  const balance = balanceResult._sum.amount ?? 0;

  return (
    <div className="space-y-4">
      <SectionPanel eyebrow="Главная" title="Баланс">
        <p className="text-3xl font-semibold text-neutral-950">{formatBalance(balance)}</p>
        <p className="mt-2 text-sm text-neutral-500">На проверке: {pendingCount}</p>
      </SectionPanel>

      <SectionPanel eyebrow="Кошелек" title="Последние операции">
        {recentTransactions.length === 0 ? (
          <p>Операций пока нет.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {recentTransactions.map((transaction) => (
              <li className="flex items-start justify-between gap-3 py-3" key={transaction.id}>
                <div>
                  <p className="font-medium text-neutral-900">{transaction.description}</p>
                  <p className="text-xs text-neutral-500">{transaction.type}</p>
                </div>
                <span
                  className={[
                    "shrink-0 font-semibold",
                    transaction.amount < 0 ? "text-red-700" : "text-emerald-700",
                  ].join(" ")}
                >
                  {formatReward(transaction.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
    </div>
  );
}
