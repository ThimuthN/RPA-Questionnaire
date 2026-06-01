import Link from "next/link";
import { DataTable } from "@/components/primitives/DataTable";
import { getDepartment } from "@/lib/db/departments";
import { listCandidateWorkspacePage } from "@/lib/db/candidates";
import { candidateStageValues, type CandidateStage } from "@/lib/candidates/types";
import { notFound } from "next/navigation";

type PageState = {
  q?: string;
  roleId?: string;
  stage?: string;
  page?: string;
  pageSize?: string;
};

function filterFieldClassName() {
  return "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";
}

export default async function DepartmentCandidatesPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PageState>;
}) {
  const { id } = await params;
  const pageState = await searchParams;

  const department = await getDepartment(id);
  if (!department) {
    notFound();
  }

  const selectedStage = candidateStageValues.includes(pageState.stage as CandidateStage)
    ? (pageState.stage as CandidateStage)
    : "pipeline";

  const page = await listCandidateWorkspacePage({
    q: pageState.q?.trim() || undefined,
    roleId: pageState.roleId?.trim() || undefined,
    departmentId: id,
    stage: selectedStage,
    stageValues: selectedStage === "pipeline" ? ["pipeline", "applicant"] : undefined,
    orgStage: "active",
    sort: "inbox",
    page: Number(pageState.page ?? 1),
    pageSize: Number(pageState.pageSize ?? 12)
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Candidates</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Track pipeline progress and manage candidate records.
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { stage: "pipeline", label: "Pipeline" },
          { stage: "screening", label: "Screening" },
          { stage: "interview", label: "Interview" },
          { stage: "advanced_review", label: "Advanced Review" },
          { stage: "finalized", label: "Finalized" }
        ].map(({ stage, label }) => (
          <a
            key={stage}
            href={`?stage=${stage}`}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              selectedStage === stage
                ? "bg-[color:var(--app-brand)] text-white"
                : "bg-[color:var(--app-surface)] text-[color:var(--app-text)] hover:bg-[color:var(--app-surface-strong)]"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <form className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_auto]">
        <input type="hidden" name="pageSize" value={pageState.pageSize ?? String(page.pageSize)} />
        <input
          name="q"
          defaultValue={pageState.q ?? ""}
          placeholder="Search candidate, email"
          className={filterFieldClassName()}
        />
        <select
          name="roleId"
          defaultValue={pageState.roleId ?? ""}
          className={filterFieldClassName()}
        >
          <option value="">All designations</option>
          {page.roleOptions.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </form>

      {page.rows.length === 0 ? (
        <div className="rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 text-center text-sm text-[color:var(--app-muted)]">
          No candidates in this stage yet.
        </div>
      ) : (
        <DataTable
          columns={[
            {
              header: "Candidate",
              width: "w-[30%]",
              render: (row) => (
                <Link href={`/people/candidates/${row.id}`} className="text-[color:var(--app-brand)] hover:underline">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{row.fullName}</p>
                    <p className="text-xs text-[color:var(--app-muted)]">{row.email}</p>
                  </div>
                </Link>
              )
            },
            {
              header: "Stage",
              width: "w-[15%]",
              render: (row) => <p className="text-sm capitalize text-[color:var(--app-text)]">{row.stage}</p>
            },
            {
              header: "Designation",
              width: "w-[20%]",
              render: (row) => <p className="text-sm text-[color:var(--app-text)]">{row.roleLabel || "—"}</p>
            }
          ]}
          data={page.rows}
          emptyMessage="No candidates in this stage."
        />
      )}
    </div>
  );
}
