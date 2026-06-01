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
    <div className="border-b border-[color:var(--app-border)]">
      <div className="flex gap-4 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = getIsActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-brand text-[color:var(--app-heading)]"
                  : "border-transparent text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
