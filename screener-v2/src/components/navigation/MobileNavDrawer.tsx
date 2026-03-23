"use client";

import Link from "next/link";
import type { Route } from "next";
import { X } from "lucide-react";
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
  items: Array<{ href: Route; label: string }>;
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-[min(86vw,360px)] border-l border-white/10 bg-ink-950/96 p-5 shadow-[var(--shadow-scene)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Workspace</p>
            <p className="text-lg text-white">{viewer?.name || viewer?.email || "Assessment Hub"}</p>
            {viewer ? <p className="text-sm text-slate-400">{viewer.role}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="rounded-full border border-white/12 bg-white/[0.05] p-2 text-slate-200 transition hover:bg-white/[0.08]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {items.map((item) => {
            const href = item.href as string;
            const active =
              pathname === href ||
              (href === "/results" && pathname.startsWith("/results/")) ||
              (href === "/candidates" && pathname.startsWith("/candidates")) ||
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
                  "block rounded-[18px] border px-4 py-3 text-sm transition",
                  active
                    ? "border-brand-300/50 bg-brand-500/12 text-white"
                    : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          {viewer ? (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-full border border-white/16 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition hover:bg-white/[0.08]"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="block rounded-full border border-white/16 bg-white/[0.04] px-4 py-2 text-center text-sm text-slate-100 transition hover:bg-white/[0.08]"
            >
              Log in
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
