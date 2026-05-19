import { redirect } from "next/navigation";
import { ArrowRight, Coins, Heart, Sparkles } from "lucide-react";

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
    <main className="premium-login overflow-x-hidden text-neutral-950">
      <section className="page-transition login-welcome-page relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-hidden overflow-y-auto px-5 pb-6 pt-[calc(18px+env(safe-area-inset-top))]">
        <header className="login-brand-area text-center">
          <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-[18px] border border-neutral-200 bg-white/85 text-2xl font-black text-emerald-800 shadow-[0_18px_38px_rgba(15,107,74,0.10)]">
            B
          </div>
          <p className="mt-2 font-serif text-[42px] font-bold leading-none tracking-[0.02em] text-[#0B3D2E]">Barboss</p>
          <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#8B6F47]">
            Твой день. Твои задания. Твой рост.
          </p>
        </header>

        <section aria-label="Добро пожаловать" className="login-hero relative mt-2 flex items-end justify-center">
          <div className="absolute left-1/2 top-3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#FFFDF8] to-[#F2E4C6] opacity-35" />
          <div className="absolute right-9 top-11 z-[3] flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#F2E4C6] bg-[#FFF4D8] text-[#8B6F47] shadow-[0_12px_24px_rgba(139,111,71,0.12)] animate-bb-float">
            <Coins aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.3} />
          </div>
          <div className="absolute left-8 top-[46%] z-[3] flex h-8 w-8 rotate-[-10deg] items-center justify-center rounded-full border border-red-100 bg-white/90 text-red-400 shadow-[0_10px_24px_rgba(231,93,93,0.10)]">
            <Heart aria-hidden="true" className="h-4 w-4 fill-current" strokeWidth={1.8} />
          </div>
          <Sparkles
            aria-hidden="true"
            className="absolute left-14 top-10 z-[3] h-5 w-5 text-[#C9A15A]"
            strokeWidth={2.2}
          />
          <Sparkles
            aria-hidden="true"
            className="absolute right-14 top-[54%] z-[3] h-4 w-4 text-[#18A66A]"
            strokeWidth={2.2}
          />

          <div className="relative z-[2] mb-3 w-[315px] max-w-[95%] rounded-[34px] border border-neutral-200 bg-white/72 px-5 pb-6 pt-7 text-center shadow-[0_22px_52px_rgba(23,53,42,0.10)] backdrop-blur-md animate-bb-float">
            <div className="mx-auto flex h-28 items-end justify-center gap-3">
              <div className="relative h-24 w-24 rounded-[28px] border border-[#E8DED0] bg-[#E8F5EE] shadow-[0_18px_36px_rgba(15,107,74,0.14)]">
                <div className="absolute left-1/2 top-5 h-10 w-10 -translate-x-1/2 rounded-full bg-white shadow-inner" />
                <div className="absolute bottom-4 left-1/2 h-8 w-14 -translate-x-1/2 rounded-t-full bg-[#0F6B4A]" />
              </div>
              <div className="relative h-28 w-24 rounded-[30px] border border-[#E8DED0] bg-[#FBF7EF] shadow-[0_18px_36px_rgba(139,111,71,0.12)]">
                <div className="absolute left-1/2 top-6 h-10 w-10 -translate-x-1/2 rounded-full bg-white shadow-inner" />
                <div className="absolute bottom-5 left-1/2 h-9 w-14 -translate-x-1/2 rounded-t-full bg-[#C9A15A]" />
              </div>
            </div>
            <p className="mt-5 text-lg font-extrabold text-neutral-950">Добро пожаловать в Barboss</p>
            <p className="mt-2 text-sm leading-5 text-neutral-500">Нежный ритм, красивые цели и райданчики за каждый шаг.</p>
          </div>
        </section>

        <div className="login-card relative z-[3] -mt-[18px] rounded-[30px] border border-neutral-200 bg-white/90 p-[22px] shadow-[0_22px_52px_rgba(23,53,42,0.12)] backdrop-blur-md">
          <div>
            <span className="inline-flex h-[30px] items-center rounded-full bg-emerald-50 px-3 text-[13px] font-bold text-emerald-800">
              Личный кабинет
            </span>
            <h1 className="mt-3 text-[30px] font-[850] leading-[1.1] text-neutral-950">Вход</h1>
            <p className="mt-2 text-[15px] leading-[1.5] text-neutral-500">
              Задания, чат, магазин и райданчики в одном месте.
            </p>
          </div>

          <form action={loginAction} className="mt-[22px]">
            <label className="mb-4 block">
              <span className="text-sm font-bold text-neutral-700">Логин</span>
              <input
                className="mt-2 h-14 w-full rounded-[18px] border border-neutral-300 bg-[#FFFDF8] px-4 text-base outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                name="username"
                autoComplete="username"
                inputMode="text"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-neutral-700">Пароль</span>
              <input
                className="mt-2 h-14 w-full rounded-[18px] border border-neutral-300 bg-[#FFFDF8] px-4 text-base outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>

            {errorMessage ? (
              <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {params.loggedOut ? (
              <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-800">
                Вы вышли из аккаунта.
              </p>
            ) : null}

            <button
              className="mt-[18px] flex h-[58px] w-full items-center justify-center gap-2 rounded-[20px] bg-neutral-950 px-4 text-base font-bold text-white transition hover:opacity-95"
              type="submit"
            >
              Войти
              <ArrowRight aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
            </button>

            <p className="mt-3.5 text-center text-xs leading-5 text-neutral-500">
              Barboss сохраняет историю действий без удаления.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
