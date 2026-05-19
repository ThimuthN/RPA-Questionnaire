"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileNavDrawer } from "@/components/navigation/MobileNavDrawer";
import { getNavItems } from "@/components/navigation/nav-config";
import type { AppSession } from "@/lib/auth/session";

export function MainNav({ viewer }: { viewer: Pick<AppSession, "email" | "name" | "permissions" | "departmentId"> | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = getNavItems(viewer);

  return (
    <div className="flex items-center gap-2 md:hidden">
      <div>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-header-border)] bg-[color:var(--app-header-surface)] px-3 py-2 text-sm text-[color:var(--app-scene-heading)] transition hover:bg-[color:var(--app-header-surface-hover)]"
        >
          <Menu className="h-4 w-4" />
          <span>{viewer ? "Menu" : "Explore"}</span>
        </button>
      </div>

      <MobileNavDrawer
        open={mobileOpen}
        items={items}
        pathname={pathname}
        viewer={viewer}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}
