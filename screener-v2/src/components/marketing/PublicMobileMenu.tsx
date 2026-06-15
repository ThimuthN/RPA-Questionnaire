"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Menu, X, ArrowLeft } from "lucide-react";

export function PublicMobileMenu({
  links,
  current,
  backHref
}: {
  links: Array<{ href: string; label: string; key: string }>;
  current: string;
  backHref?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--pub-border)] bg-[color:var(--pub-btn-bg)] text-[color:var(--pub-nav-text)] transition hover:bg-[color:var(--pub-btn-hover)]"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-[color:var(--pub-border)] bg-[color:var(--pub-header-bg)] shadow-lg z-50">
          <nav className="mx-auto max-w-6xl px-5 py-4 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href as Route}
                onClick={() => setOpen(false)}
                className={
                  current === link.key
                    ? "rounded-[12px] bg-[color:var(--pub-active-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--pub-active-text)]"
                    : "rounded-[12px] px-4 py-2.5 text-sm font-medium text-[color:var(--pub-nav-text)] transition hover:bg-[color:var(--pub-hover-bg)] hover:text-[color:var(--pub-heading)]"
                }
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 pt-2 border-t border-[color:var(--pub-border)]">
              {backHref ? (
                <Link
                  href={backHref as Route}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-medium text-[color:var(--pub-nav-text)] transition hover:bg-[color:var(--pub-hover-bg)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-full bg-[color:var(--pub-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Log in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
