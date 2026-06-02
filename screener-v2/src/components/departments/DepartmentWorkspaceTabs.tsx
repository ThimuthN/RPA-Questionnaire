"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

type Tab = { label: string; href: Route };

export function DepartmentWorkspaceTabs({
  tabs,
  departmentId
}: {
  tabs: Tab[];
  departmentId: string;
}) {
  const pathname = usePathname();

  const getIsActive = (href: string) => {
    if (href === `/departments/${departmentId}`) {
      return pathname === `/departments/${departmentId}`;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-2 py-1.5 flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = getIsActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-sm font-medium rounded-[14px] transition whitespace-nowrap ${
              isActive
                ? "bg-[color:var(--app-surface)] border border-[color:var(--pill-teal-border)] text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)]"
                : "text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-surface)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
