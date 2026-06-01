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
};

type User = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  applicationId: string;
  assignments: Assignment[];
  users: User[];
  canEdit: boolean;
};

const roleLabels: Record<string, string> = {
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  reviewer: "Reviewer",
  coordinator: "Coordinator",
  approver: "Approver"
};

function groupAssignmentsByRole(assignments: Assignment[]) {
  const grouped: Record<string, Assignment[]> = {};
  for (const assignment of assignments) {
    if (!grouped[assignment.assignmentRole]) {
      grouped[assignment.assignmentRole] = [];
    }
    grouped[assignment.assignmentRole].push(assignment);
  }
  return grouped;
}

export function ResponsibleTeamCard({ applicationId, assignments, users, canEdit }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const grouped = groupAssignmentsByRole(assignments);
  const isEmpty = assignments.length === 0;

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl text-[color:var(--app-heading)]">Responsible team</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Hiring team members assigned to this application.</p>
          </div>
          {canEdit && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-[color:var(--app-surface-soft)] rounded-lg transition text-[color:var(--app-muted)]"
              aria-label="Edit team"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          )}
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
                        {assignment.isPrimary && (
                          <StatusPill label="Primary" tone="blue" />
                        )}
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
        isOpen={isModalOpen && canEdit}
        title="Edit responsible team"
        users={users}
        currentAssignments={assignments}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (assignments) => {
          const res = await fetch(`/api/candidate-applications/${applicationId}/assignments`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "replace_role",
              assignments: assignments.map((a) => ({
                userId: a.userId!,
                assignmentRole: a.role,
                isPrimary: a.isPrimary
              }))
            })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to update");
          }
          setIsModalOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}
