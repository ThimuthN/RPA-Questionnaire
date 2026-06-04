"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useMemo } from "react";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { RolePicker } from "@/components/roles/RolePicker";
import { resumeSourceOptions } from "@/lib/candidates/types";

type HiringTeamRole = "owner" | "recruiter" | "hiring_manager" | "interviewer" | "reviewer" | "final_approver";

interface HiringTeamTemplate {
  id: string;
  name: string;
  description?: string;
  members: Array<{
    user: { id: string; name: string | null; email: string };
    role: HiringTeamRole;
  }>;
}

interface TeamUser {
  id: string;
  name: string | null;
  email: string;
}

const roleLabels: Record<HiringTeamRole, string> = {
  owner: "Owner",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  interviewer: "Interviewer",
  reviewer: "Reviewer",
  final_approver: "Final Approver"
};

export function NewCandidateForm({
  departments,
  error,
  defaultDepartmentId
}: {
  departments: Array<{ id: string; name: string }>;
  error?: string;
  defaultDepartmentId?: string;
}) {
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId || "");
  const [templates, setTemplates] = useState<HiringTeamTemplate[]>([]);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [manualTeamMembers, setManualTeamMembers] = useState<Array<{ userId: string; role: HiringTeamRole }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<HiringTeamRole>("owner");
  const [loadingTeams, setLoadingTeams] = useState(false);

  const allRoles: HiringTeamRole[] = ["owner", "recruiter", "hiring_manager", "interviewer", "reviewer", "final_approver"];

  const templateMembers = useMemo(() => {
    if (!selectedTemplate) return [];
    const template = templates.find((t) => t.id === selectedTemplate);
    return template?.members || [];
  }, [selectedTemplate, templates]);

  const effectiveTeamMembers = useMemo(() => {
    if (selectedTemplate) {
      return templateMembers.map((m) => ({ userId: m.user.id, role: m.role }));
    }
    return manualTeamMembers;
  }, [selectedTemplate, templateMembers, manualTeamMembers]);

  const hasOwner = effectiveTeamMembers.some((m) => m.role === "owner");
  const availableTeamUsers = teamUsers.filter((u) => !effectiveTeamMembers.some((m) => m.userId === u.id));

  const handleDepartmentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeptId = e.target.value;
    setDepartmentId(newDeptId);
    setSelectedTemplate("");
    setManualTeamMembers([]);

    if (!newDeptId) {
      setTemplates([]);
      setTeamUsers([]);
      return;
    }

    setLoadingTeams(true);
    try {
      const res = await fetch(`/api/departments/${newDeptId}/hiring-teams`);
      if (!res.ok) {
        console.error("Failed to load hiring teams");
        setTemplates([]);
        setTeamUsers([]);
        return;
      }
      const data = await res.json();
      setTemplates(data.templates || []);

      const userRes = await fetch(`/api/departments/${newDeptId}/team-users`);
      if (!userRes.ok) {
        console.error("Failed to load department users");
        setTeamUsers([]);
        return;
      }
      const userData = await userRes.json();
      setTeamUsers(userData.users || []);
    } catch (error) {
      console.error("Error loading teams:", error);
      setTemplates([]);
      setTeamUsers([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleAddManualMember = () => {
    if (!selectedUserId) return;

    const isDuplicate = manualTeamMembers.some(
      (m) => m.userId === selectedUserId && m.role === selectedRole
    );

    if (isDuplicate) {
      alert("This team member with this role is already added");
      return;
    }

    setManualTeamMembers([...manualTeamMembers, { userId: selectedUserId, role: selectedRole }]);
    setSelectedUserId("");
    setSelectedRole("owner");
  };

  const handleRemoveManualMember = (userId: string, role: HiringTeamRole) => {
    setManualTeamMembers(manualTeamMembers.filter((m) => !(m.userId === userId && m.role === role)));
  };

  const canSubmit = (() => {
    if (!departmentId) return false;
    if (selectedTemplate) return hasOwner;
    if (manualTeamMembers.length === 0) return false;
    return hasOwner;
  })();

  return (
    <form action="/api/candidates" method="post" className="space-y-4" onSubmit={(e) => {
      if (!canSubmit) {
        e.preventDefault();
        alert("Please select a hiring team with at least one owner.");
      }
    }}>
      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Full name</span>
        <input
          name="fullName"
          required
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Email</span>
        <input
          name="email"
          type="email"
          required
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-sm text-[color:var(--app-text)]">Department</span>
        <select
          name="departmentId"
          required
          value={departmentId}
          onChange={handleDepartmentChange}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        >
          <option value="">Select department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>

      <RolePicker
        name="roleId"
        label="Job designation"
        departmentId={departmentId || null}
        defaultValue={null}
        placeholder={departmentId ? "Select job designation" : "Select a department first"}
        helperText="Choose the job designation this candidate is being considered for."
      />

      <div className="grid gap-2">
        <span className="text-sm text-[color:var(--app-text)]">Source</span>
        <ChoicePills
          name="resumeSource"
          idPrefix="new-candidate-source"
          defaultValue=""
          options={[
            { value: "", label: "Skip" },
            ...resumeSourceOptions.map((option) => ({ value: option, label: option }))
          ]}
        />
      </div>

      <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[color:var(--app-text)] mb-2">
            Hiring team (required)
          </label>
          <p className="text-xs text-[color:var(--app-muted)] mb-3">
            Select a team template or manually assign team members.
          </p>
        </div>

        {!departmentId ? (
          <div className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3">
            <p className="text-xs text-[color:var(--app-muted)]">
              Select a department first to see available hiring team templates.
            </p>
          </div>
        ) : loadingTeams ? (
          <div className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3">
            <p className="text-xs text-[color:var(--app-muted)]">Loading team templates...</p>
          </div>
        ) : templates.length === 0 && teamUsers.length === 0 ? (
          <div className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3">
            <p className="text-xs text-[color:var(--app-muted)]">
              This department has no team members. Add team members in the{" "}
              <Link href={`/departments/${departmentId}/users` as Route} className="text-brand-500 hover:text-brand-600">
                Team settings
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[color:var(--app-text)] mb-2">
                  Use a template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setManualTeamMembers([]);
                  }}
                  className="w-full rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs text-[color:var(--app-text)]"
                >
                  <option value="">No template - manual selection</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.members.length} member{template.members.length !== 1 ? "s" : ""})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTemplate ? (
              <div className="rounded-[12px] bg-[color:var(--app-surface)] p-3 border border-[color:var(--app-border)]">
                <p className="text-xs font-medium text-[color:var(--app-text)] mb-2">Template members:</p>
                <div className="space-y-1">
                  {templateMembers.length === 0 ? (
                    <p className="text-xs text-[color:var(--app-muted)]">No members in this template</p>
                  ) : (
                    templateMembers.map((member) => (
                      <div key={`${member.user.id}-${member.role}`} className="text-xs text-[color:var(--app-text)]">
                        {member.user.name || member.user.email} — <span className="text-[color:var(--app-muted)]">{roleLabels[member.role]}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[color:var(--app-text)] mb-2">
                    Select team member
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs text-[color:var(--app-text)]"
                  >
                    <option value="">Choose a team member</option>
                    {availableTeamUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[color:var(--app-text)] mb-2">
                    Job designation role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as HiringTeamRole)}
                    className="w-full rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs text-[color:var(--app-text)]"
                  >
                    {allRoles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddManualMember}
                  disabled={!selectedUserId}
                  className="w-full px-3 py-2 rounded-[12px] border border-[color:var(--app-border)] text-xs font-medium text-[color:var(--app-text)] hover:bg-[color:var(--app-surface)] disabled:opacity-50"
                >
                  Add team member
                </button>

                {manualTeamMembers.length > 0 && (
                  <div className="rounded-[12px] bg-[color:var(--app-surface)] p-3 border border-[color:var(--app-border)]">
                    <p className="text-xs font-medium text-[color:var(--app-text)] mb-2">Selected team:</p>
                    <div className="space-y-1">
                      {manualTeamMembers.map((member) => {
                        const user = teamUsers.find((u) => u.id === member.userId);
                        return (
                          <div key={`${member.userId}-${member.role}`} className="flex items-center justify-between text-xs text-[color:var(--app-text)]">
                            <span>
                              {user?.name || user?.email} — <span className="text-[color:var(--app-muted)]">{roleLabels[member.role]}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveManualMember(member.userId, member.role)}
                              className="text-[color:var(--app-muted)] hover:text-[color:var(--app-danger)] text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasOwner && effectiveTeamMembers.length > 0 && (
              <div className="rounded-[12px] bg-[color:var(--app-danger)]/10 border border-[color:var(--app-danger)]/30 p-3">
                <p className="text-xs text-[color:var(--app-danger)] font-medium">
                  Team must have at least one owner.
                </p>
              </div>
            )}
          </div>
        )}

        <input
          type="hidden"
          name="teamUserIds"
          value={JSON.stringify(effectiveTeamMembers)}
        />
      </div>

      {error ? <p className="text-sm text-[color:var(--app-danger)]">{error}</p> : null}

      <p className="text-sm text-[color:var(--app-muted)]">You can upload the resume and send a screening assessment after this.</p>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!canSubmit}>
          Save candidate
        </Button>
        <Link href={"/people/candidates" as Route}>
          <Button type="button" variant="secondary">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
