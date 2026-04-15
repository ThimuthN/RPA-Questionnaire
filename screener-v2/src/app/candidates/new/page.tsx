import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { RolePicker } from "@/components/roles/RolePicker";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { resumeSourceOptions } from "@/lib/candidates/types";

export default async function NewCandidatePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; existingId?: string; existingName?: string; existingEmail?: string }>;
}) {
  await requirePageSession("/candidates/new");

  const params = await searchParams;

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

          <form action="/api/candidates" method="post" className="space-y-4">
            <label className="grid gap-1">
              <span className="text-sm text-[color:var(--app-text)]">Full name</span>
              <input
                name="fullName"
                required
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-[color:var(--app-text)]">Email</span>
              <input
                name="email"
                type="email"
                required
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            <RolePicker
              name="roleId"
              label="Role"
              defaultValue={null}
              placeholder="Optional"
              helperText="Choose a saved role, or add one from Manage roles."
            />

            <div className="grid gap-2">
              <span className="text-sm text-[color:var(--app-text)]">Source</span>
              <ChoicePills
                name="resumeSource"
                idPrefix="new-candidate-source"
                defaultValue=""
                options={[
                  { value: "", label: "Skip" },
                  ...resumeSourceOptions.map((option) => ({ value: option, label: option }))
                ]}
              />
            </div>

            <label className="grid gap-1">
              <span className="text-sm text-[color:var(--app-text)]">Owner</span>
              <input
                name="hrOwner"
                placeholder="Optional"
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              />
            </label>

            {params.error && !params.existingId ? (
              <p className="text-sm text-[color:var(--app-danger)]">{params.error}</p>
            ) : null}

            <p className="text-sm text-[color:var(--app-muted)]">You can upload the resume and send the screener after this.</p>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Save candidate</Button>
              <Link href={"/candidates" as Route}>
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </StagePanel>
      </div>
    </SceneShell>
  );
}
