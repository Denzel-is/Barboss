import { redirect } from "next/navigation";

import { homePathForRole, getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/app/login/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    loggedOut?: string;
  }>;
};

const errors: Record<string, string> = {
  invalid: "Неверный логин или пароль.",
  missing: "Введите логин и пароль.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(homePathForRole(currentUser.role));
  }

  const params = await searchParams;
  const errorMessage = params.error ? errors[params.error] : null;

  return (
    <main className="min-h-dvh bg-neutral-100 px-4 py-6 text-neutral-950">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[430px] flex-col justify-center">
        <div className="rounded-[8px] border border-neutral-200 bg-white px-5 py-6 shadow-sm">
          <div className="mb-7">
            <p className="text-sm font-medium text-emerald-700">Barboss</p>
            <h1 className="mt-2 text-2xl font-semibold">Вход</h1>
          </div>

          <form action={loginAction} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Логин</span>
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                name="username"
                autoComplete="username"
                inputMode="text"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-700">Пароль</span>
              <input
                className="mt-2 h-12 w-full rounded-[8px] border border-neutral-300 bg-white px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>

            {errorMessage ? (
              <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {params.loggedOut ? (
              <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Вы вышли из аккаунта.
              </p>
            ) : null}

            <button
              className="h-12 w-full rounded-[8px] bg-neutral-950 px-4 text-base font-semibold text-white transition hover:bg-neutral-800"
              type="submit"
            >
              Войти
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
