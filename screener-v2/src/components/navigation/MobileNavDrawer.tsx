"use client";

import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import type { AppSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export function MobileNavDrawer({
  open,
  items,
  pathname,
  viewer,
  onClose
}: {
  open: boolean;
  items: Array<{ href: Route; label: string; icon: LucideIcon }>;
  pathname: string;
  viewer: Pick<AppSession, "email" | "name" | "role"> | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "var(--app-modal-overlay)" }}
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-[min(86vw,360px)] border-l border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5 shadow-[var(--app-shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <AppLogo compact />
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Workspace</p>
              <p className="text-lg text-[color:var(--app-heading)]">{viewer?.name || viewer?.email || "Northstar"}</p>
              {viewer ? <p className="text-sm text-[color:var(--app-muted)]">{viewer.role}</p> : null}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-2 text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const href = item.href as string;
            const active =
              pathname === href ||
              (href === "/results" && pathname.startsWith("/results/")) ||
              (href === "/people/candidates" &&
                (pathname.startsWith("/people") || pathname.startsWith("/candidates"))) ||
              (href === "/addons" && pathname.startsWith("/addons")) ||
              (href === "/assessments" &&
                (pathname.startsWith("/assessments") || pathname.startsWith("/create-test"))) ||
              (href === "/live" && (pathname.startsWith("/live") || pathname.startsWith("/run-test"))) ||
              (href === "/users" && pathname.startsWith("/users"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm transition",
                  active
                    ? "border-[color:var(--pill-teal-border)] bg-[color:var(--pill-teal-bg)] text-[color:var(--app-heading)]"
                    : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-muted)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 border-t border-[color:var(--app-border)] pt-4 space-y-3">
          {viewer ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2 text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="block rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2 text-center text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
            >
              Log in
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
