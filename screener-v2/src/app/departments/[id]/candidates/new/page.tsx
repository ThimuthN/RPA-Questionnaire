import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { NewCandidateForm } from "@/components/candidates/NewCandidateForm";
import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { getDepartment, listDepartments } from "@/lib/db/departments";

export default async function DepartmentNewCandidatePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    existingId?: string;
    existingName?: string;
    existingEmail?: string;
  }>;
}) {
  const { id } = await params;
  const pageState = await searchParams;

  await requirePageSession(`/departments/${id}/candidates/new`);

  const [department, departments] = await Promise.all([getDepartment(id), listDepartments()]);

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl text-[color:var(--app-heading)]">Add candidate</h2>
          <p className="text-sm text-[color:var(--app-muted)]">Fill in the basics to create a candidate record.</p>
        </div>
        <Link href={`/departments/${id}/candidates` as Route}>
          <Button variant="secondary">Back</Button>
        </Link>
      </div>
      <div className="max-w-2xl">
        <StagePanel tone="flat" className="space-y-5">
          {pageState.existingId ? (
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
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--app-warning)]">
                    Email already used
                  </p>
                  <h2 className="text-2xl text-[color:var(--app-heading)]">This candidate already exists</h2>
                  <p className="text-sm leading-6 text-[color:var(--app-text)]">
                    {pageState.existingName || "An existing candidate"} is already registered with{" "}
                    <span className="text-[color:var(--app-heading)]">
                      {pageState.existingEmail || "this email"}
                    </span>
                    .
                  </p>
                  <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-sm text-[color:var(--app-text)]">
                    Use the existing record instead of creating a duplicate entry.
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/people/candidates/${pageState.existingId}` as Route}>
                      <Button>Open existing candidate</Button>
                    </Link>
                    <Link href={`/departments/${id}/candidates` as Route}>
                      <Button variant="secondary">Back to candidates</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <NewCandidateForm
            departments={departments.map((dept) => ({ id: dept.id, name: dept.name }))}
            error={!pageState.existingId ? pageState.error : undefined}
            defaultDepartmentId={id}
            returnTo={`/departments/${id}/candidates`}
          />
        </StagePanel>
      </div>
    </div>
  );
}
