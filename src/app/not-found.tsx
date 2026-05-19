import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-[430px] rounded-[8px] border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p aria-hidden className="heart-pulse text-4xl">
          💚
        </p>
        <h1 className="mt-4 text-xl font-semibold text-neutral-950">404</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Страница потерялась, но райданчики на месте
        </p>
        <Link
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-emerald-700 px-4 text-sm font-semibold text-white"
          href="/"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

