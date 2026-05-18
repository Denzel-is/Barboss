import { SectionPanel } from "@/components/section-panel";
import { buyShopItemAction } from "@/app/(participant)/app/shop/actions";
import { requireRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatBalance } from "@/lib/format";

type ParticipantShopPageProps = {
  searchParams: Promise<{
    purchased?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  balance: "Не хватает райданчиков.",
  invalid: "Не удалось оформить покупку.",
  missing: "Товар не найден или архивирован.",
};

export default async function ParticipantShopPage({ searchParams }: ParticipantShopPageProps) {
  const user = await requireRole("participant");
  const params = await searchParams;
  const db = getDb();

  const [items, balanceResult] = await Promise.all([
    db.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ price: "asc" }, { createdAt: "asc" }],
    }),
    db.walletTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    }),
  ]);

  const balance = balanceResult._sum.amount ?? 0;

  return (
    <div className="space-y-4">
      {params.purchased ? (
        <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Покупка оформлена.
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessages[params.error] ?? "Не удалось оформить покупку."}
        </p>
      ) : null}

      <SectionPanel eyebrow="Магазин" title="Баланс">
        <p className="text-3xl font-semibold text-neutral-950">{formatBalance(balance)}</p>
      </SectionPanel>

      <SectionPanel eyebrow="Магазин" title="Товары">
        {items.length === 0 ? (
          <p>Активных товаров пока нет.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const canBuy = balance >= item.price;

              return (
                <article className="rounded-[8px] border border-neutral-200 p-3" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-neutral-950">{item.title}</h3>
                      <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                    </div>
                    <span className="shrink-0 rounded-[8px] bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-800">
                      {formatBalance(item.price)}
                    </span>
                  </div>

                  {canBuy ? (
                    <form action={buyShopItemAction} className="mt-3">
                      <input name="itemId" type="hidden" value={item.id} />
                      <button
                        className="h-11 w-full rounded-[8px] bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                        type="submit"
                      >
                        Купить
                      </button>
                    </form>
                  ) : (
                    <button
                      className="mt-3 h-11 w-full rounded-[8px] bg-neutral-200 px-4 text-sm font-semibold text-neutral-500"
                      disabled
                      type="button"
                    >
                      Не хватает райданчиков
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
