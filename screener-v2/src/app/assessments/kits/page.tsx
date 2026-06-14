import Link from "next/link";
import type { Route } from "next";
import { requirePageSession } from "@/lib/auth/guards";
import { listInterviewKits } from "@/lib/db/interview-kits";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { DataTable } from "@/components/primitives/DataTable";
import { StatusPill } from "@/components/primitives/StatusPill";

export const dynamic = "force-dynamic";

export default async function InterviewKitsPage() {
  const session = await requirePageSession("/assessments/kits");
  const canManage = session.permissions.includes("manage_addons");
  const kits = await listInterviewKits();

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Assessments"
      title="Interview kits"
      subtitle="Scorecard templates with competencies and behavioral anchors for structured interviews."
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[color:var(--app-muted)]">{kits.length} kit{kits.length !== 1 ? "s" : ""}</p>
          {canManage ? (
            <Link href={"/assessments/kits/new" as Route}>
              <Button>New kit</Button>
            </Link>
          ) : null}
        </div>

        {kits.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-[color:var(--app-border)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[color:var(--app-heading)]">No interview kits yet</p>
            <p className="mt-1 text-sm text-[color:var(--app-muted)]">
              Create kits to standardize interviews with structured competency rubrics.
            </p>
            {canManage ? (
              <div className="mt-4">
                <Link href={"/assessments/kits/new" as Route}>
                  <Button>Create first kit</Button>
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <DataTable
            columns={[
              {
                header: "Title",
                width: "w-[32%]",
                render: (kit) => (
                  <Link href={`/assessments/kits/${kit.id}` as Route} className="text-sm font-medium text-[color:var(--app-heading)] hover:text-[color:var(--app-brand)]">
                    {kit.title}
                  </Link>
                ),
              },
              {
                header: "Scope",
                width: "w-[14%]",
                render: (kit) => (
                  <StatusPill
                    label={kit.isGlobal ? "Global" : "Department"}
                    tone={kit.isGlobal ? "blue" : "neutral"}
                  />
                ),
              },
              {
                header: "Competencies",
                width: "w-[16%]",
                render: (kit) => (
                  <span className="text-sm text-[color:var(--app-text)]">{kit.competencyCount}</span>
                ),
              },
              {
                header: "Description",
                width: "w-[28%]",
                render: (kit) => (
                  <p className="text-sm text-[color:var(--app-muted)] truncate">{kit.description ?? "—"}</p>
                ),
              },
              {
                header: "",
                width: "w-[10%]",
                render: (kit) =>
                  canManage ? (
                    <Link href={`/assessments/kits/${kit.id}` as Route}>
                      <Button type="button" variant="secondary">Edit</Button>
                    </Link>
                  ) : null,
              },
            ]}
            data={kits}
            emptyMessage="No kits found."
          />
        )}
      </div>
    </SceneShell>
  );
}
