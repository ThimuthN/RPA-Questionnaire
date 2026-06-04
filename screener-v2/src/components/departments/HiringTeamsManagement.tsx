"use client";

import Link from "next/link";
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
}

const roleLabels: Record<HiringTeamRole, string> = {
  owner: "Owner",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  reviewer: "Reviewer",
  final_approver: "Final Approver"
};

const allRoles: HiringTeamRole[] = ["owner", "recruiter", "hiring_manager", "interviewer", "reviewer", "final_approver"];

function sortTemplateMembers(members: TemplateWithMembers["members"]) {
  return [...members].sort((left, right) => {
    if (left.role === right.role) {
      return (left.user.name || left.user.email).localeCompare(right.user.name || right.user.email);
    }
    return allRoles.indexOf(left.role) - allRoles.indexOf(right.role);
  });
}

export function HiringTeamsManagement({ departmentId, departmentName, templates, teamUsers }: Props) {
  const [templateList, setTemplateList] = useState<TemplateWithMembers[]>(templates);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState<string | null>(null);
  const [selectedMemberUserId, setSelectedMemberUserId] = useState<string>("");
  const [selectedMemberRole, setSelectedMemberRole] = useState<HiringTeamRole>("recruiter");
  const [error, setError] = useState("");

  const resetMemberForm = () => {
    setSelectedMemberUserId("");
    setSelectedMemberRole("recruiter");
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/departments/${departmentId}/hiring-teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDesc
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        template?: TemplateWithMembers;
      };

      if (!response.ok || data.ok === false || !data.template) {
        throw new Error(data.message || "Failed to create template");
      }

      const createdTemplate = data.template;
      setTemplateList((current) => [
        ...current,
        {
          ...createdTemplate,
          members: sortTemplateMembers(createdTemplate.members)
        }
      ]);
      setNewTemplateName("");
      setNewTemplateDesc("");
      setShowCreateForm(false);
      setShowAddMemberForm(createdTemplate.id);
      resetMemberForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Delete this hiring team template?")) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/departments/${departmentId}/hiring-teams/${templateId}`, {
        method: "DELETE"
      });

      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "Failed to delete template");
      }

      setTemplateList((current) => current.filter((template) => template.id !== templateId));
      if (showAddMemberForm === templateId) {
        setShowAddMemberForm(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (templateId: string) => {
    if (!selectedMemberUserId) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/departments/${departmentId}/hiring-teams/${templateId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMemberUserId,
          role: selectedMemberRole
        })
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        member?: TemplateWithMembers["members"][number];
      };

      if (!response.ok || data.ok === false || !data.member) {
        throw new Error(data.message || "Failed to add member");
      }

      setTemplateList((current) =>
        current.map((template) =>
          template.id === templateId
            ? {
                ...template,
                members: sortTemplateMembers([...template.members, data.member!])
              }
            : template
        )
      );
      resetMemberForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (templateId: string, userId: string, role: HiringTeamRole) => {
    if (!confirm("Remove this team member?")) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/departments/${departmentId}/hiring-teams/${templateId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role
        })
      });

      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "Failed to remove member");
      }

      setTemplateList((current) =>
        current.map((template) =>
          template.id === templateId
            ? {
                ...template,
                members: template.members.filter((member) => !(member.user.id === userId && member.role === role))
              }
            : template
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">Hiring Team Templates</h3>
          <p className="text-sm text-[color:var(--app-muted)]">
            Reusable hiring team setups for {departmentName} candidate registration.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm((current) => !current)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {error ? (
        <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>
      ) : null}

      {teamUsers.length === 0 ? (
        <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">Add workspace team members first</p>
          <p className="mt-1 text-sm text-[color:var(--app-muted)]">
            Hiring team templates pull from active department access grants. Add team members on the{" "}
            <Link href={`/departments/${departmentId}/users`} className="text-brand-500 hover:text-brand-600">
              Team page
            </Link>
            .
          </p>
        </div>
      ) : null}

      {showCreateForm ? (
        <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-[color:var(--app-text)]">Template name</span>
            <input
              type="text"
              value={newTemplateName}
              onChange={(event) => setNewTemplateName(event.target.value)}
              placeholder="e.g. Standard Tech Pipeline"
              disabled={loading}
              className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-[color:var(--app-text)]">Description (optional)</span>
            <textarea
              value={newTemplateDesc}
              onChange={(event) => setNewTemplateDesc(event.target.value)}
              placeholder="What this team setup is for."
              rows={2}
              disabled={loading}
              className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)]"
            />
          </label>
          <div className="flex gap-2">
            <Button onClick={handleCreateTemplate} disabled={!newTemplateName.trim() || loading}>
              {loading ? "Creating..." : "Create template"}
            </Button>
            <Button variant="secondary" onClick={() => setShowCreateForm(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {templateList.length === 0 ? (
          <p className="py-6 text-center text-sm text-[color:var(--app-muted)]">
            No hiring team templates yet. Create one and add members immediately.
          </p>
        ) : (
          templateList.map((template) => {
            const hasOwner = template.members.some((member) => member.role === "owner");

            return (
              <div
                key={template.id}
                className="space-y-3 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-[color:var(--app-heading)]">{template.name}</h4>
                      {hasOwner ? (
                        <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600">Ready to use</span>
                      ) : (
                        <span className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-700">Needs an owner</span>
                      )}
                    </div>
                    {template.description ? (
                      <p className="text-xs text-[color:var(--app-muted)]">{template.description}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={loading}
                    className="rounded-lg p-1.5 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface)] disabled:opacity-50"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {template.members.length === 0 ? (
                  <p className="text-xs text-[color:var(--app-muted)]">No team members added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {template.members.map((member) => (
                      <div
                        key={`${member.user.id}-${member.role}`}
                        className="flex items-center justify-between rounded-[10px] bg-[color:var(--app-surface)] p-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-[color:var(--app-heading)]">{member.user.name || member.user.email}</p>
                          <p className="text-xs text-[color:var(--app-muted)]">{roleLabels[member.role]}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(template.id, member.user.id, member.role)}
                          disabled={loading}
                          className="rounded p-1 text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)] disabled:opacity-50"
                          type="button"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {teamUsers.length > 0 ? (
                  <div className="border-t border-[color:var(--app-border)] pt-2">
                    {showAddMemberForm === template.id ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-[color:var(--app-text)]">Select team member</label>
                        <select
                          value={selectedMemberUserId}
                          onChange={(event) => setSelectedMemberUserId(event.target.value)}
                          disabled={loading}
                          className="w-full rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-2 py-1.5 text-xs text-[color:var(--app-text)]"
                        >
                          <option value="">Choose a team member</option>
                          {teamUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.email}
                            </option>
                          ))}
                        </select>
                        <label className="mt-2 block text-xs font-medium text-[color:var(--app-text)]">Hiring responsibility</label>
                        <select
                          value={selectedMemberRole}
                          onChange={(event) => setSelectedMemberRole(event.target.value as HiringTeamRole)}
                          disabled={loading}
                          className="w-full rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-2 py-1.5 text-xs text-[color:var(--app-text)]"
                        >
                          {allRoles.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleAddMember(template.id)}
                            disabled={!selectedMemberUserId || loading}
                            className="flex-1 rounded-[10px] bg-brand-500 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                            type="button"
                          >
                            {loading ? "Adding..." : "Add member"}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddMemberForm(null);
                              resetMemberForm();
                            }}
                            disabled={loading}
                            className="flex-1 rounded-[10px] border border-[color:var(--app-border)] px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setShowAddMemberForm(template.id);
                          resetMemberForm();
                        }}
                        disabled={loading || teamUsers.length === 0}
                        className="w-full rounded p-2 text-left text-xs text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface)] disabled:opacity-50"
                        type="button"
                      >
                        + Add team member
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
