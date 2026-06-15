import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  History,
  Lock,
  Mail,
  ScrollText,
  ShieldCheck,
  FolderLock
} from "lucide-react";
import { Button } from "@/components/primitives/Button";

// Every claim below maps to a real capability in the codebase:
// - Encrypted credentials  -> lib/integrations/crypto.ts (tokens encrypted at rest)
// - Role-based access      -> department-scoped permissions / access roles
// - Consent captured       -> public application records versioned consent
// - Private documents      -> @vercel/blob private storage, served via authenticated routes
// - Audit trail            -> EmailLog + candidate activity/stage history
// - Your domain or ours    -> lib/email/send.ts (Microsoft mailbox -> Resend fallback)
const TRUST_POINTS: { icon: typeof Lock; title: string; body: string }[] = [
  {
    icon: Lock,
    title: "Encrypted credentials",
    body: "Calendar and mailbox connections are encrypted at rest — access tokens never sit in plain text."
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    body: "Department-scoped permissions and access roles keep candidate data on a strict need-to-know basis."
  },
  {
    icon: ScrollText,
    title: "Consent on every application",
    body: "Public applications capture explicit, versioned data-processing consent — recorded against the candidate."
  },
  {
    icon: FolderLock,
    title: "Private documents",
    body: "Résumés and attachments are stored privately and served only through short-lived, authenticated links."
  },
  {
    icon: History,
    title: "Full audit trail",
    body: "Emails, stage changes, and hiring decisions are logged against each candidate for accountability."
  },
  {
    icon: Mail,
    title: "Your mailbox, or ours",
    body: "Send from your connected Microsoft or Google mailbox — or fall back to managed delivery automatically."
  }
];

export function MarketingStory({ orgName }: { orgName: string }) {
  return (
    <div className="space-y-10">
      {/* ── Value band (voice / soul) ── */}
      <section className="relative overflow-hidden rounded-[30px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] px-6 py-10 text-center shadow-[var(--app-shadow-soft)] md:px-10 md:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--app-brand)]">Why {orgName}</p>
        <blockquote className="mx-auto mt-4 max-w-3xl font-display text-3xl leading-tight text-[color:var(--app-heading)] sm:text-4xl">
          Hiring shouldn&apos;t live in ten browser tabs and a spreadsheet.
        </blockquote>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--app-muted)] sm:text-base">
          {orgName} keeps the job, the applicants, their assessments, the interview notes, and the final
          decision on one timeline — so your team spends time on people, not on chasing context.
        </p>
      </section>

      {/* ── Trust & security ── */}
      <section className="relative overflow-hidden rounded-[30px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] px-6 py-8 shadow-[var(--app-shadow-soft)] md:px-7">
        <div className="pointer-events-none absolute left-0 top-0 h-px w-28 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--app-brand)_85%,transparent),transparent)]" />
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--app-brand)]">Built for trust</p>
          <h2 className="font-display text-3xl leading-tight text-[color:var(--app-heading)] sm:text-4xl">
            Candidate data, handled with care.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--app-muted)]">
            {orgName} is built around least-privilege access, encrypted integrations, and a complete audit trail —
            the controls enterprise talent teams expect.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[18px] bg-[color:var(--app-surface-soft)] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--app-brand)]/20 bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[color:var(--app-heading)]">{title}</p>
              <p className="mt-1.5 text-sm leading-6 text-[color:var(--app-muted)]">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[color:var(--app-border)] pt-5 text-sm">
          <Link href="/privacy" className="font-medium text-[color:var(--app-brand)] hover:underline">Privacy &amp; data handling →</Link>
          <Link href="/terms" className="font-medium text-[color:var(--app-brand)] hover:underline">Terms of service →</Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden rounded-[30px] border border-[color:var(--app-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),var(--app-surface-soft))] px-6 py-10 shadow-[var(--app-shadow-soft)] md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <h2 className="font-display text-3xl leading-tight text-[color:var(--app-heading)] sm:text-4xl">
              See {orgName} in your hiring workflow.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--app-muted)]">
              Browse open roles, or sign in to your team&apos;s workspace.
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-3">
            <Link href={"/jobs" as Route}>
              <Button className="gap-2">
                View open roles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={"/login" as Route}>
              <Button variant="secondary">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
