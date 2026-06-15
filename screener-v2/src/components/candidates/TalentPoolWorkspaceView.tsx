import Link from "next/link";
import type { Route } from "next";
import { requirePageSession } from "@/lib/auth/guards";
import { listTalentPool } from "@/lib/db/candidates";
import { getCandidateStageLabel } from "@/lib/candidates/lifecycle";
import { DataTable } from "@/components/primitives/DataTable";
import { StatusPill } from "@/components/primitives/StatusPill";
import { TalentPoolActions } from "@/components/candidates/TalentPoolActions";

function daysAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function TalentPoolWorkspaceView({
  scope,
  departmentId,
}: {
  scope: "global" | "department";
  departmentId?: string;
}) {
  const session = await requirePageSession(scope === "department" ? `/departments/${departmentId ?? ""}/pool` : "/people/candidates/pool");
  const canManage = scope === "department"
    ? session.permissions.includes("manage_candidates")
    : session.permissions.includes("manage_candidates");
  const candidates = await listTalentPool(departmentId);

  const profileBasePath = scope === "department" && departmentId
    ? `/departments/${departmentId}/candidates`
    : "/people/candidates";

  if (candidates.length === 0) {
    return (
      <div className="rounded-[20px] border border-dashed border-[color:var(--app-border)] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[color:var(--app-heading)]">Talent pool is empty</p>
        <p className="mt-1 text-sm text-[color:var(--app-muted)]">
          Move candidates here to keep them warm for future roles without cluttering the active pipeline.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={[
        {
          header: "Candidate",
          width: "w-[28%]",
          render: (c) => (
            <div className="space-y-0.5">
              <Link
                href={`${profileBasePath}/${c.id}` as Route}
                className="text-sm font-medium text-[color:var(--app-heading)] hover:text-[color:var(--app-brand)]"
              >
                {c.fullName}
              </Link>
              <p className="text-xs text-[color:var(--app-muted)]">{c.email}</p>
            </div>
          ),
        },
        {
          header: "Last stage",
          width: "w-[16%]",
          render: (c) => (
            <StatusPill label={getCandidateStageLabel(c.stage)} tone="neutral" />
          ),
        },
        {
          header: "Position",
          width: "w-[22%]",
          render: (c) => (
            <p className="text-sm text-[color:var(--app-muted)] truncate" title={c.positionAppliedFor ?? undefined}>{c.positionAppliedFor ?? "—"}</p>
          ),
        },
        {
          header: "In pool",
          width: "w-[12%]",
          render: (c) => (
            <p className="text-sm text-[color:var(--app-muted)]">{daysAgo(c.updatedAt)}d</p>
          ),
        },
        {
          header: "Actions",
          width: "w-[22%]",
          render: (c) =>
            canManage ? (
              <TalentPoolActions candidateId={c.id} candidateName={c.fullName} />
            ) : null,
        },
      ]}
      data={candidates}
      emptyMessage="No candidates in pool."
    />
  );
}
