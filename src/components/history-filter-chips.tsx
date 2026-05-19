"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type FilterOption = {
  value: string;
  label: string;
};

type HistoryFilterChipsProps = {
  options: FilterOption[];
  paramName?: string;
};

export function HistoryFilterChips({ options, paramName = "filter" }: HistoryFilterChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(paramName) ?? options[0]?.value ?? "all";

  function buildHref(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const isActive = active === option.value;

        return (
          <Link
            className={[
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition",
              isActive ? "bg-emerald-700 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
            ].join(" ")}
            href={buildHref(option.value)}
            key={option.value}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
