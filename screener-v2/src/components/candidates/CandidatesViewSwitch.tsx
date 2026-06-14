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
  | "finalized"
  | "pool";

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

  const lifecycleItems: Array<{ key: CandidatesView; label: string; countKey: keyof StageCounts | null; href: Route }> = [
    { key: "pipeline", label: "Pipeline", countKey: "pipeline", href: `${baseCandidatesPath}?stage=pipeline` as Route },
    { key: "screener", label: "Screening", countKey: "screening", href: `${baseCandidatesPath}?stage=screening` as Route },
    { key: "interview", label: "Interview", countKey: "interview", href: `${baseCandidatesPath}?stage=interview` as Route },
    {
      key: "advanced_review",
      label: "Review",
      countKey: "advanced_review",
      href: `${baseCandidatesPath}?stage=advanced_review` as Route
    },
    { key: "finalized", label: "Final", countKey: "finalized", href: `${baseCandidatesPath}?stage=finalized` as Route }
  ];

  const poolPath =
    scope === "department" && departmentId
      ? (`/departments/${departmentId}/pool` as Route)
      : ("/people/candidates/pool" as Route);

  const hiringSwitchItems: Array<{ key: CandidatesView; label: string; countKey: keyof StageCounts | null; href: Route }> = [
    { key: "jobs", label: "Jobs", countKey: null, href: jobsPath },
    { key: "applicants", label: "Applicants", countKey: "applicant", href: applicantsPath }
  ];

  const poolItem: { key: CandidatesView; label: string; countKey: keyof StageCounts | null; href: Route } =
    { key: "pool", label: "Pool", countKey: "pool", href: poolPath };

  const departmentItems: Array<{ key: CandidatesView; label: string; countKey: keyof StageCounts | null; href: Route }> = [
    { key: "applicants", label: "Applicants", countKey: "applicant", href: applicantsPath },
    ...lifecycleItems,
    poolItem
  ];

  return scope === "department"
    ? departmentItems
    : [...hiringSwitchItems, ...lifecycleItems, poolItem];
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
        const isActive = current === item.key;
        const isEmpty = count !== null && count === 0 && !isActive;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--app-control-bg)]",
              isActive
                ? "bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--app-brand)_22%,transparent)] hover:shadow-[0_16px_32px_color-mix(in_srgb,var(--app-brand)_28%,transparent)]"
                : cn(
                    "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)] hover:shadow-sm",
                    isEmpty && "opacity-40"
                  )
            )}
          >
            {item.label}
            {count !== null && count > 0 ? (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none",
                isActive ? "bg-white/20 text-white" : "bg-[color:var(--app-surface)] text-[color:var(--app-heading)]"
              )}>
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
