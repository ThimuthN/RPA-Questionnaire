"use client";

import { useState } from "react";
import { Edit2 } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { AssignmentModal } from "./AssignmentModal";

type Assignment = {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  assignmentRole: string;
  isPrimary: boolean;
  source?: "template" | "manual" | "job_default";
};

type User = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  mode: "application" | "candidacy";
  entityId: string;
  assignments: Assignment[];
  users: User[];
  canEdit: boolean;
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  reviewer: "Reviewer",
  final_approver: "Final Approver",
  coordinator: "Coordinator",
  approver: "Approver"
};

const sourceLabels: Record<NonNullable<Assignment["source"]>, string> = {
  manual: "Manual",
  template: "Template",
  job_default: "Job default"
};

function groupAssignmentsByRole(assignments: Assignment[]) {
  const grouped: Record<string, Assignment[]> = {};
  for (const assignment of assignments) {
    const role = assignment.assignmentRole;
    if (!grouped[role]) {
      grouped[role] = [];
    }
    grouped[role].push(assignment);
  }
  return grouped;
}

export function ResponsibleTeamCard({ mode, entityId, assignments, users, canEdit }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const grouped = groupAssignmentsByRole(assignments);
  const isEmpty = assignments.length === 0;
  const allowEditing = canEdit && mode === "application";

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl text-[color:var(--app-heading)]">Responsible team</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              {mode === "application"
                ? "Hiring team members assigned to this application."
                : "Hiring team members assigned to this department candidacy."}
            </p>
          </div>
          {allowEditing ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg p-2 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)]"
              aria-label="Edit team"
              type="button"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
          {isEmpty ? (
            <p className="text-sm text-[color:var(--app-muted)]">No team members assigned yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([role, roleAssignments]) => (
                <div key={role} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">
                    {roleLabels[role] || role}
                  </p>
                  <div className="space-y-2">
                    {roleAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex flex-wrap items-center gap-2 rounded-[12px] bg-[color:var(--app-surface)] p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">
                            {assignment.user.name || assignment.user.email}
                          </p>
                          <p className="text-xs text-[color:var(--app-muted)]">{assignment.user.email}</p>
                        </div>
                        <StatusPill label={roleLabels[assignment.assignmentRole] || assignment.assignmentRole} tone="neutral" />
                        {assignment.source ? (
                          <StatusPill label={sourceLabels[assignment.source]} tone="blue" />
                        ) : null}
                        {assignment.isPrimary ? <StatusPill label="Primary owner" tone="emerald" /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AssignmentModal
        isOpen={isModalOpen && allowEditing}
        title="Edit responsible team"
        users={users}
        currentAssignments={assignments}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (nextAssignments) => {
          const response = await fetch(`/api/candidate-applications/${entityId}/assignments`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "replace_role",
              assignments: nextAssignments.map((assignment) => ({
                userId: assignment.userId!,
                assignmentRole: assignment.role,
                isPrimary: assignment.isPrimary
              }))
            })
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to update");
          }
          setIsModalOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}
