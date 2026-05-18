"use client";

type ArchiveTaskButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  filter: string;
  taskId: string;
  title: string;
};

export function ArchiveTaskButton({ action, filter, taskId, title }: ArchiveTaskButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Архивировать задание "${title}"? Старые отправки и история останутся.`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="taskId" type="hidden" value={taskId} />
      <input name="returnFilter" type="hidden" value={filter} />
      <button
        className="h-10 w-full rounded-[8px] border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        type="submit"
      >
        Архивировать
      </button>
    </form>
  );
}
