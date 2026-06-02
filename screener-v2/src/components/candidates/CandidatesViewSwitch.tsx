import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { getCandidateStageCounts } from "@/lib/db/candidates";

export type CandidatesView =
  | "jobs"
  | "applicants"
  | "pipeline"
  | "screener"
  | "interview"
  | "advanced_review"
  | "finalized";

type StageCounts = Awaited<ReturnType<typeof getCandidateStageCounts>>;

function buildItems(scope: "global" | "department", departmentId?: string) {
  const baseCandidatesPath =
    scope === "department" && departmentId
      ? (`/departments/${departmentId}/candidates` as Route)
      : ("/people/candidates" as Route);
  const applicantsPath =
    scope === "department" && departmentId
      ? (`/departments/${departmentId}/applicants` as Route)
      : ("/people/candidates/applicants" as Route);
  const jobsPath =
    scope === "department" && departmentId
      ? (`/departments/${departmentId}/jobs` as Route)
      : ("/people/candidates/jobs" as Route);

  return [
    { key: "jobs", label: "Jobs", countKey: null, href: jobsPath },
    { key: "applicants", label: "Applicants", countKey: "applicant", href: applicantsPath },
    { key: "pipeline", label: "Pipeline", countKey: "pipeline", href: `${baseCandidatesPath}?stage=pipeline` as Route },
    { key: "screener", label: "Screening", countKey: "screening", href: `${baseCandidatesPath}?stage=screening` as Route },
    { key: "interview", label: "Interview", countKey: "interview", href: `${baseCandidatesPath}?stage=interview` as Route },
    {
      key: "advanced_review",
      label: "Advanced Review",
      countKey: "advanced_review",
      href: `${baseCandidatesPath}?stage=advanced_review` as Route
    },
    { key: "finalized", label: "Finalized", countKey: "finalized", href: `${baseCandidatesPath}?stage=finalized` as Route }
  ] satisfies Array<{ key: CandidatesView; label: string; countKey: keyof StageCounts | null; href: Route }>;
}

export async function CandidatesViewSwitch({
  current,
  scope = "global",
  departmentId,
  countsDepartmentId
}: {
  current: CandidatesView;
  scope?: "global" | "department";
  departmentId?: string;
  countsDepartmentId?: string;
}) {
  const counts = await getCandidateStageCounts(countsDepartmentId);
  const items = buildItems(scope, departmentId);

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-1 text-sm text-[color:var(--app-text)] shadow-[var(--app-shadow-soft)]">
      {items.map((item) => {
        const count = item.countKey ? counts[item.countKey] : null;
        const label = count !== null ? `${item.label} (${count})` : item.label;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 transition-all whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--app-control-bg)]",
              current === item.key
                ? "bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--app-brand)_22%,transparent)] hover:shadow-[0_16px_32px_color-mix(in_srgb,var(--app-brand)_28%,transparent)]"
                : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)] hover:shadow-sm"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
