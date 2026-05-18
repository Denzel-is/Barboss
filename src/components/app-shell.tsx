import type { CurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { BottomNav } from "@/components/bottom-nav";

type AppShellProps = {
  user: CurrentUser;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white shadow-sm">
        <header className="border-b border-neutral-200 px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-700">Barboss</p>
              <h1 className="mt-1 text-xl font-semibold">{isAdmin ? "Панель админа" : "Приложение"}</h1>
              <p className="mt-1 truncate text-sm text-neutral-500">@{user.username}</p>
            </div>

            <form action={logoutAction}>
              <button
                className="h-9 rounded-[8px] border border-neutral-300 px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                type="submit"
              >
                Выйти
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-6">{children}</main>
        <BottomNav role={user.role} />
      </div>
    </div>
  );
}
