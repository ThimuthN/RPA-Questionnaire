import type { ReactNode } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicMobileMenu } from "@/components/marketing/PublicMobileMenu";
import { publicOrgName, SITE_POLICY_LAST_UPDATED } from "@/lib/legal/site-policy";

const NAV_LINKS = [
  { href: "/", label: "Overview", key: "home" },
  { href: "/jobs", label: "Careers", key: "careers" },
  { href: "/privacy", label: "Privacy", key: "privacy" },
  { href: "/terms", label: "Terms", key: "terms" },
] as const;

export function PublicSiteFrame({
  children,
  current = "home",
  backHref
}: {
  children: ReactNode;
  current?: "home" | "careers" | "privacy" | "terms";
  backHref?: string;
}) {
  const orgName = publicOrgName();

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Sticky top nav ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[color:var(--pub-border)] bg-[color:var(--pub-header-bg)] shadow-[var(--pub-shadow)] backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">

          {/* Left: the designed Northstar wordmark lockup */}
          <Link href="/" aria-label={`${orgName} home`} className="flex shrink-0 items-center transition hover:opacity-90">
            <Image
              src="/brand/northstar-logo-clean.png"
              alt={orgName}
              width={700}
              height={150}
              priority
              className="pub-wordmark h-[26px] w-auto sm:h-7"
            />
          </Link>

          {/* Center: desktop nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex" aria-label="Site navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href as Route}
                aria-current={current === link.key ? "page" : undefined}
                className={
                  current === link.key
                    ? "rounded-full bg-[color:var(--pub-active-bg)] px-3.5 py-1.5 text-sm font-semibold text-[color:var(--pub-active-text)]"
                    : "rounded-full px-3.5 py-1.5 text-sm font-medium text-[color:var(--pub-nav-text)] transition hover:bg-[color:var(--pub-hover-bg)] hover:text-[color:var(--pub-heading)]"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: CTA + mobile toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {backHref ? (
              <Link
                href={backHref as Route}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[color:var(--pub-border)] bg-[color:var(--pub-btn-bg)] px-4 py-2 text-sm font-medium text-[color:var(--pub-heading)] transition hover:bg-[color:var(--pub-btn-hover)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center rounded-full bg-[color:var(--pub-brand)] px-5 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--pub-brand)_30%,transparent)] transition hover:brightness-110"
              >
                Log in
              </Link>
            )}

            {/* Mobile hamburger — client component */}
            <PublicMobileMenu
              links={NAV_LINKS.map((l) => ({ href: l.href, label: l.label, key: l.key }))}
              current={current}
              backHref={backHref}
            />
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="flex-1 mx-auto w-full max-w-6xl px-5 sm:px-8 py-8 sm:py-12">
        {children}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[color:var(--pub-border)] bg-[color:var(--pub-footer-bg)]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center">
                <Image
                  src="/brand/northstar-logo-clean.png"
                  alt={orgName}
                  width={700}
                  height={150}
                  className="pub-wordmark h-6 w-auto"
                />
              </div>
              <p className="max-w-md text-sm leading-6 text-[color:var(--pub-muted)]">
                Candidate applications, assessments, and hiring decisions processed in a controlled recruiting workflow.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-[color:var(--pub-muted)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pub-brand)]">Legal</p>
              <Link href="/privacy" className="transition hover:text-[color:var(--pub-heading)]">Privacy Policy</Link>
              <Link href="/terms" className="transition hover:text-[color:var(--pub-heading)]">Terms of Service</Link>
              <Link href="/jobs" className="transition hover:text-[color:var(--pub-heading)]">Open Roles</Link>
              <p className="mt-2 text-[11px] opacity-60">
                Policy updated {SITE_POLICY_LAST_UPDATED}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
