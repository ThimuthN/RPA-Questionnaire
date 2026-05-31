import Link from "next/link";

export default function EmployeeDetailDisabledPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[color:var(--app-heading)]">
          Employee Management Disabled for v1
        </h1>
        <p className="text-[color:var(--app-muted)]">
          Employee management is outside the v1 hiring workflow.
        </p>
      </div>

      <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <p className="text-sm text-[color:var(--app-text)]">
          Use <strong>Candidates</strong> to record final hiring decisions and track the recruitment pipeline.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/people/candidates"
          className="inline-flex items-center justify-center rounded-full border border-transparent bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_30px_color-mix(in_srgb,var(--app-brand)_28%,transparent)] transition hover:brightness-105 hover:shadow-[0_18px_34px_color-mix(in_srgb,var(--app-brand)_34%,transparent)]"
        >
          View Candidates
        </Link>
        <Link
          href="/people/candidates/jobs"
          className="inline-flex items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2 text-sm font-medium text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
        >
          View Jobs
        </Link>
      </div>
    </div>
  );
}
