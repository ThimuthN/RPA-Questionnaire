"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { NominateToDeptModal } from "@/components/candidates/NominateToDeptModal";

type DepartmentCandidacyStatus = "active" | "talent_pool" | "dept_rejected";

const statusLabels: Record<DepartmentCandidacyStatus, string> = {
  active: "Active",
  talent_pool: "Talent Pool",
  dept_rejected: "Passed"
};

const statusTones: Record<DepartmentCandidacyStatus, "neutral" | "amber" | "emerald"> = {
  active: "neutral",
  talent_pool: "amber",
  dept_rejected: "emerald"
};

interface DepartmentCandidacy {
  id: string;
  candidateId: string;
  departmentId: string;
  roleId?: string;
  hrOwnerId?: string;
  status: DepartmentCandidacyStatus;
  source: "manual" | "job_application" | "nominated";
  nominatedBy?: string;
  nominationNote?: string;
  jobPostingId?: string;
  departmentName: string;
  roleName?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeptCandidacyPanelProps {
  candidateId: string;
  candidacies: DepartmentCandidacy[];
  onCandidacyChange?: () => void;
}

export function DeptCandidacyPanel({
  candidateId,
  candidacies,
  onCandidacyChange
}: DeptCandidacyPanelProps) {
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (candidacyId: string, newStatus: DepartmentCandidacyStatus) => {
    setIsUpdatingId(candidacyId);
    try {
      const response = await fetch(`/api/candidacies/${candidacyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        onCandidacyChange?.();
      }
    } catch (err) {
      console.error("Failed to update candidacy status:", err);
    } finally {
      setIsUpdatingId(null);
    }
  };

  if (candidacies.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <p className="text-sm text-[color:var(--app-muted)]">No active department candidacies yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidacies.map((candidacy) => (
        <div
          key={candidacy.id}
          className="rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[color:var(--app-heading)]">
                {candidacy.departmentName}
              </p>
              {candidacy.roleName && (
                <p className="text-xs text-[color:var(--app-muted)]">{candidacy.roleName}</p>
              )}
            </div>
            <select
              value={candidacy.status}
              onChange={(e) =>
                handleStatusChange(candidacy.id, e.target.value as DepartmentCandidacyStatus)
              }
              disabled={isUpdatingId === candidacy.id}
              className="text-xs rounded-[8px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-2 py-1 text-[color:var(--app-text)] focus:outline-none focus:ring-1 focus:ring-brand-300/60"
            >
              <option value="active">Active</option>
              <option value="talent_pool">Talent Pool</option>
              <option value="dept_rejected">Passed</option>
            </select>
          </div>

          {candidacy.nominationNote && (
            <div className="text-xs bg-[color:var(--app-surface)] rounded-[8px] p-2 text-[color:var(--app-text)]">
              <span className="font-medium">Note: </span>
              {candidacy.nominationNote}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[color:var(--app-muted)]">
            <span>
              {candidacy.source === "job_application" && "From job application"}
              {candidacy.source === "nominated" && "Cross-nominated"}
              {candidacy.source === "manual" && "Manually added"}
            </span>
            {candidacy.hrOwnerId && (
              <span>Owner: {candidacy.hrOwnerId}</span>
            )}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsNominateModalOpen(true)}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Nominate to Another Department
      </Button>

      <NominateToDeptModal
        isOpen={isNominateModalOpen}
        onClose={() => setIsNominateModalOpen(false)}
        candidateId={candidateId}
        onSuccess={() => {
          setIsNominateModalOpen(false);
          onCandidacyChange?.();
        }}
      />
    </div>
  );
}
