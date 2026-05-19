type SkeletonCardsProps = {
  count?: number;
};

export function SkeletonCards({ count = 3 }: SkeletonCardsProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <article className="premium-card-sm" key={index}>
          <div className="h-3 w-20 rounded-full skeleton" />
          <div className="mt-3 h-5 w-3/5 rounded-full skeleton" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded-full skeleton" />
            <div className="h-3 w-4/5 rounded-full skeleton" />
          </div>
          <div className="mt-4 h-10 rounded-[18px] skeleton" />
        </article>
      ))}
    </div>
  );
}

export function RouteLoading({ label = "Загрузка" }: { label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-label={label}>
      <div className="premium-card-sm flex items-center gap-2 text-sm font-bold text-emerald-800">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-700 route-loading-dot" />
        <span>{label}</span>
      </div>
      <SkeletonCards />
    </div>
  );
}
