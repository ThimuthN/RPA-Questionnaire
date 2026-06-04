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

export function HiringTeamsManagement({
  departmentId,
  templates,
  teamUsers
}: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState<string | null>(null);
  const [selectedMemberUserId, setSelectedMemberUserId] = useState<string>("");
  const [selectedMemberRole, setSelectedMemberRole] = useState<HiringTeamRole>("recruiter");

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${departmentId}/hiring-teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDesc
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to create template");
        return;
      }

      setNewTemplateName("");
      setNewTemplateDesc("");
      setShowCreateForm(false);
      window.location.reload();
    } catch (error) {
      alert("Error creating template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Delete this hiring team template?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${departmentId}/hiring-teams/${templateId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to delete template");
        return;
      }

      window.location.reload();
    } catch (error) {
      alert("Error deleting template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (templateId: string) => {
    if (!selectedMemberUserId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${departmentId}/hiring-teams/${templateId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMemberUserId,
          role: selectedMemberRole
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to add member");
        return;
      }

      setSelectedMemberUserId("");
      setSelectedMemberRole("recruiter");
      setShowAddMemberForm(null);
      window.location.reload();
    } catch (error) {
      alert("Error adding member");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (templateId: string, userId: string, role: HiringTeamRole) => {
    if (!confirm(`Remove this team member?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${departmentId}/hiring-teams/${templateId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role
        })
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to remove member");
        return;
      }

      window.location.reload();
    } catch (error) {
      alert("Error removing member");
      console.error(error);
    } finally {
      setLoading(false);
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
              disabled={loading}
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
              disabled={loading}
              className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-[color:var(--app-text)]"
            />
          </label>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim() || loading}
            >
              Create
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCreateForm(false)}
              disabled={loading}
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
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={loading}
                    className="p-1.5 hover:bg-[color:var(--app-surface)] rounded-lg text-[color:var(--app-muted)] disabled:opacity-50"
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
                          handleRemoveMember(template.id, member.user.id, member.role)
                        }
                        disabled={loading}
                        className="p-1 hover:bg-[color:var(--app-surface-soft)] rounded text-[color:var(--app-muted)] disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {teamUsers.length > 0 && (
                <div className="border-t border-[color:var(--app-border)] pt-2">
                  {showAddMemberForm === template.id ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-[color:var(--app-text)]">
                        Select team member
                      </label>
                      <select
                        value={selectedMemberUserId}
                        onChange={(e) => setSelectedMemberUserId(e.target.value)}
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
                      <label className="block text-xs font-medium text-[color:var(--app-text)] mt-2">
                        Select role
                      </label>
                      <select
                        value={selectedMemberRole}
                        onChange={(e) => setSelectedMemberRole(e.target.value as HiringTeamRole)}
                        disabled={loading}
                        className="w-full rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-2 py-1.5 text-xs text-[color:var(--app-text)]"
                      >
                        {allRoles.map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAddMember(template.id)}
                          disabled={!selectedMemberUserId || loading}
                          className="flex-1 px-2 py-1.5 rounded-[10px] bg-brand-500 text-white text-xs font-medium disabled:opacity-50"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddMemberForm(null)}
                          disabled={loading}
                          className="flex-1 px-2 py-1.5 rounded-[10px] border border-[color:var(--app-border)] text-xs font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddMemberForm(template.id)}
                      disabled={loading}
                      className="w-full text-left text-xs p-2 rounded hover:bg-[color:var(--app-surface)] text-[color:var(--app-text)] disabled:opacity-50"
                    >
                      + Add team member
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
