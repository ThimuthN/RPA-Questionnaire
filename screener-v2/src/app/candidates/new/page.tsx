import Link from "next/link";
import type { Route } from "next";
import { NewCandidateForm } from "@/components/candidates/NewCandidateForm";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { listDepartments } from "@/lib/db/departments";

export default async function NewCandidatePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; existingId?: string; existingName?: string; existingEmail?: string }>;
}) {
  await requirePageSession("/candidates/new");

  const params = await searchParams;
  const departments = await listDepartments();

  return (
    <SceneShell
      variant="create"
      eyebrow="Candidates"
      title="Register candidate"
      subtitle="Add the basics first."
      utility={
        <Link href={"/candidates" as Route}>
          <Button variant="secondary">Back</Button>
        </Link>
      }
    >
      <div className="max-w-2xl">
        <StagePanel className="space-y-5">
          {params.existingId ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              style={{ background: "var(--app-modal-overlay)" }}
            >
              <div
                className="w-full max-w-lg rounded-[28px] border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  background: "var(--app-modal-surface)",
                  boxShadow: "var(--app-modal-shadow)"
                }}
              >
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--app-warning)]">Email already used</p>
                  <h2 className="text-2xl text-[color:var(--app-heading)]">This candidate already exists</h2>
                  <p className="text-sm leading-6 text-[color:var(--app-text)]">
                    {params.existingName || "An existing candidate"} is already registered with{" "}
                    <span className="text-[color:var(--app-heading)]">{params.existingEmail || "this email"}</span>.
                  </p>
                  <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-sm text-[color:var(--app-text)]">
                    Use the existing record instead of creating a duplicate entry.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/candidates/${params.existingId}` as Route}>
                      <Button>Open existing candidate</Button>
                    </Link>
                    <Link href={"/candidates" as Route}>
                      <Button variant="secondary">Back to candidates</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <NewCandidateForm
            departments={departments.map((department) => ({ id: department.id, name: department.name }))}
            error={!params.existingId ? params.error : undefined}
          />
        </StagePanel>
      </div>
    </SceneShell>
  );
}
