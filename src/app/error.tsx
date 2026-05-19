"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/report-error-client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientError({
      errorMessage: error.message || "Unknown client error",
      stack: error.stack,
      source: "app/error",
      action: "route_error_boundary",
    });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-[430px] rounded-[8px] border border-red-200 bg-white p-6 text-center shadow-sm">
        <p aria-hidden className="heart-pulse text-3xl">
          💚
        </p>
        <h1 className="mt-3 text-lg font-semibold text-neutral-950">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Не получилось загрузить страницу. Мы уже записали ошибку и сообщим админу.
        </p>
        <button
          className="mt-4 h-11 w-full rounded-[8px] bg-emerald-700 px-4 text-sm font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

