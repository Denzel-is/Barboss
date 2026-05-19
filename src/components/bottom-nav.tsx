"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  Home,
  MessageCircle,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/generated/prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const participantNav: NavItem[] = [
  { href: "/app", label: "Главная", icon: Home },
  { href: "/app/tasks", label: "Задания", icon: ClipboardList },
  { href: "/app/shop", label: "Магазин", icon: ShoppingBag },
  { href: "/app/chat", label: "Чат", icon: MessageCircle },
  { href: "/app/history", label: "История", icon: History },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Главная", icon: Home },
  { href: "/admin/review", label: "Проверка", icon: ClipboardCheck },
  { href: "/admin/tasks", label: "Задания", icon: ClipboardList },
  { href: "/admin/shop", label: "Магазин", icon: Store },
  { href: "/admin/reports", label: "Отчёты", icon: BarChart3 },
  { href: "/admin/logs", label: "Логи", icon: FileText },
  { href: "/admin/chat", label: "Чат", icon: MessageCircle },
];

function isActivePath(pathname: string, href: string) {
  return href === "/app" || href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "admin" ? adminNav : participantNav;

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-50 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2"
    >
      <div className="flex h-[74px] items-center justify-around rounded-full border border-[rgba(232,222,208,0.95)] bg-white/90 p-2 shadow-[0_18px_44px_rgba(23,53,42,0.16)] backdrop-blur-[18px]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-1 text-[11px] font-semibold transition duration-[180ms] ease-out active:scale-[0.97]",
                isActive
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-neutral-500 hover:bg-[#FBF7EF] hover:text-neutral-900",
              ].join(" ")}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <Icon aria-hidden="true" className="h-6 w-6 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
