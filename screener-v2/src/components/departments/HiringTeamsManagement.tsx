"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";

type HiringTeamRole = "owner" | "recruiter" | "hiring_manager" | "interviewer" | "reviewer" | "final_approver";

interface TemplateWithMembers {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  members: Array<{
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    role: HiringTeamRole;
  }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  departmentId: string;
  departmentName: string;
  templates: TemplateWithMembers[];
  teamUsers: User[];
  onCreateTemplate?: (name: string, description: string) => void;
  onAddMember?: (templateId: string, userId: string, role: HiringTeamRole) => void;
  onRemoveMember?: (templateId: string, userId: string, role: HiringTeamRole) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

const roleLabels: Record<HiringTeamRole, string> = {
  owner: "Owner",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  reviewer: "Reviewer",
  final_approver: "Final Approver"
};

export function HiringTeamsManagement({
  departmentId,
  departmentName,
  templates,
  teamUsers,
  onCreateTemplate,
  onAddMember,
  onRemoveMember,
  onDeleteTemplate
}: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  const handleCreateTemplate = () => {
    if (newTemplateName.trim() && onCreateTemplate) {
      onCreateTemplate(newTemplateName, newTemplateDesc);
      setNewTemplateName("");
      setNewTemplateDesc("");
      setShowCreateForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">Hiring Team Templates</h3>
          <p className="text-sm text-[color:var(--app-muted)]">Reusable team setups for candidate registration</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 space-y-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-[color:var(--app-text)]">Template Name</span>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g., Standard Tech Pipeline"
              className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-[color:var(--app-text)]">Description (optional)</span>
            <textarea
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
              placeholder="Description..."
              rows={2}
              className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)]"
            />
          </label>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim()}
            >
              Create
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-sm text-[color:var(--app-muted)] py-6 text-center">
            No hiring team templates yet. Create one to get started.
          </p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-[color:var(--app-heading)]">{template.name}</h4>
                  {template.description && (
                    <p className="text-xs text-[color:var(--app-muted)]">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDeleteTemplate?.(template.id)}
                    className="p-1.5 hover:bg-[color:var(--app-surface)] rounded-lg text-[color:var(--app-muted)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {template.members.length === 0 ? (
                <p className="text-xs text-[color:var(--app-muted)]">No team members added yet</p>
              ) : (
                <div className="space-y-2">
                  {template.members.map((member) => (
                    <div
                      key={`${member.user.id}-${member.role}`}
                      className="flex items-center justify-between text-sm bg-[color:var(--app-surface)] rounded-[10px] p-2"
                    >
                      <div>
                        <p className="font-medium text-[color:var(--app-heading)]">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-xs text-[color:var(--app-muted)]">{roleLabels[member.role]}</p>
                      </div>
                      <button
                        onClick={() =>
                          onRemoveMember?.(template.id, member.user.id, member.role)
                        }
                        className="p-1 hover:bg-[color:var(--app-surface-soft)] rounded text-[color:var(--app-muted)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {teamUsers.length > 0 && (
                <details className="text-sm border-t border-[color:var(--app-border)] pt-2">
                  <summary className="cursor-pointer text-[color:var(--app-text)] hover:text-[color:var(--app-heading)]">
                    + Add team member
                  </summary>
                  <div className="mt-2 space-y-2">
                    {teamUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          // This would open a role selector dialog
                          // For now, just show that we can add
                        }}
                        className="w-full text-left text-xs p-2 rounded hover:bg-[color:var(--app-surface)] text-[color:var(--app-text)]"
                      >
                        {user.name || user.email}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
