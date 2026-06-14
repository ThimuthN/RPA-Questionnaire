import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";
import { publicOrgName, SITE_POLICY_LAST_UPDATED } from "@/lib/legal/site-policy";

export function PublicSiteFrame({
  children,
  current = "home"
}: {
  children: ReactNode;
  current?: "home" | "careers" | "privacy" | "terms";
}) {
  const orgName = publicOrgName();

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-surface)_92%,white),var(--app-surface-soft))] px-5 py-4 shadow-[var(--app-shadow-soft)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0 transition hover:opacity-95" aria-label={`${orgName} home`}>
              <AppLogo compact />
            </Link>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Hiring OS</p>
              <p className="truncate text-sm text-[color:var(--app-muted)]">
                Professional hiring operations for structured recruiting teams.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--app-muted)]">
            <PublicNavLink href="/" active={current === "home"}>
              Overview
            </PublicNavLink>
            <PublicNavLink href="/jobs" active={current === "careers"}>
              Careers
            </PublicNavLink>
            <PublicNavLink href="/privacy" active={current === "privacy"}>
              Privacy Policy
            </PublicNavLink>
            <PublicNavLink href="/terms" active={current === "terms"}>
              Terms
            </PublicNavLink>
            <PublicNavLink href="/login">Log in</PublicNavLink>
          </nav>
        </div>
      </div>

      <div>{children}</div>

      <footer className="rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-5 py-5 text-sm text-[color:var(--app-muted)] shadow-[var(--app-shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--app-brand)]">Northstar Hiring OS</p>
            <p className="max-w-2xl leading-6">
              Candidate applications, assessments, and hiring decisions are processed inside a controlled recruiting workflow.
              Public legal notices are kept current and reviewed as the product changes.
            </p>
          </div>

          <div className="space-y-2 text-right">
            <div className="flex flex-wrap justify-end gap-x-4 gap-y-2">
              <Link href="/privacy" className="transition hover:text-[color:var(--app-heading)]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition hover:text-[color:var(--app-heading)]">
                Terms
              </Link>
              <Link href="/jobs" className="transition hover:text-[color:var(--app-heading)]">
                Open roles
              </Link>
            </div>
            <p className="text-xs">
              {orgName} · Policy set updated {SITE_POLICY_LAST_UPDATED}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PublicNavLink({
  href,
  active = false,
  children
}: {
  href: Route;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border border-[color:var(--app-brand)]/30 bg-[color:var(--app-brand)]/10 px-3 py-1.5 text-[color:var(--app-heading)]"
          : "rounded-full border border-transparent px-3 py-1.5 transition hover:border-[color:var(--app-border)] hover:bg-[color:var(--app-surface)] hover:text-[color:var(--app-heading)]"
      }
    >
      {children}
    </Link>
  );
}
