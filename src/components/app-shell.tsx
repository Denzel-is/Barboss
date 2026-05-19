import { Suspense } from "react";
import { LogOut } from "lucide-react";

import type { CurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationBell } from "@/components/notification-bell";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { ToastBanner } from "@/components/toast-banner";

type AppShellProps = {
  user: CurrentUser;
  unreadCount: number;
  children: React.ReactNode;
};

export function AppShell({ user, children, unreadCount }: AppShellProps) {
  const isAdmin = user.role === "admin";
  const title = isAdmin ? "Панель админа" : "Приложение";

  return (
    <div className="premium-shell min-h-dvh text-neutral-950">
      <PullToRefresh />
      <div className="app-device flex flex-col">
        <header className="app-header">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-emerald-700">Barboss</p>
              <h1 className="mt-1 text-[28px] font-[850] leading-none text-neutral-950">{title}</h1>
              <p className="mt-2 truncate text-[15px] text-neutral-500">@{user.username}</p>
            </div>

            <section className="flex shrink-0 items-center gap-2.5">
              <NotificationBell role={user.role} unreadCount={unreadCount} />
              <form action={logoutAction}>
                <button
                  aria-label="Выйти"
                  className="flex h-12 min-w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-700 shadow-[0_8px_22px_rgba(23,53,42,0.06)] transition hover:text-emerald-800"
                  type="submit"
                >
                  <LogOut aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
                  <span className="sr-only">Выйти</span>
                </button>
              </form>
            </section>
          </div>
        </header>

        <main className="page-content page-transition flex-1">
          <Suspense fallback={null}>
            <ToastBanner />
          </Suspense>
          {children}
        </main>
        <BottomNav role={user.role} />
      </div>
    </div>
  );
}
