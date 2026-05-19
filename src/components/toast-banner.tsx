"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { TOAST_MESSAGES, type ToastKey } from "@/lib/notification-types";

function isToastKey(value: string | null): value is ToastKey {
  return Boolean(value && value in TOAST_MESSAGES);
}

export function ToastBanner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toastKey = searchParams.get("toast");

  const toast = isToastKey(toastKey) ? TOAST_MESSAGES[toastKey] : null;
  const showCelebration = toastKey === "task_approved" || toastKey === "reward_credited";

  useEffect(() => {
    if (!toast) {
      return;
    }

    const cleanTimer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 3600);

    return () => {
      window.clearTimeout(cleanTimer);
    };
  }, [toast, pathname, router, searchParams]);

  if (!toast) {
    return null;
  }

  const toneClass =
    toast.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : toast.tone === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-neutral-200 bg-neutral-50 text-neutral-900";

  return (
    <div className="relative mb-4">
      {showCelebration ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 -top-4 h-20 overflow-hidden">
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              className="confetti-piece absolute h-2 w-1 rounded-full bg-emerald-300"
              key={index}
              style={{
                left: `${8 + index * 6}%`,
                animationDelay: `${index * 38}ms`,
                backgroundColor: index % 3 === 0 ? "#1CD3A2" : index % 3 === 1 ? "#50C878" : "#8B6F47",
                ["--x" as string]: `${index % 2 === 0 ? "-" : ""}${18 + index * 2}px`,
              }}
            />
          ))}
        </div>
      ) : null}
      <div
        className={[
          "premium-toast rounded-[8px] border px-3 py-2 text-sm font-medium shadow-sm transition",
          toneClass,
        ].join(" ")}
        role="status"
      >
        {toast.title}
      </div>
    </div>
  );
}
