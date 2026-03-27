"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { RolePicker, type RolePickerOption } from "@/components/roles/RolePicker";
import { resumeSourceOptions, type CandidateUiStatus } from "@/lib/candidates/types";
import type { CandidateDetail } from "@/lib/db/candidates";

export function EditCandidateInfoModal({
  candidate,
  uiStatus
}: {
  candidate: CandidateDetail;
  uiStatus: CandidateUiStatus;
}) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RolePickerOption | null>(
    candidate.roleId && candidate.roleLabel
      ? {
          id: candidate.roleId,
          label: candidate.roleLabel,
          department: undefined,
          coreBasisRoleId: (candidate.coreBasisRoleId ?? "Associate")
        }
      : null
  );

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Edit info
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(22,27,40,0.98),rgba(14,19,30,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl text-white">Edit info</h3>
                <p className="text-sm text-slate-300">Keep the basics up to date.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <form action={`/api/candidates/${candidate.id}`} method="post" className="mt-5 space-y-4">
              <input type="hidden" name="uiStatus" value={uiStatus} />
              <input type="hidden" name="phone" value={candidate.phone || ""} />
              <input type="hidden" name="batchId" value={candidate.batchId || ""} />
              <input type="hidden" name="notesSummary" value={candidate.notesSummary || ""} />
              <input type="hidden" name="positionAppliedFor" value={selectedRole?.label || ""} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Full name</span>
                  <input
                    name="fullName"
                    defaultValue={candidate.fullName}
                    required
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Email</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={candidate.email}
                    required
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>

                <RolePicker
                  name="roleId"
                  label="Role"
                  value={selectedRole}
                  onChange={setSelectedRole}
                  placeholder="Optional"
                  helperText="Choose a saved role, or update the catalog from Manage roles."
                  layout="stacked"
                  className="grid gap-1"
                />

                <label className="grid gap-1">
                  <span className="text-sm text-slate-200">Owner</span>
                  <input
                    name="hrOwner"
                    defaultValue={candidate.hrOwner || ""}
                    className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                  />
                </label>
              </div>

              <div className="grid gap-2">
                <span className="text-sm text-slate-200">Source</span>
                <ChoicePills
                  name="resumeSource"
                  idPrefix={`candidate-source-${candidate.id}`}
                  defaultValue={candidate.resumeSource || ""}
                  options={[
                    { value: "", label: "None" },
                    ...resumeSourceOptions.map((option) => ({ value: option, label: option }))
                  ]}
                />
              </div>

              <label className="grid gap-1">
                <span className="text-sm text-slate-200">Folder link</span>
                <input
                  name="candidateFolderUrl"
                  defaultValue={candidate.candidateFolderUrl || ""}
                  placeholder="https://..."
                  className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
