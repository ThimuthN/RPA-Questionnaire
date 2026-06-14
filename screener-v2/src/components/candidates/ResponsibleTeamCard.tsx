"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2 } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { Button } from "@/components/primitives/Button";
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

type TeamTemplate = {
  id: string;
  name: string;
  description?: string;
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    role: string;
  }>;
};

type Props = {
  mode: "application" | "candidacy";
  entityId: string;
  assignments: Assignment[];
  users: User[];
  templates?: TeamTemplate[];
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

const applicationRoles = [
  "recruiter",
  "hiring_manager",
  "interviewer",
  "reviewer",
  "coordinator",
  "approver"
] as const;

const candidacyRoles = [
  "owner",
  "recruiter",
  "hiring_manager",
  "interviewer",
  "reviewer",
  "final_approver"
] as const;

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

export function ResponsibleTeamCard({
  mode,
  entityId,
  assignments,
  users,
  templates = [],
  canEdit
}: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const grouped = groupAssignmentsByRole(assignments);
  const isEmpty = assignments.length === 0;
  const allowEditing = canEdit;
  const hasTemplates = templates.length > 0;
  const endpoint =
    mode === "application"
      ? `/api/candidate-applications/${entityId}/assignments`
      : `/api/candidacies/${entityId}/assignments`;
  const availableRoles = mode === "application" ? applicationRoles : candidacyRoles;
  const primaryLabel = mode === "application" ? "Primary owner" : "Primary";
  const introLabel = mode === "application" ? "Allocate hiring panel" : "Allocate hiring team";
  const introCopy =
    mode === "application"
      ? "Apply a department hiring team template, or edit the panel manually when you need a one-off change."
      : "Apply a department hiring team template, or edit the team manually for this candidate.";

  async function applyTemplate() {
    if (!selectedTemplateId) {
      setTemplateError("Select a hiring team template.");
      return;
    }

    setTemplateError(null);
    setIsApplyingTemplate(true);

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "apply_template",
          templateId: selectedTemplateId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to apply hiring team template");
      }

      setSelectedTemplateId("");
      router.refresh();
    } catch (error) {
      setTemplateError(error instanceof Error ? error.message : "Failed to apply hiring team template");
    } finally {
      setIsApplyingTemplate(false);
    }
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl text-[color:var(--app-heading)]">Hiring team</h2>
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

        {allowEditing ? (
          <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[color:var(--app-heading)]">{introLabel}</p>
              <p className="text-sm text-[color:var(--app-muted)]">
                {introCopy}
              </p>
            </div>

            {hasTemplates ? (
              <div className="space-y-3">
                <select
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)]"
                >
                  <option value="">Select hiring team template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.members.length} member{template.members.length === 1 ? "" : "s"})
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={applyTemplate} disabled={isApplyingTemplate} className="flex-1">
                    {isApplyingTemplate ? "Applying..." : "Apply template"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(true)} className="flex-1">
                    Customize manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-4 py-3">
                <p className="text-sm text-[color:var(--app-muted)]">
                  No department hiring team templates are available yet.
                </p>
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(true)} className="w-full">
                  Assign manually
                </Button>
              </div>
            )}

            {templateError ? (
              <div className="rounded-[16px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger)]/10 p-3 text-sm text-[color:var(--app-danger)]">
                {templateError}
              </div>
            ) : null}
          </div>
        ) : null}

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
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-sm bg-[color:var(--app-surface)] p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">
                            {assignment.user.name || assignment.user.email}
                          </p>
                          <p className="text-xs text-[color:var(--app-muted)] truncate">{assignment.user.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <StatusPill label={roleLabels[assignment.assignmentRole] || assignment.assignmentRole} tone="neutral" />
                          {assignment.source ? (
                            <StatusPill label={sourceLabels[assignment.source]} tone="blue" />
                          ) : null}
                          {assignment.isPrimary ? <StatusPill label={primaryLabel} tone="emerald" /> : null}
                        </div>
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
        title="Edit hiring team"
        availableRoles={[...availableRoles]}
        roleLabels={roleLabels as Record<
          "owner" | "recruiter" | "hiring_manager" | "interviewer" | "reviewer" | "final_approver" | "coordinator" | "approver",
          string
        >}
        users={users}
        currentAssignments={assignments}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (nextAssignments) => {
          const response = await fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              mode === "application"
                ? {
                    mode: "replace_all",
                    assignments: nextAssignments.map((assignment) => ({
                      userId: assignment.userId!,
                      assignmentRole: assignment.role,
                      isPrimary: assignment.isPrimary
                    }))
                  }
                : {
                    mode: "replace_all",
                    assignments: nextAssignments.map((assignment) => ({
                      userId: assignment.userId!,
                      role: assignment.role,
                      isPrimary: assignment.isPrimary
                    }))
                  }
            )
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to update");
          }
          setIsModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
