import { Sparkles } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="premium-empty px-5 py-7 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-[0_10px_24px_rgba(15,107,74,0.10)]">
        <Sparkles className="h-4 w-4" />
      </div>
      <p className="text-base font-extrabold text-neutral-900">{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p> : null}
    </div>
  );
}
