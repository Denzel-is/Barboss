"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/logs", label: "Логи" },
  { href: "/admin/errors", label: "Ошибки" },
];

export function AdminLogsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);

        return (
          <Link
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              isActive ? "bg-emerald-700 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
            ].join(" ")}
            href={tab.href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
