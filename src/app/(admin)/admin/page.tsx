import { SectionPanel } from "@/components/section-panel";
import { getDb } from "@/lib/db";
import { formatBalance } from "@/lib/format";

const purchaseDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

export default async function AdminHomePage() {
  const db = getDb();
  const [pendingCount, latestPurchases] = await Promise.all([
    db.taskSubmission.count({
      where: { status: "pending" },
    }),
    db.shopPurchase.findMany({
      include: {
        item: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-4">
      <SectionPanel eyebrow="Главная" title="Админ-панель">
        <p className="text-3xl font-semibold text-neutral-950">{pendingCount}</p>
        <p className="mt-2 text-sm text-neutral-500">отправок ожидают проверки</p>
      </SectionPanel>

      <SectionPanel eyebrow="Магазин" title="Последние покупки">
        {latestPurchases.length === 0 ? (
          <p>Покупок пока нет.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {latestPurchases.map((purchase) => (
              <li className="py-3" key={purchase.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">{purchase.item.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      @{purchase.user.username} · {purchaseDateFormatter.format(purchase.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-neutral-900">{formatBalance(purchase.price)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
    </div>
  );
}
