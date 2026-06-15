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
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[color:var(--app-heading)]">Hiring team</h2>
          {allowEditing ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-[10px] p-1.5 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
              aria-label="Edit hiring team"
              type="button"
            >
              <Edit2 size={14} />
            </button>
          ) : null}
        </div>

        {/* Template picker — compact inline row */}
        {allowEditing && hasTemplates ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="flex-1 min-w-0 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] outline-none focus:border-brand-300/60"
              >
                <option value="">Select hiring team template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={applyTemplate}
                disabled={isApplyingTemplate || !selectedTemplateId}
              >
                {isApplyingTemplate ? "Applying…" : "Apply"}
              </Button>
            </div>
            {templateError ? (
              <p className="text-xs text-[color:var(--app-danger)]">{templateError}</p>
            ) : null}
          </div>
        ) : null}

        {/* Members list */}
        {isEmpty ? (
          <p className="text-sm text-[color:var(--app-muted)]">
            No team members assigned.{" "}
            {allowEditing ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="font-medium text-[color:var(--app-brand)] hover:underline"
              >
                Assign manually
              </button>
            ) : null}
          </p>
        ) : (
          <div className="divide-y divide-[color:var(--app-border)]/60">
            {Object.entries(grouped).map(([role, roleAssignments]) => (
              <div key={role} className="py-3 first:pt-0 last:pb-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                  {roleLabels[role] || role}
                </p>
                <div className="space-y-2">
                  {roleAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--app-surface-soft)] text-[11px] font-semibold text-[color:var(--app-heading)]">
                        {(assignment.user.name ?? assignment.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[color:var(--app-heading)]">
                          {assignment.user.name || assignment.user.email}
                        </p>
                        {assignment.user.name ? (
                          <p className="truncate text-[11px] text-[color:var(--app-muted)]">
                            {assignment.user.email}
                          </p>
                        ) : null}
                      </div>
                      {assignment.isPrimary ? (
                        <StatusPill label={primaryLabel} tone="emerald" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
