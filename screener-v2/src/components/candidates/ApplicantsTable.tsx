"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { AssignmentModal } from "./AssignmentModal";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
import { candidateApplicationStatusLabels } from "@/lib/jobs/types";

type TeamEntry = { name: string; role: string };

type ApplicantRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  roleLabel?: string | null;
  appliedAt: string;
  updatedAt: string;
  hasResume: boolean;
  status: CandidateApplicationStatus;
  candidateOwner?: string | null;
  source?: string | null;
  teamAssignments?: TeamEntry[];
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

function nextStepLabel(status: CandidateApplicationStatus) {
  if (status === "submitted") return "Start review";
  if (status === "under_review") return "Continue review";
  if (status === "moved_to_pipeline") return "Open record";
  return "Review details";
}

function statusHint(status: CandidateApplicationStatus) {
  if (status === "submitted") return "Needs first pass";
  if (status === "under_review") return "Awaiting decision";
  if (status === "moved_to_pipeline") return "Candidate created";
  return "Closed application";
}

const SOURCE_LABELS: Record<string, string> = {
  direct: "Direct",
  referral: "Referral",
  job_board: "Job board",
  linkedin: "LinkedIn",
  careers_page: "Careers page",
};

function sourceLabel(source: string | null | undefined): string | null {
  if (!source) return null;
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}

function dayLabel(isoDate: string, prefix?: string) {
  const diff = Date.now() - Date.parse(isoDate);
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const base = days === 0 ? "Today" : `${days}d ago`;
  return prefix ? `${prefix} ${base.toLowerCase()}` : base;
}

export function ApplicantsTable({
  rows,
  users,
  scope = "global",
  departmentId
}: Props) {
  const router = useRouter();
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
      <div className="overflow-hidden rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-[var(--app-shadow-soft)]">
        {hasSelections && (
          <div className="flex items-center justify-between border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-2.5">
            <p className="text-sm font-medium text-[color:var(--app-text)]">
              {selectedIds.length} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 text-xs"
              >
                Assign team
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
        <table className="w-full table-fixed text-left">
          <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[11px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
            <tr>
              <th scope="col" className="w-10 px-3 py-2.5 font-medium">
                <input
                  type="checkbox"
                  checked={selectedIds.length === rows.length && rows.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 cursor-pointer rounded border-[color:var(--app-border-strong)]"
                  aria-label="Select all applicants"
                />
              </th>
              <th scope="col" className="px-3 py-2.5 font-medium">Person</th>
              <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Position</th>
              <th scope="col" className="hidden w-[110px] px-3 py-2.5 font-medium lg:table-cell">Applied</th>
              <th scope="col" className="w-[96px] px-3 py-2.5 font-medium">Resume</th>
              <th scope="col" className="w-[130px] px-3 py-2.5 font-medium">Status</th>
              <th scope="col" className="hidden w-[140px] px-3 py-2.5 font-medium xl:table-cell">Assigned</th>
              <th scope="col" className="w-[120px] px-3 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[color:var(--app-border)] align-middle transition hover:bg-[color:var(--app-surface-soft)]">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                    className="h-4 w-4 cursor-pointer rounded border-[color:var(--app-border-strong)]"
                    aria-label={`Select ${row.candidateName}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[color:var(--app-heading)]" title={row.candidateName}>{row.candidateName}</p>
                    <p className="truncate text-xs text-[color:var(--app-muted)]" title={row.candidateEmail}>{row.candidateEmail}</p>
                  </div>
                </td>
                <td className="hidden px-3 py-3 md:table-cell">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[color:var(--app-text)]" title={row.jobTitle}>{row.jobTitle}</p>
                    <p className="truncate text-xs text-[color:var(--app-muted)]" title={row.roleLabel || sourceLabel(row.source) || ""}>
                      {row.roleLabel || sourceLabel(row.source) || "No role linked"}
                    </p>
                  </div>
                </td>
                <td className="hidden px-3 py-3 lg:table-cell">
                  <span className="whitespace-nowrap text-sm text-[color:var(--app-text)]" title={dayLabel(row.updatedAt, "Updated")}>
                    {dayLabel(row.appliedAt)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <StatusPill label={row.hasResume ? "Attached" : "Missing"} tone={row.hasResume ? "emerald" : "amber"} />
                </td>
                <td className="px-3 py-3">
                  <span title={statusHint(row.status)}>
                    <StatusPill label={candidateApplicationStatusLabels[row.status]} tone={statusTone(row.status)} />
                  </span>
                </td>
                <td className="hidden px-3 py-3 xl:table-cell">
                  {row.teamAssignments && row.teamAssignments.length > 0 ? (
                    <p
                      className="truncate text-sm text-[color:var(--app-text)]"
                      title={row.teamAssignments.map((a) => `${a.name} (${a.role.replace(/_/g, " ")})`).join(", ")}
                    >
                      {row.teamAssignments[0]!.name}
                      {row.teamAssignments.length > 1 ? (
                        <span className="ml-1 text-[10px] text-[color:var(--app-muted)]">+{row.teamAssignments.length - 1}</span>
                      ) : null}
                    </p>
                  ) : (
                    <span className="text-sm text-[color:var(--app-muted)]">Unassigned</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <Link href={reviewHref(row.id)} className="inline-block">
                    <Button type="button" variant="secondary" className="whitespace-nowrap px-3 py-1.5 text-xs">
                      {nextStepLabel(row.status)}
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssignmentModal
        isOpen={isModalOpen}
        title="Assign hiring team"
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
          router.refresh();
        }}
      />
    </>
  );
}
