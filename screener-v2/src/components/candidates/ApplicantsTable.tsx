"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { AssignmentModal } from "./AssignmentModal";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
import { candidateApplicationStatusLabels } from "@/lib/jobs/types";

type ApplicantRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  roleLabel?: string | null;
  appliedAt: string;
  hasResume: boolean;
  status: CandidateApplicationStatus;
  candidateOwner?: string | null;
};

type User = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  rows: ApplicantRow[];
  users: User[];
  scope?: "global" | "department";
  departmentId?: string;
};

const assignmentRoleLabels = {
  owner: "Owner",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  reviewer: "Reviewer",
  final_approver: "Final Approver",
  coordinator: "Coordinator",
  approver: "Approver"
} as const;

const applicationAssignmentRoles = [
  "recruiter",
  "hiring_manager",
  "interviewer",
  "reviewer",
  "coordinator",
  "approver"
] as const;

function statusTone(status: CandidateApplicationStatus): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "submitted") return "neutral";
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  return "blue";
}

export function ApplicantsTable({
  rows,
  users,
  scope = "global",
  departmentId
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(rows.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const hasSelections = selectedIds.length > 0;

  function reviewHref(applicationId: string) {
    return scope === "department" && departmentId
      ? (`/departments/${departmentId}/applicants/${applicationId}` as Route)
      : (`/people/candidates/applicants/${applicationId}` as Route);
  }

  return (
    <>
      <div className="overflow-hidden rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)]">
        {hasSelections && (
          <div className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-[color:var(--app-text)]">
              {selectedIds.length} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-2 text-xs"
              >
                Assign team
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="px-3 py-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full table-fixed text-left">
            <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-xs uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
              <tr>
                <th scope="col" className="w-[4%] px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === rows.length && rows.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    aria-label="Select all applicants"
                  />
                </th>
                <th scope="col" className="w-[22%] px-4 py-3 font-medium">Person</th>
                <th scope="col" className="w-[20%] px-4 py-3 font-medium">Applied job</th>
                <th scope="col" className="w-[12%] px-4 py-3 font-medium">Applied</th>
                <th scope="col" className="w-[10%] px-4 py-3 font-medium">Resume</th>
                <th scope="col" className="w-[12%] px-4 py-3 font-medium">Status</th>
                <th scope="col" className="w-[10%] px-4 py-3 font-medium">Owner</th>
                <th scope="col" className="w-[10%] px-4 py-3 font-medium text-right">Next step</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-surface-soft)]/70">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      aria-label={`Select ${row.candidateName}`}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">{row.candidateName}</p>
                      <p className="text-xs text-[color:var(--app-muted)]">{row.candidateEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">{row.jobTitle}</p>
                      <p className="text-xs text-[color:var(--app-muted)]">{row.roleLabel || "No role linked"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[color:var(--app-text)]">{new Date(row.appliedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <StatusPill label={row.hasResume ? "Attached" : "Missing"} tone={row.hasResume ? "emerald" : "amber"} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill label={candidateApplicationStatusLabels[row.status]} tone={statusTone(row.status)} />
                  </td>
                  <td className="px-4 py-4 text-sm text-[color:var(--app-text)]">{row.candidateOwner || "Unassigned"}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={reviewHref(row.id)}>
                        <Button type="button" className="px-3 py-2 text-xs">
                          Review application
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AssignmentModal
        isOpen={isModalOpen}
        title="Assign responsible team"
        description={`${selectedIds.length} applications selected`}
        users={users}
        availableRoles={[...applicationAssignmentRoles]}
        roleLabels={assignmentRoleLabels}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (assignments) => {
          const res = await fetch("/api/candidate-applications/assignments/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              applicationIds: selectedIds,
              mode: "add",
              assignments: assignments.map((a) => ({
                userId: a.userId!,
                assignmentRole: a.role,
                isPrimary: a.isPrimary
              }))
            })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to assign");
          }
          setIsModalOpen(false);
          setSelectedIds([]);
          window.location.reload();
        }}
      />
    </>
  );
}
