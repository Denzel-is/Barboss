import { ArchiveShopItemButton } from "@/components/archive-shop-item-button";
import { SectionPanel } from "@/components/section-panel";
import { archiveShopItemAction, createShopItemAction, updateShopItemAction } from "@/app/(admin)/admin/shop/actions";
import { getDb } from "@/lib/db";
import { formatBalance } from "@/lib/format";

type AdminShopPageProps = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    archived?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  duplicate: "Товар с таким названием уже есть.",
  invalid: "Проверь поля формы.",
  missing: "Товар не найден.",
};

type ShopItemFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  buttonLabel: string;
  mode: "create" | "edit";
  item?: {
    id: string;
    title: string;
    description: string;
    price: number;
    isActive: boolean;
  };
};

function ShopItemForm({ action, buttonLabel, mode, item }: ShopItemFormProps) {
  return (
    <form action={action} className="space-y-3">
      {item ? <input name="itemId" type="hidden" value={item.id} /> : null}

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Название</span>
        <input
          className="mt-2 h-11 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={item?.title}
          name="title"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Описание</span>
        <textarea
          className="mt-2 min-h-20 w-full rounded-[8px] border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={item?.description}
          name="description"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Цена</span>
        <input
          className="mt-2 h-11 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          defaultValue={item?.price ?? 100}
          inputMode="numeric"
          min={0}
          name="price"
          required
          type="number"
        />
      </label>

      <label className="flex items-center gap-2 rounded-[8px] border border-neutral-200 px-3 py-2 text-sm text-neutral-700">
        <input
          className="h-4 w-4 rounded border-neutral-300 text-emerald-700"
          defaultChecked={item?.isActive ?? true}
          name="isActive"
          type="checkbox"
        />
        Активен
      </label>

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

export default async function AdminShopPage({ searchParams }: AdminShopPageProps) {
  const params = await searchParams;
  const items = await getDb().shopItem.findMany({
    include: {
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { price: "asc" }, { createdAt: "asc" }],
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
          {errorMessages[params.error] ?? "Не удалось сохранить товар."}
        </p>
      ) : null}

      <details className="rounded-[8px] border border-neutral-200 bg-white p-4">
        <summary className="cursor-pointer list-none rounded-[8px] bg-neutral-950 px-3 py-3 text-center text-sm font-semibold text-white">
          Создать товар
        </summary>
        <div className="mt-4">
          <ShopItemForm action={createShopItemAction} buttonLabel="Создать" mode="create" />
        </div>
      </details>

      <SectionPanel eyebrow="Магазин" title={`Товары: ${items.length}`}>
        {items.length === 0 ? (
          <p>Товаров пока нет.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
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

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                  <span className={item.isActive ? "rounded-[8px] bg-emerald-50 px-2 py-1 text-emerald-800" : "rounded-[8px] bg-neutral-100 px-2 py-1"}>
                    {item.isActive ? "активен" : "в архиве"}
                  </span>
                  <span className="rounded-[8px] bg-neutral-100 px-2 py-1">покупок: {item._count.purchases}</span>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer list-none rounded-[8px] border border-neutral-300 px-3 py-2 text-center text-sm font-semibold text-neutral-800">
                    Редактировать
                  </summary>
                  <div className="mt-3 rounded-[8px] bg-neutral-50 p-3">
                    <ShopItemForm action={updateShopItemAction} buttonLabel="Сохранить" item={item} mode="edit" />
                  </div>
                </details>

                {item.isActive ? (
                  <div className="mt-2">
                    <ArchiveShopItemButton action={archiveShopItemAction} itemId={item.id} title={item.title} />
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
