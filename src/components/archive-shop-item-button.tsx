"use client";

type ArchiveShopItemButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  itemId: string;
  title: string;
};

export function ArchiveShopItemButton({ action, itemId, title }: ArchiveShopItemButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Архивировать товар "${title}"? Старые покупки останутся.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="itemId" type="hidden" value={itemId} />
      <button
        className="h-10 w-full rounded-[8px] border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        type="submit"
      >
        Архивировать
      </button>
    </form>
  );
}
