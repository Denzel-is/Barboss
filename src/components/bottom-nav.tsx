"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
    <nav className="sticky bottom-0 border-t border-neutral-200 bg-white/95 px-2 py-2 backdrop-blur">
      <div
        className="grid min-h-14 gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[8px] px-1 py-2 text-[11px] font-medium transition",
                isActive ? "bg-emerald-50 text-emerald-800" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
              ].join(" ")}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
